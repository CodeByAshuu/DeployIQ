import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

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

  try {
    const command = `git clone --depth 1 ${repoUrl} ${targetDir}`;
    onLog(`[GIT] Executing: ${command}`);
    const { stdout, stderr } = await execAsync(command);
    if (stdout) onLog(`[GIT] ${stdout.trim()}`);
    if (stderr) onLog(`[GIT] ${stderr.trim()}`); // git clone outputs progress to stderr
    onLog(`[GIT] Repository cloned successfully.`);
    return targetDir;
  } catch (error) {
    onLog(`[GIT] Error cloning repository: ${error.message}`);
    throw new Error(`Git clone failed: ${error.message}`);
  }
};
