import * as dockerService from '../services/docker.service.js';

const logAction = (action, detail = '') => {
  console.log(`[DOCKER CONTROLLER] ${action}${detail ? ': ' + detail : ''}`);
};

export const list = async (req, res, next) => {
  try {
    const containers = await dockerService.listContainers();
    logAction('List containers', `count=${containers.length}`);
    res.status(200).json(containers);
  } catch (error) {
    console.error('Docker list error:', error);
    next(error);
  }
};

export const getDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    // We fetch current stats as details
    const stats = await dockerService.getContainerStats(id);
    logAction('Get container stats', `id=${id}`);
    res.status(200).json(stats);
  } catch (error) {
    console.error('Docker details error:', error);
    next(error);
  }
};

export const start = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await dockerService.startContainer(id);
    logAction('Start container', `id=${id}`);
    res.status(200).json(result);
  } catch (error) {
    console.error('Docker start error:', error);
    next(error);
  }
};

export const stop = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await dockerService.stopContainer(id);
    logAction('Stop container', `id=${id}`);
    res.status(200).json(result);
  } catch (error) {
    console.error('Docker stop error:', error);
    next(error);
  }
};

export const restart = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await dockerService.restartContainer(id);
    logAction('Restart container', `id=${id}`);
    res.status(200).json(result);
  } catch (error) {
    console.error('Docker restart error:', error);
    next(error);
  }
};

export const getLogs = async (req, res, next) => {
  try {
    const { id } = req.params;
    const logs = await dockerService.getContainerLogs(id);
    logAction('Get container logs', `id=${id}`);
    res.status(200).json({ logs });
  } catch (error) {
    console.error('Docker logs error:', error);
    next(error);
  }
};
