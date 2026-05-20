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

export const updateDeploymentStatus = async (id, status, extraLogs = '') => {
  const deployment = await prisma.deployment.findUnique({
    where: { id },
  });

  if (!deployment) {
    throw new Error('Deployment not found');
  }

  const updatedLogs = deployment.logs + extraLogs + '\n';

  const updatedDeployment = await prisma.deployment.update({
    where: { id },
    data: {
      status,
      logs: updatedLogs,
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

// Simulation pipeline logic
export const runDeploymentSimulation = async (id) => {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  try {
    // 1. Pending -> Building (GitHub Pull)
    await updateDeploymentStatus(id, 'BUILDING', `[1/5] 📥 GitHub Pull
- Connecting to GitHub repository...
- Fetching latest code from branch 'main'...
- Pulling commit sha: f8a3c2d [Update configurations]
- GitHub Pull: Completed successfully.`);
    await delay(2000);

    // 2. Building (Docker Build)
    await updateDeploymentStatus(id, 'BUILDING', `[2/5] 🐳 Docker Build
- Initializing Docker build context...
- Step 1/5 : FROM node:18-alpine
---> Using cached image
- Step 2/5 : WORKDIR /app
---> Using cached layer
- Step 3/5 : COPY package*.json ./
---> Running in container...
- Step 4/5 : RUN npm ci --omit=dev
---> Installing packages (this may take a few seconds)...
---> packages installed successfully.
- Step 5/5 : COPY . .
---> Copying source files.
- Exporting image layers...
- Docker Build: Image build complete. Tagged as deployiq-app:latest`);
    await delay(3000);

    // 3. Running (Container Startup)
    await updateDeploymentStatus(id, 'RUNNING', `[3/5] 🚀 Container Startup
- Stopping existing container (if any)...
- Creating container 'deployiq-user-app'...
- Mounting persistent volumes...
- Setting environment variables...
- Container started successfully. ID: e8b9f1c7d24a
- Port mapping: 3000 -> 80`);
    await delay(2000);

    // 4. Running (Health Check)
    await updateDeploymentStatus(id, 'RUNNING', `[4/5] 🩺 Health Check
- Querying service HTTP interface on port 3000...
- Attempt 1/3: Connection refused (Server starting up)
- Attempt 2/3: Status 200 OK
- Health Check: Service is responding and healthy!`);
    await delay(1500);

    // 5. Success (Deployment Success)
    await updateDeploymentStatus(id, 'SUCCESS', `[5/5] 🎉 Deployment Success
- Routing configuration updated.
- NGINX reload triggered.
- Deployment completed successfully.
- Your app is now live at: http://localhost:80`);
  } catch (error) {
    console.error('Deployment simulation failed:', error);
    await updateDeploymentStatus(id, 'FAILED', `[FATAL ERROR] ❌ Deployment Pipeline Failed: ${error.message}`);
  }
};
