import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProject } from '../services/project.js';
import ProjectForm from '../components/ProjectForm.jsx';

export default function CreateProject() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (formData) => {
    setIsLoading(true);
    setError('');
    try {
      await createProject(formData);
      navigate('/projects');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to initialize project configuration.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-mono">
      <div className="pb-5 border-b border-white/5">
        <h1 className="text-xl font-bold text-white tracking-tight">Initialize New Project</h1>
        <p className="text-xs text-gray-500 mt-1">
          Configure telemetry settings, build targets, and GitHub integration specs.
        </p>
      </div>

      <div className="flex justify-start">
        <ProjectForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </div>
  );
}
