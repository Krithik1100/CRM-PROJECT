import { Router } from 'express';
import { segmentController } from './segment.controller';

const router = Router();

router.get('/', segmentController.list);
router.post('/ai-query', segmentController.aiQuery);
router.post('/', segmentController.create);
router.get('/:id', segmentController.getOne);
router.get('/:id/customers', segmentController.getCustomers);

export default router;
