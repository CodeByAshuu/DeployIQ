import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 font-mono text-gray-300">
      {/* Header Section */}
      <header className="devops-panel p-6 rounded-xl border devops-border shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-500 font-bold">$</span>
            <h1 className="text-2xl font-bold text-white tracking-wider">
              systemctl status deployiq
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Smart Campus Deployment Portal • Active Session Operator: <span className="text-white">{user?.name || 'Operator'}</span>
          </p>
        </div>
        <div className="flex items-center space-x-3 text-xs bg-[#1a1a1a] px-3.5 py-2 rounded-lg border devops-border">
          <span className="w-2 h-2 rounded-full status-success animate-pulse"></span>
          <span className="text-gray-400 uppercase font-bold text-[10px]">CLUSTER: ACTIVE</span>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { label: 'ACTIVE CONTAINERS', value: '24', statusClass: 'status-success', desc: 'Running campus microservices' },
          { label: 'SYSTEM UPTIME', value: '99.98%', statusClass: 'status-success', desc: 'Average across all node pools' },
          { label: 'FAILED DEPLOYMENTS', value: '0', statusClass: 'status-info', desc: 'No errors registered in last 24h' }
        ].map((stat, idx) => (
          <div key={idx} className="devops-panel p-6 rounded-xl border devops-border flex flex-col justify-between h-36">
            <div className="flex justify-between items-start">
              <span className="text-[10px] text-gray-500 font-bold tracking-widest">{stat.label}</span>
              <span className={`w-2 h-2 rounded-full ${stat.statusClass}`}></span>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white tracking-tight">{stat.value}</h2>
              <p className="text-[10px] text-gray-500 mt-1">{stat.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Deployments Panel */}
      <div className="devops-panel rounded-xl border devops-border overflow-hidden">
        <div className="p-5 border-b devops-border bg-[#202020] flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center">
              <span className="text-gray-600 mr-1.5">&gt;</span> Recent Deployments
            </h3>
            <p className="text-[10px] text-gray-500 mt-0.5">Showing last 3 jobs run on campus servers</p>
          </div>
          <button className="terminal-button text-xs py-1.5 px-4 font-mono">
            + New Deployment
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#1a1a1a] text-gray-500 border-b devops-border font-bold uppercase tracking-wider">
                <th className="p-4 text-[10px]">Service Name</th>
                <th className="p-4 text-[10px]">Status</th>
                <th className="p-4 text-[10px]">Version</th>
                <th className="p-4 text-[10px]">Deployed</th>
              </tr>
            </thead>
            <tbody className="divide-y devops-border">
              {[
                { name: 'Student Portal API', status: 'Running', ver: 'v2.1.0', time: '2 mins ago', dotClass: 'status-success' },
                { name: 'Library Service', status: 'Running', ver: 'v1.4.2', time: '1 hour ago', dotClass: 'status-success' },
                { name: 'Analytics Worker', status: 'Stopped', ver: 'v1.0.0', time: '3 hours ago', dotClass: 'status-danger' },
              ].map((item, idx) => (
                <tr key={idx} className="hover:bg-white/[0.01] transition-colors">
                  <td className="p-4 font-semibold text-white">{item.name}</td>
                  <td className="p-4">
                    <span className="flex items-center space-x-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${item.dotClass}`}></span>
                      <span>{item.status}</span>
                    </span>
                  </td>
                  <td className="p-4 text-gray-400 font-mono">{item.ver}</td>
                  <td className="p-4 text-gray-500">{item.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
