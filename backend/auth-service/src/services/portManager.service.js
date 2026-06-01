import { prisma } from '../config/db.js';
import net from 'net';
import Docker from 'dockerode';
import process from 'process';

const isWin = process.platform === 'win32';
const dockerOptions = isWin ? { socketPath: '//./pipe/docker_engine' } : { socketPath: '/var/run/docker.sock' };
const docker = new Docker(dockerOptions);

const STARTING_PORT = 4010;
const MAX_PORT = 5000;

const checkPortAvailable = async (port) => {
  // 1. Check mapped ports on host using Docker daemon
  try {
    const containers = await docker.listContainers({ all: true });
    for (const c of containers) {
      if (c.Ports) {
        for (const p of c.Ports) {
          if (p.PublicPort === port) {
            return false;
          }
        }
      }
    }
  } catch (e) {
    console.error('Docker list check port failed:', e.message);
  }

  // 2. TCP ping host.docker.internal to check host availability
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const timeout = setTimeout(() => {
      socket.destroy();
      resolve(true); // Timeout suggests port is free
    }, 1000);

    socket.connect(port, 'host.docker.internal', () => {
      clearTimeout(timeout);
      socket.destroy();
      resolve(false); // Successfully connected, meaning port is occupied
    });

    socket.on('error', () => {
      clearTimeout(timeout);
      socket.destroy();
      // If host.docker.internal resolution fails or connection is refused, port is free
      resolve(true);
    });
  });
};

export const getAvailablePort = async () => {
  let port = STARTING_PORT;
  
  while (port <= MAX_PORT) {
    // 1. Check if assigned in DB
    const existing = await prisma.deployment.findFirst({
      where: {
        OR: [
          { assignedPort: port },
          { deployedPort: port }
        ]
      }
    });
    
    if (!existing) {
      // 2. Check if port is bound on the host
      const isFree = await checkPortAvailable(port);
      if (isFree) {
        return port;
      }
    }
    
    port++;
  }
  
  throw new Error('Port exhaustion: No available ports within the range 4010-5000.');
};
