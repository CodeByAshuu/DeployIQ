import { Router } from 'express';
import { listContainers, startContainer, stopContainer } from '../controllers/deployment.controller';
// import { authenticate } from '../middlewares/auth.middleware'; // TODO: add shared auth

const router = Router();

// For MVP, skipping auth middleware on these internal routes, but in production they must be protected
router.get('/containers', listContainers);
router.post('/deploy', startContainer);
router.post('/containers/:id/stop', stopContainer);

export default router;
