import { z } from 'zod';

export const createDeploymentSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  imageTag: z.string().min(1, 'Image tag is required').optional(),
});

export const updateDeploymentStatusSchema = z.object({
  status: z.enum(['PENDING', 'BUILDING', 'RUNNING', 'SUCCESS', 'FAILED']),
  logs: z.string().optional(),
});
