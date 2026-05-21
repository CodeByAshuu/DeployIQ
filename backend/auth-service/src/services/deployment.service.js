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

  // Update deployment status
  const updatedDeployment = await prisma.deployment.update({
    where: { id },
    data: {
      status,
      logs: updatedLogs,
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

// Simulation pipeline logic
export const runDeploymentSimulation = async (id) => {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const now = () => new Date().toLocaleTimeString();

  try {
    // Helper to wrap log with timestamp
    const withTimestamp = (msg) => `[${now()}] ${msg}`;

    // 1. Pending → Building (GitHub Pull)
    await updateDeploymentStatus(id, 'BUILDING', withTimestamp(`[1/5] 📥 GitHub Pull\n- Connecting to GitHub repository...\n- Fetching latest code from branch 'main'...\n- Pulling commit sha: f8a3c2d [Update configurations]\n- GitHub Pull: Completed successfully.`));
    await delay(2000);

    // Random failure after step 1 (10% chance)
    if (Math.random() < 0.1) throw new Error('GitHub Pull failed due to network issue');

    // 2. Building (Docker Build)
    await updateDeploymentStatus(id, 'BUILDING', withTimestamp(`[2/5] 🐳 Docker Build\n- Initializing Docker build context...\n- Step 1/5 : FROM node:18-alpine\n---> Using cached image\n- Step 2/5 : WORKDIR /app\n---> Using cached layer\n- Step 3/5 : COPY package*.json ./\n---> Running in container...\n- Step 4/5 : RUN npm ci --omit=dev\n---> Installing packages (this may take a few seconds)...\n---> packages installed successfully.\n- Step 5/5 : COPY . .\n---> Copying source files.\n- Exporting image layers...\n- Docker Build: Image build complete. Tagged as deployiq-app:latest`));
    await delay(3000);
    if (Math.random() < 0.1) throw new Error('Docker Build failed: missing Dockerfile');

    // 3. Running (Container Startup)
    await updateDeploymentStatus(id, 'RUNNING', withTimestamp(`[3/5] 🚀 Container Startup\n- Stopping existing container (if any)...\n- Creating container 'deployiq-user-app'...\n- Mounting persistent volumes...\n- Setting environment variables...\n- Container started successfully. ID: e8b9f1c7d24a\n- Port mapping: 3000 -> 80`));
    await delay(2000);
    if (Math.random() < 0.1) throw new Error('Container startup failed: port conflict');

    // 4. Running (Health Check)
    await updateDeploymentStatus(id, 'RUNNING', withTimestamp(`[4/5] 🩺 Health Check\n- Querying service HTTP interface on port 3000...\n- Attempt 1/3: Connection refused (Server starting up)\n- Attempt 2/3: Status 200 OK\n- Health Check: Service is responding and healthy!`));
    await delay(1500);
    if (Math.random() < 0.1) throw new Error('Health check failed: endpoint not reachable');

    // 5. Success (Deployment Success)
    await updateDeploymentStatus(id, 'SUCCESS', withTimestamp(`[5/5] 🎉 Deployment Success\n- Routing configuration updated.\n- NGINX reload triggered.\n- Deployment completed successfully.\n- Your app is now live at: http://localhost:80`));
  } catch (error) {
    console.error('Deployment simulation failed:', error);
    await updateDeploymentStatus(id, 'FAILED', withTimestamp(`[FATAL ERROR] ❌ Deployment Pipeline Failed: ${error.message}`));
  }
};
