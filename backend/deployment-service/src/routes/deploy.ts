import { Router } from 'express';
import Docker from 'dockerode';

const router = Router();
// Connect to the local Docker socket.
// For Windows, this might require specific configuration or named pipes (e.g., //./pipe/docker_engine)
// but standard dockerode defaults often handle this natively, or we use the Unix socket for WSL/Linux
const docker = new Docker({ socketPath: process.env.OS === 'Windows_NT' ? '//./pipe/docker_engine' : '/var/run/docker.sock' });

// List active containers
router.get('/containers', async (req, res) => {
  try {
    const containers = await docker.listContainers();
    res.json(containers);
  } catch (error) {
    console.error('Error fetching containers:', error);
    res.status(500).json({ error: 'Failed to fetch containers' });
  }
});

// Start a container (e.g. from an image name)
router.post('/start', async (req, res) => {
  try {
    const { image, name } = req.body;
    
    const container = await docker.createContainer({
      Image: image,
      name: name,
      HostConfig: {
        PublishAllPorts: true
      }
    });

    await container.start();
    
    res.status(201).json({ message: 'Container started successfully', containerId: container.id });
  } catch (error) {
    console.error('Error starting container:', error);
    res.status(500).json({ error: 'Failed to start container' });
  }
});

// Stop a container
router.post('/stop/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const container = docker.getContainer(id);
    await container.stop();
    res.json({ message: 'Container stopped successfully' });
  } catch (error) {
    console.error('Error stopping container:', error);
    res.status(500).json({ error: 'Failed to stop container' });
  }
});

export default router;
