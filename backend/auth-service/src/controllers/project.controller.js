import * as projectService from '../services/project.service.js';

// Helper logger for controller actions
const logAction = (action, detail = '') => {
  console.log(`[PROJECT CONTROLLER] ${action}${detail ? ': ' + detail : ''}`);
};

// Create a new project
export const create = async (req, res, next) => {
  try {
    const ownerId = req.user.userId;
    const project = await projectService.createProject(req.body, ownerId);
    logAction('Create project', `ownerId=${ownerId}, projectId=${project.id}`);
    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    next(error);
  }
};

// Get all projects for the authenticated user
export const list = async (req, res, next) => {
  try {
    const ownerId = req.user.userId;
    const projects = await projectService.getProjectsByOwner(ownerId);
    logAction('List projects', `ownerId=${ownerId}, count=${projects.length}`);
    res.status(200).json(projects);
  } catch (error) {
    console.error('List projects error:', error);
    next(error);
  }
};

// Get a single project by ID (only if it belongs to the user)
export const get = async (req, res, next) => {
  try {
    const ownerId = req.user.userId;
    const { id } = req.params;
    const project = await projectService.getProjectByIdAndOwner(id, ownerId);
    if (!project) {
      logAction('Project not found', `id=${id}, ownerId=${ownerId}`);
      return res.status(404).json({ error: 'Project not found or access denied' });
    }
    logAction('Get project', `id=${id}, ownerId=${ownerId}`);
    res.status(200).json(project);
  } catch (error) {
    console.error('Get project error:', error);
    next(error);
  }
};

// Update an existing project
export const update = async (req, res, next) => {
  try {
    const ownerId = req.user.userId;
    const { id } = req.params;
    const project = await projectService.updateProject(id, ownerId, req.body);
    logAction('Update project', `id=${id}, ownerId=${ownerId}`);
    res.status(200).json(project);
  } catch (error) {
    console.error('Update project error:', error);
    if (error.message === 'Project not found or access denied') {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
};

// Delete a project
export const remove = async (req, res, next) => {
  try {
    const ownerId = req.user.userId;
    const { id } = req.params;
    await projectService.deleteProject(id, ownerId);
    logAction('Delete project', `id=${id}, ownerId=${ownerId}`);
    res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    if (error.message === 'Project not found or access denied') {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
};
