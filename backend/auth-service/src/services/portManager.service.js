import { prisma } from '../config/db.js';

const STARTING_PORT = 3005;
const MAX_PORT = 4000;

export const getAvailablePort = async () => {
  // Find the highest assigned port
  const deployment = await prisma.deployment.findFirst({
    where: { assignedPort: { not: null } },
    orderBy: { assignedPort: 'desc' },
  });

  if (!deployment || !deployment.assignedPort) {
    return STARTING_PORT;
  }

  const nextPort = deployment.assignedPort + 1;
  if (nextPort > MAX_PORT) {
    throw new Error('Port exhaustion: No available ports within the allocated range.');
  }

  return nextPort;
};
