import { Router } from 'express';
import { customerController } from './customer.controller';

const router = Router();

router.get('/', customerController.list);
router.get('/stats', customerController.getStats);
router.get('/:id', customerController.getOne);
router.post('/seed', customerController.seed);

export default router;
