import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getProject, updateProject } from '../services/project.js';
import ProjectForm from '../components/ProjectForm.jsx';

export default function EditProject() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [isFetching, setIsFetching] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    setIsFetching(true);
    setError('');
    try {
      const data = await getProject(id);
      setProject(data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to retrieve project config.');
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = async (formData) => {
    setIsLoading(true);
    setError('');
    try {
      await updateProject(id, formData);
      navigate('/projects');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to update project configuration.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-mono">
      <div className="pb-5 border-b border-white/5">
        <h1 className="text-xl font-bold text-white tracking-tight">Configure Project Telemetry</h1>
        <p className="text-xs text-gray-500 mt-1 flex items-center space-x-1.5">
          <span>Target project UID:</span>
          <span className="text-[10px] bg-white/5 border border-white/10 px-1 py-0.5 rounded text-gray-400 select-all font-bold">
            {id}
          </span>
        </p>
      </div>

      {isFetching ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin"></div>
          <span className="text-xs text-gray-500 uppercase tracking-widest animate-pulse">
            Reading telemetry configurations...
          </span>
        </div>
      ) : error && !project ? (
        <div className="p-4 bg-red-950/10 border border-red-900/30 rounded-lg text-red-400 text-xs flex flex-col space-y-2 max-w-xl">
          <div className="font-bold flex items-center space-x-2">
            <span>[CRITICAL ACCESS ERROR]</span>
          </div>
          <p>{error}</p>
          <button
            onClick={() => navigate('/projects')}
            className="self-start text-[10px] underline hover:text-red-300 font-semibold"
          >
            Return to Projects cluster
          </button>
        </div>
      ) : (
        <div className="flex justify-start">
          <ProjectForm
            initialData={project}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
          />
        </div>
      )}
    </div>
  );
}
