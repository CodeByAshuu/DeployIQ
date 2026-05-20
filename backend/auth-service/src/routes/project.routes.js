import { Router } from 'express';
import { create, list, get, update, remove } from '../controllers/project.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../utils/validators.js';
import { createProjectSchema, updateProjectSchema } from '../utils/project.validation.js';

const router = Router();

// Debug logger for route loading
console.log('PROJECT ROUTES LOADED');

// Log each request to project routes
router.use((req, res, next) => {
  console.log(`PROJECT ROUTE HIT: ${req.method} ${req.originalUrl}`);
  next();
});

// Secure all project endpoints using JWT authentication middleware
router.use(authenticate);

router.post('/', validateRequest(createProjectSchema), create);
router.get('/', list);
router.get('/:id', get);
router.put('/:id', validateRequest(updateProjectSchema), update);
router.delete('/:id', remove);

export default router;
