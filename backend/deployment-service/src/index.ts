import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import deployRoutes from './routes/deploy';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/deploy', deployRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'deployment-service' });
});

app.listen(PORT, () => {
  console.log(`Deployment Service running on http://localhost:${PORT}`);
});
