import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

export const cloneRepository = async (repoUrl, projectId, onLog) => {
  // Store deployments inside the container's working directory
  const targetDir = path.resolve(process.cwd(), 'deployments', projectId, 'source');
  
  try {
    // Cleanup if exists
    await fs.rm(targetDir, { recursive: true, force: true });
  } catch (err) {
    // Ignore error if directory doesn't exist
  }

  onLog(`[GIT] Preparing to clone repository: ${repoUrl}`);
  onLog(`[GIT] Target directory: ${targetDir}`);

  return new Promise((resolve, reject) => {
    onLog(`[GIT] Executing: git clone --depth 1 ${repoUrl} ${targetDir}`);
    
    const child = spawn('git', ['clone', '--depth', '1', repoUrl, targetDir]);
    
    let buffer = '';
    const handleData = (data) => {
      buffer += data.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop(); // keep last partial line
      for (const line of lines) {
        if (line.trim()) {
          onLog(`[GIT] ${line.trim()}`);
        }
      }
    };

    child.stdout.on('data', handleData);
    child.stderr.on('data', handleData);

    child.on('close', (code) => {
      if (buffer.trim()) {
        onLog(`[GIT] ${buffer.trim()}`);
      }
      if (code === 0) {
        onLog(`[GIT] Repository cloned successfully.`);
        resolve(targetDir);
      } else {
        onLog(`[GIT] Git clone failed with exit code ${code}`);
        reject(new Error(`Git clone failed with exit code ${code}`));
      }
    });

    child.on('error', (err) => {
      onLog(`[GIT] Spawn error: ${err.message}`);
      reject(err);
    });
  });
};
