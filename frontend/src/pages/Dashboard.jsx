import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { getProjects } from '../services/project.js';
import { getDeployments } from '../services/deployment.js';
import { listContainers } from '../services/docker.js';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [deployments, setDeployments] = useState([]);
  const [containers, setContainers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTelemetryData();
  }, []);

  const fetchTelemetryData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const projectsData = await getProjects();
      setProjects(projectsData);

      try {
        const deploysData = await getDeployments();
        setDeployments(deploysData);
      } catch (err) {
        console.warn('Failed to load deployments for dashboard', err);
      }

      try {
        const contsData = await listContainers();
        setContainers(contsData);
      } catch (err) {
        console.warn('Failed to load Docker containers for dashboard', err);
      }
    } catch (err) {
      console.error(err);
      setError('Could not update telemetry stats.');
    } finally {
      setIsLoading(false);
    }
  };

  const totalProjects = projects.length;
  const successDeployments = deployments.filter((d) => d.status === 'SUCCESS').length;
  const failedDeployments = deployments.filter((d) => d.status === 'FAILED').length;
  const runningContainers = containers.filter((c) => c.state === 'running').length;

  const recentProjects = [...projects]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const recentDeployments = [...deployments]
    .sort((a, b) => new Date(b.deployedAt) - new Date(a.deployedAt))
    .slice(0, 5);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="flex items-center space-x-2 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]"></span>
            <span>Success</span>
          </span>
        );
      case 'DEPLOYING':
        return (
          <span className="flex items-center space-x-2 text-amber-400 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_6px_#f59e0b]"></span>
            <span>Deploying</span>
          </span>
        );
      case 'FAILED':
        return (
          <span className="flex items-center space-x-2 text-rose-400">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_6px_#f43f5e]"></span>
            <span>Failed</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center space-x-2 text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
            <span>Pending</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 font-mono text-gray-300">
      {/* Header Section */}
      <header className="devops-panel p-6 rounded-xl border devops-border shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-500 font-bold">$</span>
            <h1 className="text-xl font-bold text-white tracking-wider">
              systemctl status deployiq
            </h1>
          </div>
          <p className="text-[11px] text-gray-500 mt-2">
            Smart Campus Deployment Portal • Active Session Operator: <span className="text-white font-semibold">{user?.name || 'Operator'}</span>
          </p>
        </div>
        <div className="flex items-center space-x-3 text-xs bg-[#1a1a1a] px-3.5 py-2 rounded-lg border devops-border">
          <span className="w-2 h-2 rounded-full status-success animate-pulse"></span>
          <span className="text-gray-400 uppercase font-bold text-[9px] tracking-wider">CLUSTER: ACTIVE</span>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {[
          { label: 'TOTAL PROJECTS', value: isLoading ? '...' : totalProjects, statusClass: 'status-success', desc: 'Registered campus services' },
          { label: 'ACTIVE CONTAINERS', value: isLoading ? '...' : runningContainers, statusClass: 'status-info', desc: 'Running Docker containers' },
          { label: 'SUCCESS DEPLOYS', value: isLoading ? '...' : successDeployments, statusClass: 'status-success', desc: 'Successful deployments' },
          { label: 'FAILED PIPELINES', value: isLoading ? '...' : failedDeployments, statusClass: failedDeployments > 0 ? 'status-danger' : 'status-info', desc: 'Failed deployment attempts' }
        ].map((stat, idx) => (
          <div key={idx} className="devops-panel p-5 rounded-xl border devops-border flex flex-col justify-between h-32">
            <div className="flex justify-between items-start">
              <span className="text-[9px] text-gray-500 font-bold tracking-widest uppercase">{stat.label}</span>
              <span className={`w-1.5 h-1.5 rounded-full ${stat.statusClass}`}></span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">{stat.value}</h2>
              <p className="text-[9px] text-gray-500 mt-0.5">{stat.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Projects Table Panel */}
      <div className="devops-panel rounded-xl border devops-border overflow-hidden">
        <div className="p-5 border-b devops-border bg-[#202020] flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center">
              <span className="text-gray-600 mr-1.5">&gt;</span> Recent Telemetry Clusters
            </h3>
            <p className="text-[10px] text-gray-500 mt-0.5">Showing last 5 registered projects</p>
          </div>
          <Link to="/projects/new" className="terminal-button text-xs py-1.5 px-4 font-mono font-bold text-[#1a1a1a]">
            + Initialize Project
          </Link>
        </div>

        {isLoading ? (
          <div className="p-10 text-center text-xs text-gray-500 animate-pulse">
            Loading recent project clusters...
          </div>
        ) : error ? (
          <div className="p-10 text-center text-xs text-rose-400">
            [ERROR] {error}
          </div>
        ) : recentProjects.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <p className="text-xs text-gray-500">No project nodes compiled on the active workspace cluster.</p>
            <Link
              to="/projects/new"
              className="inline-block text-xs border border-white/10 hover:border-white/20 hover:bg-white/[0.02] text-white px-4 py-1.5 rounded transition-all"
            >
              $ build project --new
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#1a1a1a] text-gray-500 border-b devops-border font-bold uppercase tracking-wider text-[9px]">
                  <th className="p-4">Project Key</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Git Repository</th>
                  <th className="p-4 text-right">Compiled</th>
                </tr>
              </thead>
              <tbody className="divide-y devops-border">
                {recentProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="p-4">
                      <Link to={`/projects/${project.id}`} className="font-bold text-white hover:underline">
                        {project.name}
                      </Link>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(project.deploymentStatus)}
                    </td>
                    <td className="p-4 text-zinc-400 font-mono">
                      <a
                        href={project.githubRepo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline hover:text-white"
                      >
                        {project.githubRepo.replace('https://github.com/', 'git:')}
                      </a>
                    </td>
                    <td className="p-4 text-gray-500 text-right">
                      {new Date(project.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Latest Deployment Pipelines Panel */}
      <div className="devops-panel rounded-xl border devops-border overflow-hidden">
        <div className="p-5 border-b devops-border bg-[#202020] flex justify-between items-center">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center">
              <span className="text-gray-600 mr-1.5">&gt;</span> Latest Deployment Pipelines
            </h3>
            <p className="text-[10px] text-gray-500 mt-0.5">Showing last 5 pipeline runs</p>
          </div>
          <Link to="/deployments" className="terminal-button text-xs py-1.5 px-4 font-mono font-bold text-[#1a1a1a]">
            View All Runs
          </Link>
        </div>

        {isLoading ? (
          <div className="p-10 text-center text-xs text-gray-500 animate-pulse">
            Loading recent deployment streams...
          </div>
        ) : recentDeployments.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-500">
            No pipeline executions discovered.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#1a1a1a] text-gray-500 border-b devops-border font-bold uppercase tracking-wider text-[9px]">
                  <th className="p-4">Deployment ID</th>
                  <th className="p-4">Project</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Image Tag</th>
                  <th className="p-4 text-right">Executed At</th>
                </tr>
              </thead>
              <tbody className="divide-y devops-border">
                {recentDeployments.map((d) => (
                  <tr key={d.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="p-4">
                      <Link to={`/deployments/${d.id}`} className="font-mono font-bold text-gray-400 hover:text-white hover:underline">
                        {d.id.slice(0, 8)}...
                      </Link>
                    </td>
                    <td className="p-4 text-white font-semibold">
                      {d.project?.name}
                    </td>
                    <td className="p-4">
                      {d.status === 'SUCCESS' && (
                        <span className="text-emerald-400 font-semibold">● SUCCESS</span>
                      )}
                      {d.status === 'BUILDING' && (
                        <span className="text-amber-400 animate-pulse">● BUILDING</span>
                      )}
                      {d.status === 'RUNNING' && (
                        <span className="text-sky-400">● RUNNING</span>
                      )}
                      {d.status === 'FAILED' && (
                        <span className="text-rose-400 font-semibold">● FAILED</span>
                      )}
                      {d.status === 'PENDING' && (
                        <span className="text-zinc-500">● PENDING</span>
                      )}
                    </td>
                    <td className="p-4 text-zinc-400 font-mono">
                      {d.imageTag || 'latest'}
                    </td>
                    <td className="p-4 text-gray-500 text-right">
                      {new Date(d.deployedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
