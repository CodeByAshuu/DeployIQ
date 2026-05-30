import { prisma } from '../config/db.js';

export const createDeployment = async (projectId, imageTag = 'latest', deployedBy) => {
  // Verify project ownership
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId: deployedBy },
  });

  if (!project) {
    throw new Error('Project not found or access denied');
  }

  // Set project status to DEPLOYING
  await prisma.project.update({
    where: { id: projectId },
    data: { deploymentStatus: 'DEPLOYING' },
  });

  return await prisma.deployment.create({
    data: {
      projectId,
      imageTag,
      deployedBy,
      status: 'PENDING',
      logs: 'Deployment initialized. Ready to start.\n',
    },
  });
};

export const getAllDeployments = async (ownerId) => {
  return await prisma.deployment.findMany({
    where: {
      project: {
        ownerId,
      },
    },
    include: {
      project: true,
    },
    orderBy: {
      deployedAt: 'desc',
    },
  });
};

export const getDeploymentsByProject = async (projectId, ownerId) => {
  // Verify project ownership
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId },
  });

  if (!project) {
    throw new Error('Project not found or access denied');
  }

  return await prisma.deployment.findMany({
    where: { projectId },
    orderBy: { deployedAt: 'desc' },
  });
};

export const getDeploymentById = async (id, ownerId) => {
  return await prisma.deployment.findFirst({
    where: {
      id,
      project: {
        ownerId,
      },
    },
    include: {
      project: true,
    },
  });
};

export const updateDeploymentStatus = async (id, status, extraLogs = '', metadata = {}) => {
  const deployment = await prisma.deployment.findUnique({
    where: { id },
  });

  if (!deployment) {
    throw new Error('Deployment not found');
  }

  const updatedLogs = deployment.logs ? deployment.logs + extraLogs + '\n' : extraLogs + '\n';

  // Update deployment status
  const updatedDeployment = await prisma.deployment.update({
    where: { id },
    data: {
      status,
      logs: updatedLogs,
      ...metadata,
      // Record duration when completing
      ...(status === 'SUCCESS' || status === 'FAILED'
        ? { durationMs: Math.floor((new Date() - deployment.deployedAt) / 1000) }
        : {}),
    },
  });

  // If status is SUCCESS or FAILED, update the project status too
  if (status === 'SUCCESS') {
    await prisma.project.update({
      where: { id: deployment.projectId },
      data: { deploymentStatus: 'SUCCESS' },
    });
  } else if (status === 'FAILED') {
    await prisma.project.update({
      where: { id: deployment.projectId },
      data: { deploymentStatus: 'FAILED' },
    });
  }

  return updatedDeployment;
};

export const deleteDeployment = async (id, ownerId) => {
  const deployment = await prisma.deployment.findFirst({
    where: {
      id,
      project: {
        ownerId,
      },
    },
  });

  if (!deployment) {
    throw new Error('Deployment not found or access denied');
  }

  return await prisma.deployment.delete({
    where: { id },
  });
};

// Real deployment pipeline logic
export const runDeploymentPipeline = async (id) => {
  const now = () => new Date().toLocaleTimeString();
  
  // Helper to wrap log with timestamp
  const withTimestamp = (msg) => `[${now()}] ${msg}`;
  const logToDb = async (status, msg) => {
    await updateDeploymentStatus(id, status, withTimestamp(msg));
  };

  try {
    const deployment = await prisma.deployment.findUnique({
      where: { id },
      include: { project: true }
    });

    if (!deployment) throw new Error('Deployment record not found');
    
    const projectId = deployment.projectId;
    const repoUrl = deployment.project.githubRepo;
    
    // 1. Pending -> Cloning
    await logToDb('CLONING', `[1/4] 📥 Preparing to clone repository: ${repoUrl}`);
    const { cloneRepository } = await import('./git.service.js');
    const sourcePath = await cloneRepository(repoUrl, projectId, async (msg) => {
      await logToDb('CLONING', msg);
    });

    // 2. Cloning -> Building
    await logToDb('BUILDING', `[2/4] 🐳 Detecting project type and preparing build...`);
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const files = await fs.readdir(sourcePath);
    const hasDockerfile = files.includes('Dockerfile');
    const hasPackageJson = files.includes('package.json');
    const hasIndexHtml = files.includes('index.html');
    
    let targetPort = 80;
    
    if (hasDockerfile) {
      await logToDb('BUILDING', `Project type: Custom Dockerfile detected.`);
      // We'll assume a standard web port like 80 or 3000, let's stick to 80 or user can configure later.
      // But we publish all ports in the container logic so it's fine.
    } else if (hasPackageJson) {
      await logToDb('BUILDING', `Project type: Node.js detected. Generating temporary Dockerfile...`);
      targetPort = 3000;
      const dockerfileContent = `
        FROM node:18-alpine
        WORKDIR /app
        COPY package*.json ./
        RUN npm install
        COPY . .
        EXPOSE 3000
        CMD ["npm", "start"]
      `;
      await fs.writeFile(path.join(sourcePath, 'Dockerfile'), dockerfileContent.trim());
      await logToDb('BUILDING', `Temporary Dockerfile created successfully.`);
    } else if (hasIndexHtml) {
      await logToDb('BUILDING', `Project type: Static HTML detected. Generating temporary Dockerfile...`);
      targetPort = 80;
      const dockerfileContent = `
        FROM nginx:alpine
        COPY . /usr/share/nginx/html
        EXPOSE 80
      `;
      await fs.writeFile(path.join(sourcePath, 'Dockerfile'), dockerfileContent.trim());
      await logToDb('BUILDING', `Temporary Dockerfile created successfully.`);
    } else {
      throw new Error('Unsupported project structure. Missing Dockerfile, package.json, or index.html.');
    }
    
    const { buildImage, createAndStartContainer } = await import('./containerManager.service.js');
    const imageName = \`deployiq-project-\${projectId.slice(0,8)}:latest\`;
    
    await logToDb('BUILDING', `Initiating Docker build for image: ${imageName}...`);
    await buildImage(sourcePath, imageName, async (msg) => {
      await logToDb('BUILDING', msg);
    });
    
    // 3. Building -> Starting
    await logToDb('STARTING', `[3/4] 🚀 Allocating port and creating container...`);
    const { getAvailablePort } = await import('./portManager.service.js');
    const assignedPort = await getAvailablePort();
    await logToDb('STARTING', `Allocated host port: ${assignedPort}`);
    
    const containerName = \`deployiq-container-\${projectId.slice(0,8)}\`;
    const containerId = await createAndStartContainer(imageName, assignedPort, containerName, targetPort, async (msg) => {
      await logToDb('STARTING', msg);
    });
    
    // 4. Starting -> Running / Success
    const deploymentUrl = \`http://localhost:\${assignedPort}\`;
    await logToDb('SUCCESS', `[4/4] 🎉 Deployment Success! Container is running.`);
    await updateDeploymentStatus(id, 'SUCCESS', withTimestamp(`App is now live at: ${deploymentUrl}`), {
      containerId,
      imageName,
      assignedPort,
      deploymentUrl,
      runtimeStatus: 'RUNNING',
      startedAt: new Date()
    });

  } catch (error) {
    console.error('Deployment pipeline failed:', error);
    await logToDb('FAILED', `[FATAL ERROR] ❌ Deployment Pipeline Failed: ${error.message}`);
  }
};
