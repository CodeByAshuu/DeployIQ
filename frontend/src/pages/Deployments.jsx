import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDeployments, deleteDeployment } from '../services/deployment.js';

export default function Deployments() {
  const [deployments, setDeployments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchDeployments = useCallback(async () => {
    try {
      const data = await getDeployments();
      setDeployments(data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to fetch deployments.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    fetchDeployments();
    const interval = setInterval(() => {
      if (mounted) fetchDeployments();
    }, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [fetchDeployments]);

  const handleDelete = useCallback(async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this deployment record?')) return;
    try {
      await deleteDeployment(id);
      setDeployments((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete deployment.');
    }
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-950 border border-emerald-500/30 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 shadow-[0_0_6px_#10b981]"></span>
            SUCCESS
          </span>
        );
      case 'BUILDING':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-950 border border-amber-500/30 text-amber-400 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 shadow-[0_0_6px_#f59e0b]"></span>
            BUILDING
          </span>
        );
      case 'RUNNING':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-sky-950 border border-sky-500/30 text-sky-400">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mr-1.5 shadow-[0_0_6px_#0ea5e9]"></span>
            RUNNING
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-950 border border-rose-500/30 text-rose-400">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5 shadow-[0_0_6px_#f43f5e]"></span>
            FAILED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-900 border border-zinc-500/30 text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 mr-1.5"></span>
            PENDING
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 font-mono text-gray-300">
      {/* Header Panel */}
      <header className="bg-[#242424] p-6 rounded-xl border border-white/5 shadow-lg flex justify-between items-center">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-500 font-bold">$</span>
            <h1 className="text-xl font-bold text-white tracking-wider">
              cat /etc/deployiq/deployments.conf
            </h1>
          </div>
          <p className="text-[11px] text-gray-500 mt-2">
            Deployment History and Pipeline Execution Records
          </p>
        </div>
        <button
          onClick={fetchDeployments}
          className="text-xs bg-[#1a1a1a] hover:bg-[#202020] border border-white/10 px-4 py-2 rounded text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          $ refresh
        </button>
      </header>

      {/* Main Table or Loading */}
      {error && (
        <div className="bg-rose-950/20 border border-rose-500/20 text-rose-400 p-4 rounded-lg text-xs">
          [ERROR] {error}
        </div>
      )}

      {isLoading && deployments.length === 0 ? (
        <div className="bg-[#242424] p-12 text-center rounded-xl border border-white/5 text-gray-500 text-xs">
          Loading deployment registries...
        </div>
      ) : deployments.length === 0 ? (
        <div className="bg-[#242424] p-12 text-center rounded-xl border border-white/5 text-gray-500 text-xs space-y-2">
          <div>No deployments recorded in current session database.</div>
          <div className="text-[10px] text-gray-600">To trigger a deployment, navigate to a Project page and click "Trigger Deploy".</div>
        </div>
      ) : (
        <div className="bg-[#242424] rounded-xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#2a2a2a] text-xs text-gray-400 border-b border-white/5">
                  <th className="px-6 py-3.5 font-semibold">DEPLOYMENT ID</th>
                  <th className="px-6 py-3.5 font-semibold">PROJECT</th>
                  <th className="px-6 py-3.5 font-semibold">IMAGE TAG</th>
                  <th className="px-6 py-3.5 font-semibold">STATUS</th>
                  <th className="px-6 py-3.5 font-semibold">TIMESTAMP</th>
                  <th className="px-6 py-3.5 font-semibold text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {deployments.map((d) => (
                  <tr
                    key={d.id}
                    onClick={() => navigate(`/deployments/${d.id}`)}
                    className="hover:bg-white/[0.02] cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 font-mono text-gray-400">
                      {d.id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 text-white font-semibold">
                      {d.project?.name || 'Unknown Project'}
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-400">
                      {d.imageTag || 'latest'}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(d.status)}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-[11px]">
                      {new Date(d.deployedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/deployments/${d.id}`);
                          }}
                          className="bg-[#1a1a1a] hover:bg-[#2c2c2c] border border-white/10 text-gray-300 hover:text-white px-2.5 py-1 rounded text-[10px] transition-colors"
                        >
                          Logs
                        </button>
                        <button
                          onClick={(e) => handleDelete(d.id, e)}
                          className="bg-rose-950/20 hover:bg-rose-950/40 border border-rose-500/20 text-rose-400 hover:text-rose-300 px-2.5 py-1 rounded text-[10px] transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
