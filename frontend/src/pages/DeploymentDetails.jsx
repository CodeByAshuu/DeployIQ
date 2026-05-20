import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDeployment, triggerDeployment } from '../services/deployment.js';

export default function DeploymentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deployment, setDeployment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isTriggering, setIsTriggering] = useState(false);
  const terminalEndRef = useRef(null);

  useEffect(() => {
    fetchDeployment();
    
    // Poll logs/status if deployment is in progress
    const interval = setInterval(() => {
      fetchDeployment(true); // silent fetch
    }, 2500);

    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    // Auto scroll terminal to bottom when new logs arrive
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [deployment?.logs]);

  const fetchDeployment = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const data = await getDeployment(id);
      setDeployment(data);
      setError('');
    } catch (err) {
      console.error(err);
      if (!silent) setError('Failed to fetch deployment details.');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const handleTriggerSimulate = async () => {
    setIsTriggering(true);
    try {
      await triggerDeployment(id);
      fetchDeployment();
    } catch (err) {
      console.error(err);
      alert('Failed to trigger deployment simulation.');
    } finally {
      setIsTriggering(false);
    }
  };

  if (isLoading) {
    return (
      <div className="font-mono text-gray-500 text-center py-12">
        Loading deployment execution registry...
      </div>
    );
  }

  if (error || !deployment) {
    return (
      <div className="font-mono text-gray-300 space-y-4">
        <div className="bg-rose-950/20 border border-rose-500/20 text-rose-400 p-4 rounded-lg text-xs">
          [ERROR] {error || 'Deployment registry not found or access denied.'}
        </div>
        <button
          onClick={() => navigate('/deployments')}
          className="text-xs bg-[#242424] border border-white/10 px-4 py-2 rounded text-gray-400 hover:text-white"
        >
          &lt; Back to deployments
        </button>
      </div>
    );
  }

  const inProgress = ['PENDING', 'BUILDING', 'RUNNING'].includes(deployment.status);

  // Parse logs to detect active steps for timeline indicators
  const hasGit = deployment.logs?.includes('GitHub Pull');
  const gitSuccess = deployment.logs?.includes('GitHub Pull: Completed successfully.');
  const hasDocker = deployment.logs?.includes('Docker Build');
  const dockerSuccess = deployment.logs?.includes('Docker Build: Image build complete.');
  const hasContainer = deployment.logs?.includes('Container Startup');
  const containerSuccess = deployment.logs?.includes('Container started successfully.');
  const hasHealth = deployment.logs?.includes('Health Check');
  const healthSuccess = deployment.logs?.includes('Health Check: Service is responding and healthy!');
  const hasSuccess = deployment.status === 'SUCCESS';
  const hasFailed = deployment.status === 'FAILED';

  const steps = [
    { title: 'GitHub Pull', active: hasGit, success: gitSuccess, desc: 'Clone repository & fetch code' },
    { title: 'Docker Build', active: hasDocker, success: dockerSuccess, desc: 'Build image from Dockerfile' },
    { title: 'Container Startup', active: hasContainer, success: containerSuccess, desc: 'Spin up container instances' },
    { title: 'Health Check', active: hasHealth, success: healthSuccess, desc: 'Verify app responsiveness' },
    { title: 'Release Success', active: hasSuccess, success: hasSuccess, failed: hasFailed, desc: 'App is routing live traffic' },
  ];

  return (
    <div className="space-y-6 font-mono text-gray-300">
      {/* Header breadcrumb */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => navigate('/deployments')}
          className="text-xs bg-[#242424] hover:bg-[#2e2e2e] border border-white/5 px-3 py-1.5 rounded text-gray-400 hover:text-white transition-colors"
        >
          &lt; back_to_deployments
        </button>
        <div className="text-xs text-gray-500">
          DEPLOYMENT_ID: <span className="text-white">{deployment.id}</span>
        </div>
      </div>

      {/* Info Card & Action */}
      <div className="bg-[#242424] p-6 rounded-xl border border-white/5 shadow-lg grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-2">
          <h2 className="text-lg font-bold text-white tracking-wider flex items-center space-x-2">
            <span>Project: {deployment.project?.name}</span>
          </h2>
          <p className="text-xs text-gray-500">
            Image Tag: <span className="text-gray-400 font-semibold">{deployment.imageTag || 'latest'}</span> • 
            Started: <span className="text-gray-400">{new Date(deployment.deployedAt).toLocaleString()}</span>
          </p>
          <div className="pt-2 flex items-center space-x-3 text-xs">
            <span className="text-gray-500">STATUS:</span>
            {deployment.status === 'SUCCESS' && (
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950 border border-emerald-500/30 text-emerald-400">
                SUCCESS
              </span>
            )}
            {deployment.status === 'BUILDING' && (
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-950 border border-amber-500/30 text-amber-400 animate-pulse">
                BUILDING
              </span>
            )}
            {deployment.status === 'RUNNING' && (
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-sky-950 border border-sky-500/30 text-sky-400 animate-pulse">
                RUNNING
              </span>
            )}
            {deployment.status === 'FAILED' && (
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-rose-950 border border-rose-500/30 text-rose-400">
                FAILED
              </span>
            )}
            {deployment.status === 'PENDING' && (
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-zinc-900 border border-zinc-500/30 text-zinc-400">
                PENDING
              </span>
            )}
          </div>
        </div>
        <div className="flex md:justify-end items-center">
          {deployment.status === 'PENDING' && (
            <button
              onClick={handleTriggerSimulate}
              disabled={isTriggering}
              className="w-full md:w-auto bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-400 hover:text-emerald-300 font-bold px-6 py-2.5 rounded-lg text-xs tracking-wider transition-all cursor-pointer"
            >
              {isTriggering ? '$ executing...' : '$ trigger_pipeline'}
            </button>
          )}
          {inProgress && (
            <div className="text-xs text-amber-400 flex items-center space-x-2 bg-amber-950/20 border border-amber-500/10 px-4 py-2.5 rounded-lg">
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping"></span>
              <span>SIMULATING PIPELINE AGENT RUNNING...</span>
            </div>
          )}
          {(!inProgress && deployment.status !== 'PENDING') && (
            <button
              onClick={handleTriggerSimulate}
              disabled={isTriggering}
              className="w-full md:w-auto bg-[#1a1a1a] hover:bg-[#202020] border border-white/10 hover:border-white/20 text-gray-400 hover:text-white px-5 py-2.5 rounded-lg text-xs transition-colors cursor-pointer"
            >
              $ re_deploy_simulation
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Pipeline steps (Left) and logs (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Timeline steps */}
        <div className="lg:col-span-1 bg-[#242424] p-5 rounded-xl border border-white/5 h-fit space-y-6">
          <h3 className="text-xs font-bold text-white border-b border-white/5 pb-2 uppercase tracking-wider">
            Pipeline Steps
          </h3>
          <div className="space-y-4 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-white/10">
            {steps.map((step, idx) => {
              let circleColor = 'bg-zinc-800 border-zinc-700 text-gray-600';
              if (step.active) {
                circleColor = 'bg-amber-950 border-amber-500 text-amber-400 animate-pulse';
              }
              if (step.success) {
                circleColor = 'bg-emerald-950 border-emerald-500 text-emerald-400';
              }
              if (step.failed) {
                circleColor = 'bg-rose-950 border-rose-500 text-rose-400';
              }

              return (
                <div key={idx} className="flex space-x-3 relative z-10">
                  <div className={`w-4.5 h-4.5 rounded-full border text-[9px] flex items-center justify-center font-bold ${circleColor} shrink-0 mt-0.5`}>
                    {step.success ? '✓' : step.failed ? '✗' : idx + 1}
                  </div>
                  <div>
                    <h4 className={`text-xs font-semibold ${step.active || step.success ? 'text-white' : 'text-gray-500'}`}>
                      {step.title}
                    </h4>
                    <p className="text-[10px] text-gray-600 mt-0.5">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Logs terminal */}
        <div className="lg:col-span-3 bg-[#0d0d0d] rounded-xl border border-white/5 overflow-hidden flex flex-col shadow-2xl h-[500px]">
          {/* Terminal Title Bar */}
          <div className="bg-[#141414] px-4 py-2 border-b border-white/5 flex items-center justify-between text-xs text-gray-500 shrink-0">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/40"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/40"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/40"></span>
              <span className="pl-2 font-mono text-[10px] tracking-wider text-gray-400 uppercase">
                stdout_stream // {deployment.project?.name}
              </span>
            </div>
            <div className="text-[10px]">
              {inProgress ? '● POLLING_LIVE' : '● LOGS_RESOLVED'}
            </div>
          </div>
          {/* Terminal Output */}
          <div className="flex-1 p-6 overflow-y-auto font-mono text-xs leading-relaxed text-zinc-300 space-y-1 selection:bg-white/10 select-text">
            {deployment.logs ? (
              deployment.logs.split('\n').map((line, idx) => {
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
              <div className="text-zinc-600 italic">Initializing build streams... no logs generated yet.</div>
            )}
            <div ref={terminalEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
