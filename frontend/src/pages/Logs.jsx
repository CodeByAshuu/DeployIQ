import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { getDeployments, getDeployment } from '../services/deployment.js';
import { listContainers, getContainerLogs } from '../services/docker.js';

export default function Logs() {
  const location = useLocation();
  const [logSource, setLogSource] = useState('deployment'); // 'deployment' or 'container'
  
  // Lists for dropdown selection
  const [deployments, setDeployments] = useState([]);
  const [containers, setContainers] = useState([]);
  
  // Selected IDs
  const [selectedDeploymentId, setSelectedDeploymentId] = useState('');
  const [selectedContainerId, setSelectedContainerId] = useState('');
  
  // Log content & state
  const [logs, setLogs] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [error, setError] = useState('');
  
  const terminalEndRef = useRef(null);

  // Fetch log source lists — stable reference, runs once on mount
  const fetchMetadata = useCallback(async () => {
    let mounted = true;
    try {
      const [deploys, conts] = await Promise.all([getDeployments(), listContainers()]);
      if (!mounted) return;

      setDeployments(deploys);
      if (deploys.length > 0) {
        setSelectedDeploymentId(deploys[0].id);
      }

      setContainers(conts);

      // If navigated from container monitoring page, auto-select it
      if (location.state?.containerId) {
        setLogSource('container');
        setSelectedContainerId(location.state.containerId);
      } else if (conts.length > 0) {
        setSelectedContainerId(conts[0].id);
      }
    } catch (err) {
      console.error(err);
      if (mounted) setError('Failed to fetch initial metadata list.');
    }
    return () => { mounted = false; };
  }, [location.state?.containerId]);

  // Initial load — runs only once
  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  // Fetch the active log stream — stable reference, re-created when source/selection changes
  const fetchLogs = useCallback(async (silent = false) => {
    if (logSource === 'deployment' && !selectedDeploymentId) return;
    if (logSource === 'container' && !selectedContainerId) return;

    let mounted = true;
    try {
      if (!silent && mounted) setIsLoading(true);
      if (mounted) setError('');

      if (logSource === 'deployment') {
        const data = await getDeployment(selectedDeploymentId);
        if (mounted) setLogs(data.logs || 'Initial state. Logs pending...\n');
      } else {
        const data = await getContainerLogs(selectedContainerId);
        if (mounted) setLogs(data.logs || data || 'Docker container stream initialized. No standard output yet.\n');
      }
    } catch (err) {
      console.error(err);
      if (!silent && mounted) setError('Failed to retrieve log stream.');
    } finally {
      if (!silent && mounted) setIsLoading(false);
    }
    return () => { mounted = false; };
  }, [logSource, selectedDeploymentId, selectedContainerId]);

  // Poll log content — re-registers interval when source/selection/autoRefresh changes
  useEffect(() => {
    // Async wrapper to call inside effect
    const runFetch = () => { fetchLogs(true); };

    runFetch(); // immediate fetch on mount / dependency change

    if (!autoRefresh) return;

    const interval = setInterval(runFetch, 3000);
    return () => clearInterval(interval);
  }, [fetchLogs, autoRefresh]);

  // Scroll to bottom on new logs
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const handleSourceChange = useCallback((source) => {
    setLogSource(source);
    setLogs('');
    setError('');
  }, []);

  // Filter logs based on search query
  const filteredLogs = logs
    ? logs
        .split('\n')
        .filter((line) => line.toLowerCase().includes(searchQuery.toLowerCase()))
        .join('\n')
    : '';

  return (
    <div className="space-y-6 font-mono text-gray-300">
      {/* Header Panel */}
      <header className="bg-[#242424] p-6 rounded-xl border border-white/5 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-500 font-bold">$</span>
            <h1 className="text-xl font-bold text-white tracking-wider">
              tail -f /var/log/deployiq/stdout
            </h1>
          </div>
          <p className="text-[11px] text-gray-500 mt-2">
            Standard Output Multiplexer • Deployment &amp; Container Stream Viewer
          </p>
        </div>
        
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex bg-[#1a1a1a] rounded border border-white/10 p-0.5 shrink-0">
            <button
              onClick={() => handleSourceChange('deployment')}
              className={`px-3 py-1.5 rounded text-[10px] uppercase font-bold transition-all cursor-pointer ${
                logSource === 'deployment' ? 'bg-white/5 text-white font-semibold' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Pipeline Logs
            </button>
            <button
              onClick={() => handleSourceChange('container')}
              className={`px-3 py-1.5 rounded text-[10px] uppercase font-bold transition-all cursor-pointer ${
                logSource === 'container' ? 'bg-white/5 text-white font-semibold' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Docker Logs
            </button>
          </div>

          <label className="flex items-center space-x-2 text-gray-500 cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="accent-white cursor-pointer"
            />
            <span className="text-[10px] uppercase font-bold tracking-wider">Auto Refresh</span>
          </label>
        </div>
      </header>

      {/* Selectors and Search bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Selection Dropdown */}
        <div className="md:col-span-1">
          {logSource === 'deployment' ? (
            <select
              value={selectedDeploymentId}
              onChange={(e) => setSelectedDeploymentId(e.target.value)}
              className="w-full bg-[#242424] text-white border border-white/10 px-4 py-2.5 rounded-lg text-xs outline-none focus:border-white/20 transition-all font-mono"
            >
              <option value="" disabled>Select Pipeline Execution</option>
              {deployments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.project?.name} ({d.id.slice(0, 8)}... - {d.status})
                </option>
              ))}
            </select>
          ) : (
            <select
              value={selectedContainerId}
              onChange={(e) => setSelectedContainerId(e.target.value)}
              className="w-full bg-[#242424] text-white border border-white/10 px-4 py-2.5 rounded-lg text-xs outline-none focus:border-white/20 transition-all font-mono"
            >
              <option value="" disabled>Select Docker Container</option>
              {containers.map((c) => {
                const name = c.names[0] ? c.names[0].replace(/^\//, '') : c.id.slice(0, 12);
                return (
                  <option key={c.id} value={c.id}>
                    {name} ({c.state})
                  </option>
                );
              })}
            </select>
          )}
        </div>

        {/* Filter input */}
        <div className="md:col-span-2">
          <input
            type="text"
            placeholder="Search / grep logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#242424] text-white border border-white/10 px-4 py-2.5 rounded-lg text-xs outline-none focus:border-white/20 transition-all font-mono"
          />
        </div>
      </div>

      {error && (
        <div className="bg-rose-950/20 border border-rose-500/20 text-rose-400 p-4 rounded-lg text-xs">
          [ERROR] {error}
        </div>
      )}

      {/* Terminal Display */}
      <div className="bg-[#0d0d0d] rounded-xl border border-white/5 overflow-hidden flex flex-col shadow-2xl h-[550px]">
        {/* Terminal Title Bar */}
        <div className="bg-[#141414] px-4 py-2 border-b border-white/5 flex items-center justify-between text-xs text-gray-500 shrink-0">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/40"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/40"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/40"></span>
            <span className="pl-2 font-mono text-[10px] tracking-wider text-gray-400 uppercase">
              {logSource === 'deployment' ? 'pipeline_execution_stream' : 'docker_container_stdout'}
            </span>
          </div>
          <div className="text-[10px] flex items-center space-x-2">
            {isLoading && <span className="animate-spin text-gray-400">⚡</span>}
            <span>{autoRefresh ? '● LIVE_POLLING' : '● IDLE'}</span>
          </div>
        </div>
        {/* Terminal Output */}
        <div className="flex-1 p-6 overflow-y-auto font-mono text-xs leading-relaxed text-zinc-300 space-y-1 selection:bg-white/10 select-text">
          {filteredLogs ? (
            filteredLogs.split('\n').map((line, idx) => {
              let colorClass = 'text-zinc-300';
              if (line.includes('Failed') || line.includes('Error') || line.includes('❌') || line.includes('[FATAL ERROR]')) {
                colorClass = 'text-rose-400 font-bold';
              } else if (line.includes('✓') || line.includes('✅') || line.includes('succeeded') || line.includes('Success')) {
                colorClass = 'text-emerald-400';
              } else if (line.includes('📥') || line.includes('🐳') || line.includes('🚀') || line.includes('🩺') || line.includes('🎉')) {
                colorClass = 'text-sky-300 font-bold';
              } else if (line.startsWith('-') || line.startsWith('--->')) {
                colorClass = 'text-zinc-500';
              }
              return (
                <div key={idx} className={colorClass}>
                  {line}
                </div>
              );
            })
          ) : (
            <div className="text-zinc-600 italic">
              {searchQuery ? 'Grep filter returned empty set.' : 'Standard stream is empty.'}
            </div>
          )}
          <div ref={terminalEndRef} />
        </div>
      </div>
    </div>
  );
}
