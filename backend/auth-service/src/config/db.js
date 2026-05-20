import { PrismaClient } from '@prisma/client';

// Single PrismaClient instance shared across the service
const prisma = new PrismaClient();

export { prisma };
