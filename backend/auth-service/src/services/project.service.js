import { prisma } from '../config/db.js';

export const createProject = async (data, ownerId) => {
  return await prisma.project.create({
    data: {
      name: data.name,
      description: data.description,
      githubRepo: data.githubRepo,
      ownerId: ownerId,
    },
  });
};

export const getProjectsByOwner = async (ownerId) => {
  return await prisma.project.findMany({
    where: { ownerId },
    orderBy: { createdAt: 'desc' },
  });
};

export const getProjectByIdAndOwner = async (id, ownerId) => {
  return await prisma.project.findFirst({
    where: { id, ownerId },
  });
};

export const updateProject = async (id, ownerId, data) => {
  // Verify ownership first
  const project = await prisma.project.findFirst({
    where: { id, ownerId },
  });

  if (!project) {
    throw new Error('Project not found or access denied');
  }

  return await prisma.project.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      githubRepo: data.githubRepo,
      deploymentStatus: data.deploymentStatus,
    },
  });
};

export const deleteProject = async (id, ownerId) => {
  // Verify ownership first
  const project = await prisma.project.findFirst({
    where: { id, ownerId },
  });

  if (!project) {
    throw new Error('Project not found or access denied');
  }

  return await prisma.project.delete({
    where: { id },
  });
};
