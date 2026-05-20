import api from './api.js';

export const getDeployments = async () => {
  const response = await api.get('/deployments');
  return response.data;
};

export const getProjectDeployments = async (projectId) => {
  const response = await api.get(`/deployments/project/${projectId}`);
  return response.data;
};

export const getDeployment = async (id) => {
  const response = await api.get(`/deployments/${id}`);
  return response.data;
};

export const createDeployment = async (projectId, imageTag = 'latest') => {
  const response = await api.post('/deployments', { projectId, imageTag });
  return response.data;
};

export const triggerDeployment = async (id) => {
  const response = await api.post(`/deployments/${id}/trigger`);
  return response.data;
};

export const deleteDeployment = async (id) => {
  const response = await api.delete(`/deployments/${id}`);
  return response.data;
};
