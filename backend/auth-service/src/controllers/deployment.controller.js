import * as deploymentService from '../services/deployment.service.js';

const logAction = (action, detail = '') => {
  console.log(`[DEPLOYMENT CONTROLLER] ${action}${detail ? ': ' + detail : ''}`);
};

export const create = async (req, res, next) => {
  try {
    const ownerId = req.user.userId;
    const { projectId, imageTag } = req.body;
    const deployment = await deploymentService.createDeployment(projectId, imageTag, ownerId);
    logAction('Create deployment', `projectId=${projectId}, deploymentId=${deployment.id}`);
    res.status(201).json(deployment);
  } catch (error) {
    console.error('Create deployment error:', error);
    next(error);
  }
};

export const listAll = async (req, res, next) => {
  try {
    const ownerId = req.user.userId;
    const deployments = await deploymentService.getAllDeployments(ownerId);
    logAction('List all deployments', `ownerId=${ownerId}, count=${deployments.length}`);
    res.status(200).json(deployments);
  } catch (error) {
    console.error('List all deployments error:', error);
    next(error);
  }
};

export const listByProject = async (req, res, next) => {
  try {
    const ownerId = req.user.userId;
    const { projectId } = req.params;
    const deployments = await deploymentService.getDeploymentsByProject(projectId, ownerId);
    logAction('List project deployments', `projectId=${projectId}, count=${deployments.length}`);
    res.status(200).json(deployments);
  } catch (error) {
    console.error('List project deployments error:', error);
    next(error);
  }
};

export const get = async (req, res, next) => {
  try {
    const ownerId = req.user.userId;
    const { id } = req.params;
    const deployment = await deploymentService.getDeploymentById(id, ownerId);
    if (!deployment) {
      logAction('Deployment not found', `id=${id}, ownerId=${ownerId}`);
      return res.status(404).json({ error: 'Deployment not found or access denied' });
    }
    logAction('Get deployment', `id=${id}`);
    res.status(200).json(deployment);
  } catch (error) {
    console.error('Get deployment error:', error);
    next(error);
  }
};

export const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, logs } = req.body;
    const deployment = await deploymentService.updateDeploymentStatus(id, status, logs);
    logAction('Update deployment status', `id=${id}, status=${status}`);
    res.status(200).json(deployment);
  } catch (error) {
    console.error('Update deployment status error:', error);
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    const ownerId = req.user.userId;
    const { id } = req.params;
    await deploymentService.deleteDeployment(id, ownerId);
    logAction('Delete deployment', `id=${id}, ownerId=${ownerId}`);
    res.status(200).json({ message: 'Deployment deleted successfully' });
  } catch (error) {
    console.error('Delete deployment error:', error);
    if (error.message === 'Deployment not found or access denied') {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
};

export const triggerDeploy = async (req, res, next) => {
  try {
    const ownerId = req.user.userId;
    const { id } = req.params;

    // Verify it exists and user has access
    const deployment = await deploymentService.getDeploymentById(id, ownerId);
    if (!deployment) {
      logAction('Trigger deploy failed: not found', `id=${id}`);
      return res.status(404).json({ error: 'Deployment not found or access denied' });
    }

    logAction('Trigger deploy pipeline', `id=${id}`);

    // Fire and forget the pipeline in the background
    deploymentService.runDeploymentPipeline(id).catch((err) => {
      console.error(`Error running deployment pipeline for ${id}:`, err);
    });

    res.status(202).json({ message: 'Deployment pipeline started', deploymentId: id });
  } catch (error) {
    console.error('Trigger deploy error:', error);
    next(error);
  }
};
