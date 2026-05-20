import Docker from 'dockerode';
import process from 'process';

const isWin = process.platform === 'win32';
const dockerOptions = isWin ? { socketPath: '//./pipe/docker_engine' } : { socketPath: '/var/run/docker.sock' };
const docker = new Docker(dockerOptions);

export const listContainers = async () => {
  try {
    const containers = await docker.listContainers({ all: true });
    return containers.map((c) => ({
      id: c.Id,
      names: c.Names,
      image: c.Image,
      state: c.State, // e.g. running, exited
      status: c.Status,
      ports: c.Ports,
    }));
  } catch (error) {
    console.error('Docker listContainers error:', error);
    throw new Error(`Failed to list containers: ${error.message}`);
  }
};

export const getContainerStats = async (id) => {
  try {
    const container = docker.getContainer(id);
    const stats = await container.stats({ stream: false });

    // Calculate CPU percent
    // Formula: (cpu_stats.cpu_usage.total_usage - precpu_stats.cpu_usage.total_usage) / 
    //          (cpu_stats.system_cpu_usage - precpu_stats.system_cpu_usage) * number_of_cpus * 100
    let cpuPercent = 0.0;
    if (stats.cpu_stats && stats.precpu_stats) {
      const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
      const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
      const numCpus = stats.cpu_stats.online_cpus || 1;
      if (systemDelta > 0 && cpuDelta > 0) {
        cpuPercent = (cpuDelta / systemDelta) * numCpus * 100;
      }
    }

    // Calculate memory percent
    // Formula: memory_stats.usage / memory_stats.limit * 100
    let memPercent = 0.0;
    let memUsage = 0;
    let memLimit = 0;
    if (stats.memory_stats && stats.memory_stats.usage) {
      memUsage = stats.memory_stats.usage;
      memLimit = stats.memory_stats.limit;
      if (memLimit > 0) {
        memPercent = (memUsage / memLimit) * 100;
      }
    }

    return {
      id,
      cpuPercent: parseFloat(cpuPercent.toFixed(2)),
      memoryPercent: parseFloat(memPercent.toFixed(2)),
      memoryUsageBytes: memUsage,
      memoryLimitBytes: memLimit,
      networks: stats.networks || {},
    };
  } catch (error) {
    console.error(`Docker getContainerStats error for ${id}:`, error);
    // Return dummy metrics instead of throwing, so UI dashboard doesn't completely crash if stats fail
    return {
      id,
      cpuPercent: 0.0,
      memoryPercent: 0.0,
      memoryUsageBytes: 0,
      memoryLimitBytes: 0,
      error: error.message,
    };
  }
};

export const startContainer = async (id) => {
  try {
    const container = docker.getContainer(id);
    await container.start();
    return { message: 'Container started successfully' };
  } catch (error) {
    console.error(`Docker startContainer error for ${id}:`, error);
    throw new Error(`Failed to start container: ${error.message}`);
  }
};

export const stopContainer = async (id) => {
  try {
    const container = docker.getContainer(id);
    await container.stop();
    return { message: 'Container stopped successfully' };
  } catch (error) {
    console.error(`Docker stopContainer error for ${id}:`, error);
    throw new Error(`Failed to stop container: ${error.message}`);
  }
};

export const restartContainer = async (id) => {
  try {
    const container = docker.getContainer(id);
    await container.restart();
    return { message: 'Container restarted successfully' };
  } catch (error) {
    console.error(`Docker restartContainer error for ${id}:`, error);
    throw new Error(`Failed to restart container: ${error.message}`);
  }
};

export const getContainerLogs = async (id) => {
  try {
    const container = docker.getContainer(id);
    const logBuffer = await container.logs({
      stdout: true,
      stderr: true,
      tail: 150,
      follow: false,
    });

    // Helper to decode Docker log multiplexed stream
    let offset = 0;
    let logsText = '';
    while (offset < logBuffer.length) {
      if (offset + 8 > logBuffer.length) break;
      const size = logBuffer.readUInt32BE(offset + 4);
      if (offset + 8 + size > logBuffer.length) {
        // Fallback if buffer is cut off
        logsText += logBuffer.toString('utf8', offset + 8);
        break;
      }
      const content = logBuffer.toString('utf8', offset + 8, offset + 8 + size);
      logsText += content;
      offset += 8 + size;
    }

    return logsText || logBuffer.toString('utf8');
  } catch (error) {
    console.error(`Docker getContainerLogs error for ${id}:`, error);
    throw new Error(`Failed to fetch container logs: ${error.message}`);
  }
};
