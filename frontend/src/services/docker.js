import api from './api.js';

export const listContainers = async () => {
  const response = await api.get('/docker/containers');
  return response.data;
};

export const getContainerDetails = async (id) => {
  const response = await api.get(`/docker/containers/${id}`);
  return response.data;
};

export const startContainer = async (id) => {
  const response = await api.post(`/docker/containers/${id}/start`);
  return response.data;
};

export const stopContainer = async (id) => {
  const response = await api.post(`/docker/containers/${id}/stop`);
  return response.data;
};

export const restartContainer = async (id) => {
  const response = await api.post(`/docker/containers/${id}/restart`);
  return response.data;
};

export const getContainerLogs = async (id) => {
  const response = await api.get(`/docker/containers/${id}/logs`);
  return response.data;
};
