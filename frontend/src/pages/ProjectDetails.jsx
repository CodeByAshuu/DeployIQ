import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProject, deleteProject } from '../services/project.js';
import { createDeployment, triggerDeployment } from '../services/deployment.js';

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [simulatedLogs, setSimulatedLogs] = useState([]);
  const [isDeploying, setIsDeploying] = useState(false);

  useEffect(() => {
    fetchProject();
  }, [id]);

  useEffect(() => {
    if (project) {
      // Simulate microservice telemetry logs
      const messages = [
        `[INFO] Starting telemetry polling for target service key [${project.name}]`,
        `[INFO] Querying system clusters on node [campus-docker-daemon]`,
        `[OK] Connected to source repository repository: ${project.githubRepo}`,
        `[OK] Health check status: ${project.deploymentStatus}`,
        `[INFO] Active port assignments: local proxy routing configured on NGINX`,
        `[INFO] Telemetry active. Awaiting manual campus deployment trigger.`,
      ];
      
      let logIndex = 0;
      const interval = setInterval(() => {
        if (logIndex < messages.length) {
          setSimulatedLogs((prev) => [...prev, `${new Date().toLocaleTimeString()} ${messages[logIndex]}`]);
          logIndex++;
        } else {
          clearInterval(interval);
        }
      }, 800);

      return () => clearInterval(interval);
    }
  }, [project]);

  const fetchProject = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await getProject(id);
      setProject(data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to fetch project telemetry logs.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('WARNING: Destroying this project removes all configuration settings and container telemetry. Proceed?')) {
      return;
    }
    try {
      await deleteProject(id);
      navigate('/projects');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete project.');
    }
  };

  const handleManualDeploy = async () => {
    setIsDeploying(true);
    try {
      const deploy = await createDeployment(id, 'latest');
      await triggerDeployment(deploy.id);
      navigate(`/deployments/${deploy.id}`);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to trigger deployment.');
    } finally {
      setIsDeploying(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full border border-emerald-950 bg-emerald-950/20 text-emerald-400 text-xs font-bold tracking-wide uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 shadow-[0_0_6px_#10b981]"></span>
            Active / Success
          </span>
        );
      case 'DEPLOYING':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full border border-amber-950 bg-amber-950/20 text-amber-400 text-xs font-bold tracking-wide uppercase animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-2 shadow-[0_0_6px_#f59e0b]"></span>
            Deploying...
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full border border-rose-950 bg-rose-950/20 text-rose-400 text-xs font-bold tracking-wide uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-2 shadow-[0_0_6px_#f43f5e]"></span>
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full border border-zinc-900 bg-zinc-900/40 text-zinc-400 text-xs font-bold tracking-wide uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 mr-2"></span>
            Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-white/5 space-y-4 md:space-y-0">
        <div>
          <div className="flex items-center space-x-3">
            <Link to="/projects" className="text-gray-500 hover:text-white transition-colors">
              &lt; Back to Cluster
            </Link>
            <span className="text-white/10">|</span>
            <h1 className="text-lg font-bold text-white tracking-tight">{project?.name || 'Monitoring Node'}</h1>
          </div>
          <p className="text-[10px] text-gray-500 mt-1 select-all font-bold">
            Project UID: {id}
          </p>
        </div>

        {project && (
          <div className="flex items-center space-x-3">
            <Link
              to={`/projects/${id}/edit`}
              className="bg-[#242424] border border-white/10 hover:border-white/20 text-white px-3 py-1.5 rounded font-bold transition-colors"
            >
              Configure
            </Link>
            <button
              onClick={handleDelete}
              className="bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/40 text-rose-400 px-3 py-1.5 rounded font-bold transition-colors cursor-pointer"
            >
              Destroy Node
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin"></div>
          <span className="text-xs text-gray-500 uppercase tracking-widest animate-pulse">Running telemetry scan...</span>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-950/10 border border-red-900/30 rounded-lg text-red-400 flex flex-col space-y-2 max-w-xl">
          <div className="font-bold flex items-center space-x-2">
            <span>[CRITICAL RUNTIME ERROR]</span>
          </div>
          <p>{error}</p>
          <button
            onClick={fetchProject}
            className="self-start text-[10px] underline hover:text-red-300 font-semibold"
          >
            Retry Telemetry Connection
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Specs Left */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#242424] border border-white/5 rounded-lg p-6 space-y-4">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider pb-3 border-b border-white/5">
                Cluster Specifications
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-[10px] text-gray-500 uppercase font-bold">Node Status</div>
                  <div>{getStatusBadge(project.deploymentStatus)}</div>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] text-gray-500 uppercase font-bold">Target Repository</div>
                  <a
                    href={project.githubRepo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-400 hover:text-white transition-colors break-all hover:underline"
                  >
                    {project.githubRepo}
                  </a>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] text-gray-500 uppercase font-bold">Created Session</div>
                  <div className="text-gray-300">
                    {new Date(project.createdAt).toLocaleString(undefined, {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] text-gray-500 uppercase font-bold">Telemetry Logs Polled</div>
                  <div className="text-gray-300">{simulatedLogs.length} items</div>
                </div>
              </div>

              {project.description && (
                <div className="pt-4 border-t border-white/5 space-y-1.5">
                  <div className="text-[10px] text-gray-500 uppercase font-bold">Metadata / Description</div>
                  <p className="text-gray-300 leading-relaxed text-xs max-w-2xl bg-[#1a1a1a] p-3 rounded border border-white/5">
                    {project.description}
                  </p>
                </div>
              )}
            </div>

            {/* Simulated Live Console Logs */}
            <div className="bg-[#242424] border border-white/5 rounded-lg overflow-hidden flex flex-col h-[320px]">
              <div className="bg-[#1f1f1f] px-5 py-3 border-b border-white/5 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 shadow-[0_0_4px_#f59e0b]"></span>
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">Live System Console Telemetry</span>
                </div>
                <div className="text-[9px] text-gray-500 uppercase">tty: dev/ports</div>
              </div>
              <div className="flex-1 bg-[#181818] p-5 overflow-auto space-y-1 text-zinc-400 font-mono text-[10px] leading-relaxed">
                {simulatedLogs.length === 0 ? (
                  <div className="text-gray-600 animate-pulse">[i] Initializing terminal streams...</div>
                ) : (
                  simulatedLogs.map((log, index) => (
                    <div key={index} className="whitespace-pre-wrap font-mono">
                      <span className="text-gray-600">sys@iq-console:~$</span> {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Quick Metrics Right */}
          <div className="space-y-6">
            <div className="bg-[#242424] border border-white/5 rounded-lg p-5 space-y-4">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider pb-3 border-b border-white/5">
                Telemetry Analytics
              </h2>

              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Node Connections</span>
                  <span className="text-white font-bold bg-[#1a1a1a] border border-white/10 px-2 py-0.5 rounded text-[10px]">
                    1/1 Active
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Pipeline State</span>
                  <span className="text-white font-bold bg-[#1a1a1a] border border-white/10 px-2 py-0.5 rounded text-[10px]">
                    Idle
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Docker Network</span>
                  <span className="text-white font-bold bg-[#1a1a1a] border border-white/10 px-2 py-0.5 rounded text-[10px]">
                    iq-campus-bridge
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Campus Memory Limit</span>
                  <span className="text-white font-bold bg-[#1a1a1a] border border-white/10 px-2 py-0.5 rounded text-[10px]">
                    512 MB
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-[#242424] border border-white/5 rounded-lg p-5 space-y-4">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider pb-3 border-b border-white/5">
                Campus Automations
              </h2>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Trigger an automated pipeline run for this project. This will fetch the latest code from GitHub and deploy it to a container.
              </p>
              <button
                onClick={handleManualDeploy}
                disabled={isDeploying}
                className="w-full bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-400 hover:text-emerald-300 font-bold py-2 rounded text-[10px] transition-colors cursor-pointer uppercase shrink-0"
              >
                {isDeploying ? 'Deploying...' : 'Trigger Manual Deploy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
