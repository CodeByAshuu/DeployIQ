import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProjects, deleteProject } from '../services/project.js';
import ProjectTable from '../components/ProjectTable.jsx';
import ProjectCard from '../components/ProjectCard.jsx';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to fetch campus deployment projects.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('WARNING: Deleting this project will destroy all associated service metadata. Proceed?')) {
      return;
    }
    try {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete project.');
    }
  };

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    project.githubRepo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 font-mono">
      {/* Header telemetry section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-white/5 space-y-4 md:space-y-0">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981] animate-pulse"></span>
            <h1 className="text-xl font-bold text-white tracking-tight">DeployIQ Projects</h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Registered campus microservices, pipelines, and Docker container stacks.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <span className="absolute left-2.5 top-2 text-gray-600 text-xs">/</span>
            <input
              type="text"
              placeholder="grep query..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#242424] border border-white/5 rounded px-2.5 py-1.5 pl-6 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-white/10 transition-colors w-48 focus:w-60"
            />
          </div>

          <div className="flex items-center bg-[#242424] rounded border border-white/5 p-0.5">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded text-xs cursor-pointer transition-colors ${
                viewMode === 'table'
                  ? 'bg-white/5 text-white'
                  : 'text-gray-500 hover:text-white'
              }`}
              title="Table View"
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded text-xs cursor-pointer transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white/5 text-white'
                  : 'text-gray-500 hover:text-white'
              }`}
              title="Grid/Card View"
            >
              Cards
            </button>
          </div>

          <Link
            to="/projects/new"
            className="bg-white hover:bg-gray-200 text-[#1a1a1a] px-3.5 py-1.5 font-bold rounded text-xs transition-colors flex items-center space-x-1.5"
          >
            <span>+ New Project</span>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin"></div>
          <span className="text-xs text-gray-500 uppercase tracking-widest animate-pulse">Running telemetry scan...</span>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-950/10 border border-red-900/30 rounded-lg text-red-400 text-xs flex flex-col space-y-2">
          <div className="font-bold flex items-center space-x-2">
            <span>[CRITICAL RUNTIME ERROR]</span>
          </div>
          <p>{error}</p>
          <button
            onClick={fetchProjects}
            className="self-start text-[10px] underline hover:text-red-300 font-semibold"
          >
            Retry Telemetry Scan
          </button>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="border border-white/5 bg-[#242424] rounded-lg p-12 text-center flex flex-col items-center max-w-xl mx-auto space-y-6">
          <div className="w-12 h-12 rounded border border-white/10 bg-white/[0.02] flex items-center justify-center text-gray-600">
            [ø]
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">No Project Clusters Compile</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
              {searchQuery
                ? 'Your query returned no compiled projects. Try searching with different terms or check syntax.'
                : 'You have not initialized any campus deployment projects on this session. Initialize one to start monitoring.'}
            </p>
          </div>
          {!searchQuery && (
            <Link
              to="/projects/new"
              className="bg-white hover:bg-gray-200 text-[#1a1a1a] px-4 py-2 font-bold rounded text-xs transition-colors"
            >
              $ init project
            </Link>
          )}
        </div>
      ) : viewMode === 'table' ? (
        <ProjectTable projects={filteredProjects} onDelete={handleDelete} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
