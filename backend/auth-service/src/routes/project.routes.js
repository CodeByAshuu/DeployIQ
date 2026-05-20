import { Router } from 'express';
import { create, list, get, update, remove } from '../controllers/project.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../utils/validators.js';
import { createProjectSchema, updateProjectSchema } from '../utils/project.validation.js';

const router = Router();

// Secure all project endpoints using JWT authentication middleware
router.use(authenticate);

router.post('/', validateRequest(createProjectSchema), create);
router.get('/', list);
router.get('/:id', validateRequest(updateProjectSchema), update); // PUT request uses the update schema
router.put('/:id', validateRequest(updateProjectSchema), update);
router.delete('/:id', remove);

export default router;
