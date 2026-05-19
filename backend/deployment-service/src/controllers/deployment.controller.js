import { Request, Response } from 'express';
import Docker from 'dockerode';

// Connects to local docker socket by default
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

export const listContainers = async (req: Request, res: Response) => {
  try {
    const containers = await docker.listContainers({ all: true });
    // Filter for deployiq managed containers if needed
    res.status(200).json({ containers });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const startContainer = async (req: Request, res: Response) => {
  try {
    const { imageName, containerName } = req.body;
    
    if (!imageName) {
      return res.status(400).json({ error: 'imageName is required' });
    }

    // Pull the image first (simplified for MVP)
    await new Promise((resolve, reject) => {
      docker.pull(imageName, (err: Error, stream: any) => {
        if (err) return reject(err);
        docker.modem.followProgress(stream, (onFinishedErr, output) => {
          if (onFinishedErr) return reject(onFinishedErr);
          resolve(output);
        });
      });
    });

    const container = await docker.createContainer({
      Image: imageName,
      name: containerName || undefined,
      AttachStdin: false,
      AttachStdout: true,
      AttachStderr: true,
      Tty: true,
      HostConfig: {
        PublishAllPorts: true // Simple way to expose ports for MVP
      }
    });
    
    await container.start();
    res.status(201).json({ message: 'Deployment started', containerId: container.id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const stopContainer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const container = docker.getContainer(id);
    await container.stop();
    res.status(200).json({ message: `Container ${id} stopped` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
