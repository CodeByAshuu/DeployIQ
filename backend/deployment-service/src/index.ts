import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import dotenv from 'dotenv';
import deploymentRoutes from './routes/deployment.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4002;

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/deployments', deploymentRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'deployment-service' });
});

app.listen(PORT, () => {
  console.log(`Deployment service listening on port ${PORT}`);
});
