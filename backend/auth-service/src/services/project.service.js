import { prisma } from '../../config/db.js';

export const createProject = async (data) => {
  return await prisma.project.create({ data });
};

export const getProjectById = async (id) => {
  return await prisma.project.findUnique({ where: { id } });
};

export const listProjects = async () => {
  return await prisma.project.findMany({ include: { owner: true } });
};

export const updateProject = async (id, data) => {
  return await prisma.project.update({ where: { id }, data });
};

export const deleteProject = async (id) => {
  return await prisma.project.delete({ where: { id } });
};
