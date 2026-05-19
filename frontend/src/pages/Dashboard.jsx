import { Activity, Box, RefreshCw } from 'lucide-react';

export default function Dashboard() {
  const stats = [
    { name: 'Active Deployments', value: '3', icon: Box, color: 'text-blue-400' },
    { name: 'System Health', value: 'Healthy', icon: Activity, color: 'text-emerald-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
          <p className="text-slate-400 mt-1">Here is the status of your deployments.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-deployiq-accent hover:bg-deployiq-accent-hover text-white rounded-md font-medium transition-colors">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-deployiq-dark border border-slate-800 rounded-lg p-6 flex items-start gap-4">
            <div className={`p-3 rounded-lg bg-slate-800 ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">{stat.name}</p>
              <p className="text-2xl font-semibold mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-deployiq-dark border border-slate-800 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-slate-800">
          <h3 className="font-semibold">Recent Activity</h3>
        </div>
        <div className="p-6 text-center text-slate-400">
          No recent deployments found. Create a project to get started.
        </div>
      </div>
    </div>
  );
}
