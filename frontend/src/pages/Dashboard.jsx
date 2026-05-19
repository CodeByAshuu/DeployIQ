import React from 'react';

export default function Dashboard() {
  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <header className="flex justify-between items-center glass-panel p-6 rounded-2xl shadow-2xl">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 tracking-tight">
              DeployIQ Dashboard
            </h1>
            <p className="text-gray-400 mt-2 text-sm font-medium">Smart Campus Deployment Portal</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 p-[2px] animate-pulse-slow">
              <div className="w-full h-full bg-[#09090b] rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-white">AD</span>
              </div>
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Active Containers', value: '24', color: 'from-blue-500 to-cyan-400' },
            { label: 'Uptime', value: '99.9%', color: 'from-emerald-400 to-green-500' },
            { label: 'Failed Deployments', value: '0', color: 'from-red-500 to-orange-500' }
          ].map((stat, idx) => (
            <div key={idx} className="glass-panel p-6 rounded-2xl hover:bg-white/[0.05] transition-all duration-300 group cursor-pointer relative overflow-hidden">
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
              <p className="text-gray-400 text-sm font-medium mb-2">{stat.label}</p>
              <h2 className="text-4xl font-bold">{stat.value}</h2>
            </div>
          ))}
        </div>

        {/* Recent Deployments Table */}
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/[0.05] flex justify-between items-center">
            <h3 className="text-xl font-semibold">Recent Deployments</h3>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 transition-colors text-sm font-medium rounded-lg text-white shadow-lg shadow-blue-500/20">
              + New Deployment
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-white/[0.02]">
                  <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Service Name</th>
                  <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Version</th>
                  <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Deployed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {[
                  { name: 'Student Portal API', status: 'Running', ver: 'v2.1.0', time: '2 mins ago', dot: 'bg-green-500', dotGlow: 'shadow-[0_0_8px_rgba(34,197,94,0.6)]' },
                  { name: 'Library Service', status: 'Running', ver: 'v1.4.2', time: '1 hour ago', dot: 'bg-green-500', dotGlow: 'shadow-[0_0_8px_rgba(34,197,94,0.6)]' },
                  { name: 'Analytics Worker', status: 'Stopped', ver: 'v1.0.0', time: '3 hours ago', dot: 'bg-red-500', dotGlow: 'shadow-[0_0_8px_rgba(239,68,68,0.6)]' },
                ].map((item, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors cursor-pointer">
                    <td className="p-4 font-medium text-gray-200">{item.name}</td>
                    <td className="p-4">
                      <span className="flex items-center space-x-2 text-sm text-gray-300">
                        <span className={`w-2 h-2 rounded-full ${item.dot} ${item.dotGlow}`}></span>
                        <span>{item.status}</span>
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-400 font-mono">{item.ver}</td>
                    <td className="p-4 text-sm text-gray-400">{item.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
