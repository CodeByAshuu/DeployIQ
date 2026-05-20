import { Router } from 'express';
import { create, listAll, listByProject, get, updateStatus, remove, triggerDeploy } from '../controllers/deployment.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../utils/validators.js';
import { createDeploymentSchema, updateDeploymentStatusSchema } from '../utils/deployment.validation.js';

const router = Router();

console.log('DEPLOYMENT ROUTES LOADED');

router.use((req, res, next) => {
  console.log(`DEPLOYMENT ROUTE HIT: ${req.method} ${req.originalUrl}`);
  next();
});

router.use(authenticate);

router.post('/', validateRequest(createDeploymentSchema), create);
router.get('/', listAll);
router.get('/:id', get);
router.get('/project/:projectId', listByProject);
router.patch('/:id/status', validateRequest(updateDeploymentStatusSchema), updateStatus);
router.delete('/:id', remove);
router.post('/:id/trigger', triggerDeploy);

export default router;
