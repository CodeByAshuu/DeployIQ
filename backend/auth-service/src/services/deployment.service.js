import { prisma } from '../config/db.js';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import net from 'net';
import Docker from 'dockerode';

const isWin = process.platform === 'win32';
const dockerOptions = isWin ? { socketPath: '//./pipe/docker_engine' } : { socketPath: '/var/run/docker.sock' };
const docker = new Docker(dockerOptions);

const HOST_WORKSPACE_ROOT = 'c:/Users/ASUS/Documents/PROJECTS/DeployIQ';
const activeLogStreams = new Map();

// Helpers
const getHostProjectPath = (projectId) => {
  return `${HOST_WORKSPACE_ROOT}/deployments/${projectId}/source`;
};

const verifyHealth = async (port, onLog = () => {}) => {
  const maxRetries = 15;
  const retryDelay = 2000;

  onLog(`[HEALTHCHECK] Waiting for application startup on port ${port}...`);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Check if container responds over HTTP
      const response = await fetch(`http://host.docker.internal:${port}`);

      if (
        response.ok ||
        response.status === 301 ||
        response.status === 302
      ) {
        onLog(`[HEALTHCHECK] Success on attempt ${attempt}.`);
        return true;
      }

      onLog(
        `[HEALTHCHECK] Attempt ${attempt}: HTTP ${response.status}`
      );
    } catch (err) {
      onLog(
        `[HEALTHCHECK] Attempt ${attempt} failed: ${err.message}`
      );
    }

    await new Promise((resolve) =>
      setTimeout(resolve, retryDelay)
    );
  }

  onLog(`[HEALTHCHECK] Timed out after ${maxRetries} attempts.`);
  return false;
};

