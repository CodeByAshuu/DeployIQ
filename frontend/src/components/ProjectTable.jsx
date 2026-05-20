import React from 'react';
import { Link } from 'react-router-dom';

export default function ProjectTable({ projects, onDelete }) {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded border border-emerald-950 bg-emerald-950/20 text-emerald-400 text-[10px] font-semibold tracking-wide uppercase select-none">
            <span className="w-1 h-1 rounded-full bg-emerald-500 mr-1.5 shadow-[0_0_4px_#10b981]"></span>
            Success
          </span>
        );
      case 'DEPLOYING':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded border border-amber-950 bg-amber-950/20 text-amber-400 text-[10px] font-semibold tracking-wide uppercase select-none animate-pulse">
            <span className="w-1 h-1 rounded-full bg-amber-500 mr-1.5 shadow-[0_0_4px_#f59e0b]"></span>
            Deploying
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded border border-rose-950 bg-rose-950/20 text-rose-400 text-[10px] font-semibold tracking-wide uppercase select-none">
            <span className="w-1 h-1 rounded-full bg-rose-500 mr-1.5 shadow-[0_0_4px_#f43f5e]"></span>
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded border border-zinc-900 bg-zinc-900/40 text-zinc-400 text-[10px] font-semibold tracking-wide uppercase select-none">
            <span className="w-1 h-1 rounded-full bg-zinc-500 mr-1.5"></span>
            Pending
          </span>
        );
    }
  };

  return (
    <div className="bg-[#242424] border border-white/5 rounded-lg overflow-hidden font-mono">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#1f1f1f] border-b border-white/5 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
              <th className="py-3.5 px-6 w-1/4">Project Key</th>
              <th className="py-3.5 px-6 w-1/3">Repository</th>
              <th className="py-3.5 px-6 w-1/6">Deployment Node</th>
              <th className="py-3.5 px-6 w-1/8 text-right">Registered</th>
              <th className="py-3.5 px-6 text-right w-1/8">Operations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {projects.map((project) => (
              <tr key={project.id} className="hover:bg-white/[0.01] transition-colors">
                <td className="py-4 px-6">
                  <div className="truncate">
                    <Link to={`/projects/${project.id}`} className="text-white hover:underline font-bold block truncate">
                      {project.name}
                    </Link>
                    <span className="text-[9px] text-gray-600 block mt-0.5 truncate select-none">
                      UUID: {project.id}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="truncate max-w-[280px]">
                    <a
                      href={project.githubRepo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-400 hover:text-white transition-colors truncate hover:underline"
                    >
                      {project.githubRepo.replace('https://github.com/', 'git@github.com:')}
                    </a>
                    {project.description && (
                      <span className="text-[10px] text-gray-500 truncate block mt-0.5">
                        {project.description}
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-4 px-6 vertical-align-middle shrink-0">
                  {getStatusBadge(project.deploymentStatus)}
                </td>
                <td className="py-4 px-6 text-right text-gray-400 text-[11px]">
                  {new Date(project.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </td>
                <td className="py-4 px-6 text-right">
                  <div className="flex items-center justify-end space-x-3 text-[11px]">
                    <Link
                      to={`/projects/${project.id}`}
                      className="text-gray-400 hover:text-white transition-colors border border-white/5 hover:border-white/20 bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded text-[10px]"
                    >
                      Telemetry
                    </Link>
                    <Link
                      to={`/projects/${project.id}/edit`}
                      className="text-zinc-400 hover:text-white transition-colors"
                    >
                      Config
                    </Link>
                    <button
                      onClick={() => onDelete(project.id)}
                      className="text-rose-500 hover:text-rose-400 cursor-pointer font-semibold transition-colors"
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
  );
}
