import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import projectRoutes from './routes/project.routes.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { logger } from './utils/logger.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
console.log('PROJECT ROUTES MOUNTED');

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'auth-service' });
});

// Centralized error handler
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Auth service running on port ${PORT}`);
});
