import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string()
    .min(3, 'Project name must be at least 3 characters long')
    .max(50, 'Project name must not exceed 50 characters'),
  description: z.string().max(200, 'Description must not exceed 200 characters').optional().nullable(),
  githubRepo: z.string().url('Invalid GitHub repository URL'),
});

export const updateProjectSchema = z.object({
  name: z.string()
    .min(3, 'Project name must be at least 3 characters long')
    .max(50, 'Project name must not exceed 50 characters')
    .optional(),
  description: z.string().max(200, 'Description must not exceed 200 characters').optional().nullable(),
  githubRepo: z.string().url('Invalid GitHub repository URL').optional(),
  deploymentStatus: z.enum(['PENDING', 'DEPLOYING', 'SUCCESS', 'FAILED']).optional(),
});
