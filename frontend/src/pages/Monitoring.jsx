import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listContainers, startContainer, stopContainer, restartContainer, getContainerDetails } from '../services/docker.js';

export default function Monitoring() {
  const navigate = useNavigate();
  const [containers, setContainers] = useState([]);
  const [containerStats, setContainerStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actioningId, setActioningId] = useState(null);

  useEffect(() => {
    fetchContainers();
    const interval = setInterval(fetchContainers, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchContainers = async () => {
    try {
      const data = await listContainers();
      setContainers(data);
      setError('');

      // Fetch stats for all running containers asynchronously
      data.forEach(async (c) => {
        if (c.state === 'running') {
          try {
            const stats = await getContainerDetails(c.id);
            setContainerStats((prev) => ({
              ...prev,
              [c.id]: stats,
            }));
          } catch (err) {
            console.error(`Failed to fetch stats for ${c.id}:`, err);
          }
        }
      });
    } catch (err) {
      console.error(err);
      setError('Could not establish connection with Docker daemon socket.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    setActioningId(id);
    try {
      if (action === 'start') {
        await startContainer(id);
      } else if (action === 'stop') {
        await stopContainer(id);
      } else if (action === 'restart') {
        await restartContainer(id);
      }
      await fetchContainers();
    } catch (err) {
      console.error(err);
      alert(`Docker socket action failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setActioningId(null);
    }
  };

  const runningContainers = containers.filter((c) => c.state === 'running').length;
  const stoppedContainers = containers.filter((c) => c.state !== 'running').length;

  // Calculate averages
  let totalCpu = 0;
  let totalMem = 0;
  let memUsageBytes = 0;
  let memLimitBytes = 0;
  let statsCount = 0;

  Object.values(containerStats).forEach((stats) => {
    if (stats && !stats.error) {
      totalCpu += stats.cpuPercent || 0;
      totalMem += stats.memoryPercent || 0;
      memUsageBytes += stats.memoryUsageBytes || 0;
      memLimitBytes = Math.max(memLimitBytes, stats.memoryLimitBytes || 0);
      statsCount++;
    }
  });

  const avgCpu = statsCount > 0 ? (totalCpu / statsCount).toFixed(1) : '0.0';
  const avgMem = statsCount > 0 ? (totalMem / statsCount).toFixed(1) : '0.0';
  const memUsageGB = (memUsageBytes / (1024 * 1024 * 1024)).toFixed(2);
  const memLimitGB = memLimitBytes > 0 ? (memLimitBytes / (1024 * 1024 * 1024)).toFixed(1) : '8.0';

  return (
    <div className="space-y-6 font-mono text-gray-300">
      {/* Header Panel */}
      <header className="bg-[#242424] p-6 rounded-xl border border-white/5 shadow-lg flex justify-between items-center">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-500 font-bold">$</span>
            <h1 className="text-xl font-bold text-white tracking-wider">
              docker ps -a --format "table"
            </h1>
          </div>
          <p className="text-[11px] text-gray-500 mt-2">
            Real-time Campus Virtual Container Network Management
          </p>
        </div>
        <button
          onClick={fetchContainers}
          className="text-xs bg-[#1a1a1a] hover:bg-[#202020] border border-white/10 px-4 py-2 rounded text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          $ refresh
        </button>
      </header>

      {error && (
        <div className="bg-rose-950/20 border border-rose-500/20 text-rose-400 p-4 rounded-lg text-xs">
          [DOCKER CONNECTION FAILURE] {error}
        </div>
      )}

      {/* Micro Metrics Panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {[
          { label: 'CONTAINERS RUNNING', value: runningContainers, statusClass: 'text-emerald-400 shadow-[0_0_6px_#10b981]' },
          { label: 'CONTAINERS STOPPED', value: stoppedContainers, statusClass: 'text-gray-400' },
          { label: 'AVG SYSTEM CPU %', value: `${avgCpu}%`, statusClass: 'text-sky-400' },
          { label: 'AVG MEMORY %', value: `${avgMem}%`, valueSub: `${memUsageGB}GB / ${memLimitGB}GB`, statusClass: 'text-amber-400' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-[#242424] p-5 rounded-xl border border-white/5 shadow-md flex flex-col justify-between">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{stat.label}</span>
            <div className="mt-2.5 flex items-baseline space-x-2">
              <span className={`text-2xl font-bold font-mono tracking-tight ${stat.statusClass}`}>{stat.value}</span>
              {stat.valueSub && <span className="text-[10px] text-gray-500">{stat.valueSub}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Container Listing */}
      {isLoading && containers.length === 0 ? (
        <div className="bg-[#242424] p-12 text-center rounded-xl border border-white/5 text-gray-500 text-xs">
          Querying Docker socket loopback interface...
        </div>
      ) : containers.length === 0 ? (
        <div className="bg-[#242424] p-12 text-center rounded-xl border border-white/5 text-gray-500 text-xs">
          No virtual containers discovered on current platform node.
        </div>
      ) : (
        <div className="bg-[#242424] rounded-xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#2a2a2a] text-xs text-gray-400 border-b border-white/5">
                  <th className="px-6 py-3.5 font-semibold">CONTAINER NAME</th>
                  <th className="px-6 py-3.5 font-semibold">IMAGE</th>
                  <th className="px-6 py-3.5 font-semibold">STATE</th>
                  <th className="px-6 py-3.5 font-semibold">STATS (CPU/MEM)</th>
                  <th className="px-6 py-3.5 font-semibold">PORTS</th>
                  <th className="px-6 py-3.5 font-semibold text-right">CONTROLS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {containers.map((c) => {
                  const cleanName = c.names[0] ? c.names[0].replace(/^\//, '') : 'unnamed';
                  const isRunning = c.state === 'running';
                  const stats = containerStats[c.id];

                  // Formulate clean ports display
                  const portsDisplay = c.ports && c.ports.length > 0 
                    ? c.ports.map((p) => p.PublicPort ? `${p.PublicPort}:${p.PrivatePort}` : `${p.PrivatePort}`).join(', ')
                    : 'none';

                  return (
                    <tr key={c.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-6 py-4 text-white font-bold font-mono">
                        {cleanName}
                      </td>
                      <td className="px-6 py-4 text-gray-400 font-mono text-[11px] truncate max-w-[200px]" title={c.image}>
                        {c.image}
                      </td>
                      <td className="px-6 py-4">
                        {isRunning ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 border border-emerald-500/30 text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse shadow-[0_0_6px_#10b981]"></span>
                            RUNNING
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-900 border border-zinc-500/30 text-gray-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 mr-1.5"></span>
                            STOPPED
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono text-[11px] text-gray-400">
                        {isRunning ? (
                          stats && !stats.error ? (
                            <span>CPU: {stats.cpuPercent}% | MEM: {stats.memoryPercent}%</span>
                          ) : (
                            <span className="text-zinc-600">calculating...</span>
                          )
                        ) : (
                          <span className="text-zinc-600">n/a</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono text-[11px] text-zinc-500">
                        {portsDisplay}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => navigate('/logs', { state: { containerId: c.id } })}
                            className="bg-[#1a1a1a] hover:bg-[#2c2c2c] border border-white/10 text-gray-300 hover:text-white px-2 py-1 rounded text-[10px] transition-colors"
                          >
                            Logs
                          </button>
                          {isRunning ? (
                            <>
                              <button
                                onClick={() => handleAction(c.id, 'stop')}
                                disabled={actioningId !== null}
                                className="bg-amber-950/20 hover:bg-amber-950/40 border border-amber-500/20 text-amber-400 hover:text-amber-300 px-2 py-1 rounded text-[10px] transition-colors cursor-pointer"
                              >
                                Stop
                              </button>
                              <button
                                onClick={() => handleAction(c.id, 'restart')}
                                disabled={actioningId !== null}
                                className="bg-[#1d2d44]/30 hover:bg-[#1d2d44]/60 border border-blue-500/20 text-blue-400 hover:text-blue-300 px-2 py-1 rounded text-[10px] transition-colors cursor-pointer"
                              >
                                Restart
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleAction(c.id, 'start')}
                              disabled={actioningId !== null}
                              className="bg-emerald-950/20 hover:bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 hover:text-emerald-300 px-2.5 py-1 rounded text-[10px] transition-colors cursor-pointer"
                            >
                              Start
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
