import React, { useState, useEffect } from 'react';

export default function ProjectForm({ initialData = {}, onSubmit, isLoading, error }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    githubRepo: '',
  });
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        githubRepo: initialData.githubRepo || '',
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setValidationError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.name.length < 3) {
      setValidationError('Project name must be at least 3 characters long.');
      return;
    }
    if (!formData.githubRepo.trim() || !formData.githubRepo.startsWith('http')) {
      setValidationError('Please enter a valid GitHub repository URL (starts with http/https).');
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl bg-[#242424] p-6 rounded-lg border border-white/5 font-mono">
      <div className="flex items-center space-x-2 pb-4 border-b border-white/5">
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 animate-pulse"></span>
        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Configure Project Telemetry</span>
      </div>

      {(error || validationError) && (
        <div className="p-3 bg-red-950/20 border border-red-900/40 rounded text-red-400 text-xs flex items-center space-x-2">
          <span className="shrink-0">[ERROR]</span>
          <span>{validationError || error}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="name" className="block text-xs font-bold text-gray-400 uppercase">
          Project Identifier (Name) *
        </label>
        <div className="relative">
          <span className="absolute left-3 top-2.5 text-gray-600 text-xs select-none">$</span>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. smart-campus-portal"
            className="w-full bg-[#1a1a1a] border border-white/10 rounded px-3 py-2 pl-7 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-white/20 transition-colors"
            required
            disabled={isLoading}
          />
        </div>
        <p className="text-[10px] text-gray-500">Unique alphanumeric key identifying the application service.</p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="githubRepo" className="block text-xs font-bold text-gray-400 uppercase">
          Source Repository (Git URL) *
        </label>
        <div className="relative">
          <span className="absolute left-3 top-2.5 text-gray-600 text-xs select-none">$</span>
          <input
            type="url"
            id="githubRepo"
            name="githubRepo"
            value={formData.githubRepo}
            onChange={handleChange}
            placeholder="https://github.com/user/repo"
            className="w-full bg-[#1a1a1a] border border-white/10 rounded px-3 py-2 pl-7 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-white/20 transition-colors"
            required
            disabled={isLoading}
          />
        </div>
        <p className="text-[10px] text-gray-500">Repository containing the source code and Dockerfile settings.</p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="description" className="block text-xs font-bold text-gray-400 uppercase">
          Telemetry Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Brief description of deployment targets, campus services managed, or architecture notes..."
          rows="4"
          className="w-full bg-[#1a1a1a] border border-white/10 rounded px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-white/20 transition-colors resize-none"
          disabled={isLoading}
        />
        <p className="text-[10px] text-gray-500">Contextual metadata detailing service scope (limit 200 chars).</p>
      </div>

      <div className="flex items-center space-x-3 pt-4 border-t border-white/5 justify-end">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-4 py-2 border border-white/10 hover:border-white/20 hover:bg-white/[0.02] text-gray-400 hover:text-white rounded text-xs transition-colors cursor-pointer"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-white text-[#1a1a1a] hover:bg-gray-200 font-bold rounded text-xs transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-55"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="w-3 h-3 border-2 border-[#1a1a1a]/30 border-t-[#1a1a1a] rounded-full animate-spin"></span>
              <span>Syncing...</span>
            </>
          ) : (
            <>
              <span>Commit Config</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
