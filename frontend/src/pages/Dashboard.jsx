import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { getProjects } from '../services/project.js';
import { getDeployments } from '../services/deployment.js';
import { listContainers } from '../services/docker.js';
import { getDashboardStats, getTrends, getStatusBreakdown } from '../services/analytics.js';
import { Link } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export default function Dashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [deployments, setDeployments] = useState([]);
  const [containers, setContainers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Analytics State
  const [dashboardStats, setDashboardStats] = useState({
    totalDeployments: 0,
    successfulDeployments: 0,
    failedDeployments: 0,
    runningDeployments: 0,
    averageDeploymentDuration: 0
  });
  const [trends, setTrends] = useState([]);
  const [statusBreakdown, setStatusBreakdown] = useState({
    successPercentage: 0,
    failedPercentage: 0,
    runningPercentage: 0,
    pendingPercentage: 0
  });

  useEffect(() => {
    let mounted = true;

    const loadTelemetry = async () => {
      try {
        // 1. Fetch Core Projects
        const projectsData = await getProjects();
        if (!mounted) return;
        setProjects(projectsData);

        // 2. Fetch Containers
        try {
          const contsData = await listContainers();
          if (mounted) setContainers(contsData);
        } catch (err) {
          console.warn('Failed to load Docker containers for dashboard', err);
        }

        // 3. Fetch Analytics microservice stats
        try {
          const statsData = await getDashboardStats();
          if (mounted) setDashboardStats(statsData);
        } catch (err) {
          console.warn('Failed to load dashboard stats from analytics-service', err);
        }

        // 4. Fetch Analytics trends
        try {
          const trendsData = await getTrends();
          if (mounted) setTrends(trendsData);
        } catch (err) {
          console.warn('Failed to load trends from analytics-service', err);
        }

        // 5. Fetch Analytics breakdown
        try {
          const breakdownData = await getStatusBreakdown();
          if (mounted) setStatusBreakdown(breakdownData);
        } catch (err) {
          console.warn('Failed to load status breakdown from analytics-service', err);
        }

        // 6. Fetch raw deployments for table listing
        try {
          const deploysData = await getDeployments();
          if (mounted) setDeployments(deploysData);
        } catch (err) {
          console.warn('Failed to load deployments for dashboard list', err);
        }

      } catch (err) {
        console.error(err);
        if (mounted) setError('Could not update telemetry stats.');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadTelemetry();

    return () => { mounted = false; };
  }, []);

  const totalProjects = projects.length;
  const runningContainers = containers.filter((c) => c.state === 'running').length;

  const recentProjects = [...projects]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const recentDeployments = [...deployments]
    .sort((a, b) => new Date(b.deployedAt) - new Date(a.deployedAt))
    .slice(0, 5);

  // Recharts Pie Chart Formatter
  const breakdownData = [
    { name: 'Success', value: statusBreakdown.successPercentage, color: '#10b981' },
    { name: 'Failed', value: statusBreakdown.failedPercentage, color: '#f43f5e' },
    { name: 'Running', value: statusBreakdown.runningPercentage, color: '#38bdf8' },
    { name: 'Pending', value: statusBreakdown.pendingPercentage, color: '#71717a' },
  ].filter(item => item.value > 0);

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
              systemctl status deployiq --telemetry
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
        {[
          { label: 'TOTAL PROJECTS', value: isLoading ? '...' : totalProjects, statusClass: 'status-success', desc: 'Campus services' },
          { label: 'ACTIVE CONTAINERS', value: isLoading ? '...' : runningContainers, statusClass: 'status-info', desc: 'Running Dockers' },
          { label: 'TOTAL RUNS', value: isLoading ? '...' : dashboardStats.totalDeployments, statusClass: 'status-info', desc: 'Total telemetry pipeline runs' },
          { label: 'SUCCESS DEPLOYS', value: isLoading ? '...' : dashboardStats.successfulDeployments, statusClass: 'status-success', desc: 'Successful deployments' },
          { label: 'FAILED PIPELINES', value: isLoading ? '...' : dashboardStats.failedDeployments, statusClass: dashboardStats.failedDeployments > 0 ? 'status-danger' : 'status-info', desc: 'Failed deployment attempts' },
          { label: 'AVG PIPELINE SPEED', value: isLoading ? '...' : `${(dashboardStats.averageDeploymentDuration / 1000).toFixed(1)}s`, statusClass: 'status-success', desc: 'Average execution duration' }
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

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deployment Trends Chart */}
        <div className="devops-panel p-5 rounded-xl border devops-border lg:col-span-2">
          <div className="mb-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center">
              <span className="text-gray-600 mr-1.5">&gt;</span> Deployment Pipeline Trends
            </h3>
            <p className="text-[10px] text-gray-500 mt-0.5">Telemetry metrics grouped chronologically by day</p>
          </div>
          <div className="h-64 w-full">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-500 animate-pulse">
                Loading telemetry chart streams...
              </div>
            ) : trends.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-500">
                No deployment trend data discovered.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#222" strokeDasharray="3 3" />
                  <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: 9, fontFamily: 'monospace' }} />
                  <YAxis stroke="#6b7280" style={{ fontSize: 9, fontFamily: 'monospace' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#161616',
                      borderColor: '#333',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: 10,
                      fontFamily: 'monospace'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'monospace', paddingTop: 10 }} />
                  <Area name="Total Runs" type="monotone" dataKey="total" stroke="#38bdf8" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={1.5} />
                  <Area name="Successful" type="monotone" dataKey="success" stroke="#10b981" fillOpacity={1} fill="url(#colorSuccess)" strokeWidth={1.5} />
                  <Area name="Failed" type="monotone" dataKey="failed" stroke="#f43f5e" fillOpacity={1} fill="url(#colorFailed)" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Status Allocation Breakdown (Donut Chart) */}
        <div className="devops-panel p-5 rounded-xl border devops-border">
          <div className="mb-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center">
              <span className="text-gray-600 mr-1.5">&gt;</span> Pipeline Status Breakdown
            </h3>
            <p className="text-[10px] text-gray-500 mt-0.5">Allocation share ratio of deployment states</p>
          </div>
          <div className="h-64 w-full flex flex-col justify-between items-center">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-500 animate-pulse">
                Analyzing breakdown ratio...
              </div>
            ) : breakdownData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-500">
                No ratio telemetry compiled.
              </div>
            ) : (
              <>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={breakdownData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {breakdownData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => `${value}%`}
                        contentStyle={{
                          backgroundColor: '#161616',
                          borderColor: '#333',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: 10,
                          fontFamily: 'monospace'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[9px] w-full px-2">
                  {breakdownData.map((item, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                      <span className="text-gray-400 font-bold uppercase">{item.name}:</span>
                      <span className="text-white font-bold">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
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
