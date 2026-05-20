import * as projectService from '../services/project.service.js';

export const create = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const project = await projectService.createProject(req.body, ownerId);
    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
};

export const list = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const projects = await projectService.getProjectsByOwner(ownerId);
    res.status(200).json(projects);
  } catch (error) {
    next(error);
  }
};

export const get = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const { id } = req.params;
    const project = await projectService.getProjectByIdAndOwner(id, ownerId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found or access denied' });
    }

    res.status(200).json(project);
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const { id } = req.params;
    const project = await projectService.updateProject(id, ownerId, req.body);
    res.status(200).json(project);
  } catch (error) {
    if (error.message === 'Project not found or access denied') {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const { id } = req.params;
    await projectService.deleteProject(id, ownerId);
    res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error) {
    if (error.message === 'Project not found or access denied') {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
};
