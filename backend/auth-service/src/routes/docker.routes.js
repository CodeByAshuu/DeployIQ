import { Router } from 'express';
import { list, getDetails, start, stop, restart, getLogs } from '../controllers/docker.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

console.log('DOCKER ROUTES LOADED');

router.use((req, res, next) => {
  console.log(`DOCKER ROUTE HIT: ${req.method} ${req.originalUrl}`);
  next();
});

router.use(authenticate);

router.get('/containers', list);
router.get('/containers/:id', getDetails);
router.post('/containers/:id/start', start);
router.post('/containers/:id/stop', stop);
router.post('/containers/:id/restart', restart);
router.get('/containers/:id/logs', getLogs);

export default router;
