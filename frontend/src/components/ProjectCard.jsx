import React from 'react';
import { Link } from 'react-router-dom';

export default function ProjectCard({ project, onDelete }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'SUCCESS':
        return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] text-emerald-400 border-emerald-950/50';
      case 'DEPLOYING':
        return 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)] text-amber-400 border-amber-950/50';
      case 'FAILED':
        return 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)] text-rose-400 border-rose-950/50';
      default:
        return 'bg-zinc-500 shadow-[0_0_8px_rgba(113,113,122,0.4)] text-zinc-400 border-zinc-950/50';
    }
  };

  return (
    <div className="bg-[#242424] border border-white/5 rounded-lg p-5 font-mono flex flex-col justify-between hover:border-white/10 transition-all duration-250 group">
      <div>
        <div className="flex items-start justify-between pb-3 border-b border-white/5">
          <div className="truncate pr-2">
            <h3 className="text-sm font-bold text-white group-hover:text-white transition-colors truncate">
              {project.name}
            </h3>
            <span className="text-[9px] text-gray-500 truncate block mt-0.5 select-none">
              ID: {project.id.slice(0, 8)}...
            </span>
          </div>
          <div className="flex items-center space-x-1.5 shrink-0">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getStatusColor(project.deploymentStatus).split(' ')[0]}`}></span>
            <span className="text-[9px] uppercase tracking-wider font-semibold text-gray-400">
              {project.deploymentStatus}
            </span>
          </div>
        </div>

        <div className="py-4 space-y-3">
          <p className="text-xs text-gray-400 line-clamp-2 h-8 leading-relaxed">
            {project.description || 'No custom deployment telemetry details compiled.'}
          </p>
          <div className="bg-[#1a1a1a] border border-white/5 rounded p-2.5 space-y-1">
            <div className="text-[9px] text-gray-600 uppercase font-bold tracking-wider">Source Repository</div>
            <a
              href={project.githubRepo}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-zinc-400 hover:text-white truncate block hover:underline"
            >
              git: {project.githubRepo}
            </a>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-white/5 flex items-center justify-between">
        <span className="text-[10px] text-gray-600">
          {new Date(project.createdAt).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
        <div className="flex items-center space-x-2.5">
          <Link
            to={`/projects/${project.id}`}
            className="text-[10px] text-gray-400 hover:text-white hover:underline transition-colors"
          >
            Monitor
          </Link>
          <Link
            to={`/projects/${project.id}/edit`}
            className="text-[10px] text-gray-400 hover:text-white hover:underline transition-colors"
          >
            Configure
          </Link>
          <button
            onClick={() => onDelete(project.id)}
            className="text-[10px] text-rose-500/80 hover:text-rose-400 hover:underline cursor-pointer transition-colors"
          >
            Destroy
          </button>
        </div>
      </div>
    </div>
  );
}
