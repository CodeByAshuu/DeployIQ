import Docker from 'dockerode';
import process from 'process';

const isWin = process.platform === 'win32';
const dockerOptions = isWin ? { socketPath: '//./pipe/docker_engine' } : { socketPath: '/var/run/docker.sock' };
const docker = new Docker(dockerOptions);

export const buildImage = async (contextPath, imageName, onLog) => {
  onLog(`[DOCKER] Building image: ${imageName}`);
  
  return new Promise((resolve, reject) => {
    docker.buildImage({
      context: contextPath,
      src: ['.']
    }, { t: imageName }, (err, stream) => {
      if (err) {
        onLog(`[DOCKER] Failed to initiate build: ${err.message}`);
        return reject(err);
      }
      
      docker.modem.followProgress(stream, onFinished, onProgress);
      
      function onFinished(err, output) {
        if (err) {
          onLog(`[DOCKER] Build failed: ${err.message}`);
          return reject(err);
        }
        onLog(`[DOCKER] Build complete: ${imageName}`);
        resolve();
      }
      
      function onProgress(event) {
        if (event.stream) {
          const msg = event.stream.trim();
          if (msg) onLog(`[DOCKER BUILD] ${msg}`);
        } else if (event.error) {
          onLog(`[DOCKER BUILD ERROR] ${event.error}`);
        }
      }
    });
  });
};

export const createAndStartContainer = async (imageName, port, containerName, targetPort, onLog) => {
  onLog(`[DOCKER] Creating container ${containerName} from image ${imageName}`);
  
  try {
    // Remove existing container with the same name if it exists
    try {
      const existing = docker.getContainer(containerName);
      const info = await existing.inspect();
      if (info) {
        onLog(`[DOCKER] Found existing container ${containerName}, stopping and removing...`);
        if (info.State.Running) {
          await existing.stop();
        }
        await existing.remove();
      }
    } catch (e) {
      // Ignored: container doesn't exist
    }

    const containerConfig = {
      Image: imageName,
      name: containerName,
      ExposedPorts: {},
      HostConfig: {
        PortBindings: {},
        RestartPolicy: {
          Name: 'unless-stopped'
        }
      }
    };

    // Bind specific target port to allocated host port
    const portKey = `${targetPort}/tcp`;
    containerConfig.ExposedPorts[portKey] = {};
    containerConfig.HostConfig.PortBindings[portKey] = [{ HostPort: port.toString() }];

    const container = await docker.createContainer(containerConfig);

    onLog(`[DOCKER] Starting container: ${containerName}`);
    await container.start();
    
    const info = await container.inspect();
    onLog(`[DOCKER] Container started successfully. ID: ${info.Id}`);
    return info.Id;
  } catch (error) {
    onLog(`[DOCKER] Failed to create/start container: ${error.message}`);
    throw error;
  }
};
