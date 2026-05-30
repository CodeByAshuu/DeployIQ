import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProject, deleteProject } from '../services/project.js';
import { createDeployment, triggerDeployment, getProjectDeployments } from '../services/deployment.js';
import { stopContainer, restartContainer, removeContainer } from '../services/docker.js';

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [activeDeployment, setActiveDeployment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchProjectAndDeployments();
  }, [id]);

  const fetchProjectAndDeployments = async () => {
    setIsLoading(true);
    setError('');
    try {
      const projectData = await getProject(id);
      setProject(projectData);
      
      const deploymentsData = await getProjectDeployments(id);
      if (deploymentsData && deploymentsData.length > 0) {
        // Find the latest deployment that is running or success
        const active = deploymentsData.find(d => d.runtimeStatus === 'RUNNING') || deploymentsData[0];
        setActiveDeployment(active);
      } else {
        setActiveDeployment(null);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to fetch project details.');
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

  const handleContainerAction = async (action) => {
    if (!activeDeployment || !activeDeployment.containerId) return;
    
    setActionLoading(true);
    try {
      if (action === 'stop') {
        await stopContainer(activeDeployment.containerId);
      } else if (action === 'restart') {
        await restartContainer(activeDeployment.containerId);
      } else if (action === 'remove') {
        if (window.confirm('Are you sure you want to remove this active container?')) {
          await removeContainer(activeDeployment.containerId);
        }
      }
      // Refresh state
      await fetchProjectAndDeployments();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || `Failed to ${action} container.`);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SUCCESS':
      case 'RUNNING':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full border border-emerald-950 bg-emerald-950/20 text-emerald-400 text-xs font-bold tracking-wide uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 shadow-[0_0_6px_#10b981]"></span>
            Active / Running
          </span>
        );
      case 'DEPLOYING':
      case 'BUILDING':
      case 'STARTING':
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
      case 'STOPPED':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full border border-zinc-900 bg-zinc-900/40 text-zinc-400 text-xs font-bold tracking-wide uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 mr-2"></span>
            Stopped
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
          <span className="text-xs text-gray-500 uppercase tracking-widest animate-pulse">Scanning node status...</span>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-950/10 border border-red-900/30 rounded-lg text-red-400 flex flex-col space-y-2 max-w-xl">
          <div className="font-bold flex items-center space-x-2">
            <span>[CRITICAL RUNTIME ERROR]</span>
          </div>
          <p>{error}</p>
          <button
            onClick={fetchProjectAndDeployments}
            className="self-start text-[10px] underline hover:text-red-300 font-semibold"
          >
            Retry Connection
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
                  <div>{getStatusBadge(activeDeployment ? activeDeployment.runtimeStatus || activeDeployment.status : project.deploymentStatus)}</div>
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
                  <div className="text-[10px] text-gray-500 uppercase font-bold">Active Deployment</div>
                  <div className="text-gray-300">{activeDeployment ? activeDeployment.id : 'None'}</div>
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

            {/* Container Control Panel */}
            <div className="bg-[#242424] border border-white/5 rounded-lg overflow-hidden flex flex-col">
              <div className="bg-[#1f1f1f] px-5 py-3 border-b border-white/5 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">Active Container Controls</span>
                </div>
              </div>
              <div className="p-5 space-y-4">
                {activeDeployment && activeDeployment.containerId ? (
                  <div className="space-y-4">
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center justify-between text-[10px] text-gray-400">
                        <span>Container ID</span>
                        <span className="font-mono text-white">{activeDeployment.containerId.substring(0, 12)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-gray-400">
                        <span>Image Name</span>
                        <span className="font-mono text-white">{activeDeployment.imageName}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-gray-400">
                        <span>Host Port</span>
                        <span className="font-mono text-emerald-400">{activeDeployment.assignedPort}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-white/5">
                      {activeDeployment.deploymentUrl && (
                        <a 
                          href={activeDeployment.deploymentUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-center bg-blue-950/40 hover:bg-blue-900 border border-blue-500/30 text-blue-400 py-1.5 rounded text-[10px] font-bold uppercase transition-colors"
                        >
                          Open App
                        </a>
                      )}
                      <button 
                        onClick={() => navigate(`/deployments/${activeDeployment.id}`)}
                        className="bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-white py-1.5 rounded text-[10px] font-bold uppercase transition-colors"
                      >
                        Logs
                      </button>
                      <button 
                        onClick={() => handleContainerAction('restart')}
                        disabled={actionLoading}
                        className="bg-amber-950/40 hover:bg-amber-900 border border-amber-500/30 text-amber-400 py-1.5 rounded text-[10px] font-bold uppercase transition-colors disabled:opacity-50"
                      >
                        Restart
                      </button>
                      <button 
                        onClick={() => handleContainerAction('stop')}
                        disabled={actionLoading}
                        className="bg-rose-950/40 hover:bg-rose-900 border border-rose-500/30 text-rose-400 py-1.5 rounded text-[10px] font-bold uppercase transition-colors disabled:opacity-50"
                      >
                        Stop
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500 text-center py-6">
                    No active container found for this project. Trigger a deploy to create one.
                  </div>
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
                    {activeDeployment && activeDeployment.runtimeStatus === 'RUNNING' ? '1/1 Active' : '0/1 Active'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Pipeline State</span>
                  <span className="text-white font-bold bg-[#1a1a1a] border border-white/10 px-2 py-0.5 rounded text-[10px]">
                    {project.deploymentStatus}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Docker Network</span>
                  <span className="text-white font-bold bg-[#1a1a1a] border border-white/10 px-2 py-0.5 rounded text-[10px]">
                    deployiq-bridge
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Runtime Allocation</span>
                  <span className="text-white font-bold bg-[#1a1a1a] border border-white/10 px-2 py-0.5 rounded text-[10px]">
                    Dynamic
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