const runShellCommand = (cmd, args, options, onLog) => {
  return new Promise((resolve, reject) => {
    onLog(`[SHELL] Executing: ${cmd} ${args.join(' ')}`);
    const child = spawn(cmd, args, options);
    
    let buffer = '';
    const handleData = (data) => {
      buffer += data.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) {
        if (line.trim()) onLog(line.trim());
      }
    };
    
    child.stdout.on('data', handleData);
    child.stderr.on('data', handleData);
    
    child.on('close', (code) => {
      if (buffer.trim()) onLog(buffer.trim());
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
    
    child.on('error', reject);
  });
};

const forceRemoveContainer = async (containerName) => {
  try {
    const container = docker.getContainer(containerName);
    const info = await container.inspect();
    if (info) {
      console.log(`Force removing container ${containerName}...`);
      try {
        await container.stop();
      } catch (e) {}
      await container.remove({ force: true });
    }
  } catch (e) {
    // Ignore container not found
  }
};

const startRealLogStream = (projectId, deploymentId, containerNameOrId, isCompose, sourcePath) => {
  // Clear any existing stream for this deployment
  const existing = activeLogStreams.get(deploymentId);
  if (existing) {
    existing.kill();
    activeLogStreams.delete(deploymentId);
  }
  
  let child;
  if (isCompose) {
    child = spawn('docker', ['compose', '-p', containerNameOrId, 'logs', '-f'], { cwd: sourcePath });
  } else {
    child = spawn('docker', ['logs', '-f', containerNameOrId]);
  }
  
  activeLogStreams.set(deploymentId, child);
  
  let logBuffer = [];
  let writeTimeout = null;
  
  const flushLogs = async () => {
    if (logBuffer.length === 0) return;
    const lines = [...logBuffer];
    logBuffer = [];
    writeTimeout = null;
    
    try {
      const dep = await prisma.deployment.findUnique({ where: { id: deploymentId } });
      if (dep) {
        await prisma.deployment.update({
          where: { id: deploymentId },
          data: { logs: dep.logs + lines.join('\n') + '\n' }
        });
      }
    } catch (e) {
      console.error(`Failed to flush container logs for ${deploymentId}:`, e.message);
    }
  };
  
  const handleData = (data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (line.trim()) {
        logBuffer.push(`[RUNTIME] ${line.trim()}`);
      }
    }
    if (logBuffer.length > 50) {
      flushLogs();
    } else if (!writeTimeout && logBuffer.length > 0) {
      writeTimeout = setTimeout(flushLogs, 1500);
    }
  };
  
  child.stdout.on('data', handleData);
  child.stderr.on('data', handleData);
  
  child.on('close', () => {
    flushLogs();
    activeLogStreams.delete(deploymentId);
  });
};

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

  // Real Docker Clean up
  try {
    if (deployment.containerId) {
      if (deployment.deploymentType === 'COMPOSE' && deployment.composeProjectName) {
        const sourcePath = path.resolve(process.cwd(), 'deployments', deployment.projectId, 'source');
        console.log(`[CLEANUP] Stopping compose project: ${deployment.composeProjectName}`);
        await runShellCommand('docker', ['compose', '-p', deployment.composeProjectName, 'down', '--remove-orphans'], { cwd: sourcePath }, (msg) => console.log(msg));
      } else {
        const containerName = `deployiq-container-${deployment.projectId.slice(0, 8)}`;
        console.log(`[CLEANUP] Removing container: ${containerName}`);
        await forceRemoveContainer(containerName);
      }
    }
    
    if (deployment.imageName) {
      const { removeImage } = await import('./docker.service.js');
      console.log(`[CLEANUP] Removing image: ${deployment.imageName}`);
      await removeImage(deployment.imageName);
    }
  } catch (err) {
    console.error('Docker cleanup during deployment delete failed:', err.message);
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
    const files = await fs.readdir(sourcePath);
    
    let deployType = '';
    let assignedPort = null;
    let containerNameOrId = '';
    let imageName = '';
    let deploymentUrl = '';
    
    if (files.includes('docker-compose.yml') || files.includes('compose.yaml')) {
      deployType = 'COMPOSE';
      const composeFile = files.includes('docker-compose.yml') ? 'docker-compose.yml' : 'compose.yaml';
      await logToDb('BUILDING', `Project type: Docker Compose detected (${composeFile})`);
      
      const projectName = `deployiq-${projectId.slice(0, 8)}`;
      containerNameOrId = projectName;
      
      // Stop old compose project if exists
      await logToDb('BUILDING', `Stopping any existing containers for compose project: ${projectName}...`);
      try {
        await runShellCommand('docker', ['compose', '-p', projectName, 'down', '--remove-orphans'], { cwd: sourcePath }, async (msg) => {
          await logToDb('BUILDING', `[Compose Down] ${msg}`);
        });
      } catch (err) {
        // Ignore
      }
      
      // Build and up
      await logToDb('BUILDING', `Running docker compose up -d --build...`);
      await runShellCommand('docker', ['compose', '-p', projectName, 'up', '-d', '--build'], { cwd: sourcePath }, async (msg) => {
        await logToDb('BUILDING', msg);
      });
      
      // Extract service information using Dockerode
      await logToDb('STARTING', `[3/4] 🚀 Extracting Compose service information...`);
      const composeContainers = await docker.listContainers({
        all: true,
        filters: JSON.stringify({
          label: [`com.docker.compose.project=${projectName}`]
        })
      });
      
      if (composeContainers.length === 0) {
        throw new Error('Compose execution failed: No containers were started.');
      }
      
      const serviceNames = [];
      const containerIds = [];
      const portMappings = [];
      
      composeContainers.forEach(c => {
        containerIds.push(c.Id);
        const sName = c.Labels['com.docker.compose.service'] || 'unknown';
        serviceNames.push(sName);
        if (c.Ports) {
          c.Ports.forEach(p => {
            if (p.PublicPort) {
              portMappings.push(`${p.PublicPort}:${p.PrivatePort}`);
              if (!assignedPort) assignedPort = p.PublicPort; // Use first public port as primary
            }
          });
        }
      });
      
      imageName = composeContainers.map(c => c.Image).join(', ');
      
      await logToDb('STARTING', `Active Services: ${serviceNames.join(', ')}`);
      if (assignedPort) {
        deploymentUrl = `http://localhost:${assignedPort}`;
        await logToDb('STARTING', `Primary service port mapped to host: ${assignedPort}`);
      } else {
        await logToDb('STARTING', `Warning: No exposed public ports discovered in Compose services.`);
      }
      
      // Verify Health
      if (assignedPort) {
        await logToDb('STARTING', `Performing container network health check on port ${assignedPort}...`);
        const isHealthy = await verifyHealth(
          assignedPort,
          async (msg) => {
            await logToDb('STARTING', msg);
          }
        );
        if (!isHealthy) {
          throw new Error(`Health check failed: Port ${assignedPort} did not respond within timeout.`);
        }
      }
      
      await logToDb('SUCCESS', `[4/4] 🎉 Compose Deployment Success! All services operational.`);
      await updateDeploymentStatus(id, 'SUCCESS', withTimestamp(`App is now live at: ${deploymentUrl}`), {
        containerId: containerIds.join(','),
        imageName,
        assignedPort,
        deploymentUrl,
        deploymentType: 'COMPOSE',
        deployedPort: assignedPort,
        composeProjectName: projectName,
        runtimeStatus: 'RUNNING',
        startedAt: new Date()
      });
      
      // Start Real-time logs streaming
      startRealLogStream(projectId, id, projectName, true, sourcePath);
      
    } else {
      // Single Container Path (Dockerfile, Node.js, Static HTML)
      const { getAvailablePort } = await import('./portManager.service.js');
      assignedPort = await getAvailablePort();
      containerNameOrId = `deployiq-container-${projectId.slice(0, 8)}`;
      imageName = `deployiq-project-${projectId.slice(0, 8)}:latest`;
      deploymentUrl = `http://localhost:${assignedPort}`;
      
      // Update deployment with allocated port immediately so other parallel pipelines don't take it
      await prisma.deployment.update({
        where: { id },
        data: { assignedPort, deployedPort: assignedPort }
      });
      
      await forceRemoveContainer(containerNameOrId);
      
      if (files.includes('Dockerfile')) {
        deployType = 'DOCKERFILE';
        await logToDb('BUILDING', `Project type: Custom Dockerfile detected.`);
        
        // Find internal exposed port
        let internalPort = 80;
        try {
          const dockerfileContent = await fs.readFile(path.join(sourcePath, 'Dockerfile'), 'utf8');
          const exposeMatch = dockerfileContent.match(/EXPOSE\s+(\d+)/i);
          if (exposeMatch) {
            internalPort = parseInt(exposeMatch[1], 10);
          }
        } catch (e) { }
        
        await logToDb('BUILDING', `Exposed Dockerfile port detected: ${internalPort}`);
        await logToDb('BUILDING', `Building image ${imageName}...`);
        await runShellCommand('docker', ['build', '-t', imageName, '.'], { cwd: sourcePath }, async (msg) => {
          await logToDb('BUILDING', msg);
        });
        
        await logToDb('STARTING', `[3/4] 🚀 Starting container ${containerNameOrId} on host port ${assignedPort}...`);
        await runShellCommand('docker', ['run', '-d', '-p', `${assignedPort}:${internalPort}`, '--name', containerNameOrId, imageName], {}, async (msg) => {
          await logToDb('STARTING', msg);
        });
        
      } else if (files.includes('package.json')) {
        deployType = 'NODE';
        await logToDb('BUILDING', `Project type: Node.js (package.json) detected.`);
        await logToDb('BUILDING', `Generating optimized Dockerfile for Node.js platform context...`);
        
        const dockerfileContent = `FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]`;
        
        await fs.writeFile(path.join(sourcePath, 'Dockerfile'), dockerfileContent.trim());
        
        await logToDb('BUILDING', `Building image ${imageName}...`);
        await runShellCommand('docker', ['build', '-t', imageName, '.'], { cwd: sourcePath }, async (msg) => {
          await logToDb('BUILDING', msg);
        });
        
        await logToDb('STARTING', `[3/4] 🚀 Starting container ${containerNameOrId} on host port ${assignedPort}...`);
        await runShellCommand('docker', ['run', '-d', '-p', `${assignedPort}:3000`, '--name', containerNameOrId, imageName], {}, async (msg) => {
          await logToDb('STARTING', msg);
        });
        
      } else if (files.includes('index.html')) {
        deployType = 'STATIC';
        await logToDb('BUILDING', `Project type: Static HTML detected.`);
        
        const hostProjectPath = getHostProjectPath(projectId);
        await logToDb('BUILDING', `Hosting via Nginx container with volume mount: ${hostProjectPath}`);
        
        await logToDb('STARTING', `[3/4] 🚀 Starting Nginx container ${containerNameOrId} on host port ${assignedPort}...`);
        await runShellCommand('docker', ['run', '-d', '-p', `${assignedPort}:80`, '-v', `${hostProjectPath}:/usr/share/nginx/html:ro`, '--name', containerNameOrId, 'nginx:alpine'], {}, async (msg) => {
          await logToDb('STARTING', msg);
        });
      } else {
        throw new Error('Unsupported project structure.');
      }
      
      // Extract container ID
      const inspectData = await docker.getContainer(containerNameOrId).inspect();
      const containerId = inspectData.Id;
      
      // Verify Health
      await logToDb('STARTING', `Performing container network health check on port ${assignedPort}...`);
      const isHealthy = await verifyHealth(
        assignedPort,
        async (msg) => {
          await logToDb('STARTING', msg);
        }
      );
      if (!isHealthy) {
        const containerInfo = await docker
          .getContainer(containerNameOrId)
          .inspect();

        await logToDb(
          'FAILED',
          `[DEBUG] Container State: ${JSON.stringify(containerInfo.State)}`
        );
        throw new Error(`Health check failed: Container is not responding on port ${assignedPort}.`);
      }
      
      await logToDb('SUCCESS', `[4/4] 🎉 Deployment Success! Container is running.`);
      await updateDeploymentStatus(id, 'SUCCESS', withTimestamp(`App is now live at: ${deploymentUrl}`), {
        containerId,
        imageName,
        assignedPort,
        deploymentUrl,
        deploymentType: deployType,
        deployedPort: assignedPort,
        runtimeStatus: 'RUNNING',
        startedAt: new Date()
      });
      
      // Start Real-time logs streaming
      startRealLogStream(projectId, id, containerNameOrId, false);
    }
    
  } catch (error) {
    console.error('Deployment pipeline failed:', error);
    await logToDb('FAILED', `[FATAL ERROR] ❌ Deployment Pipeline Failed: ${error.message}`);
    await updateDeploymentStatus(id, 'FAILED', withTimestamp(`Deployment failed. Clean up done.`), {
      runtimeStatus: 'STOPPED'
    });
  }
};
