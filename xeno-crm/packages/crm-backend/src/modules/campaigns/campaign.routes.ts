import { Router } from 'express';
import { campaignController } from './campaign.controller';

const router = Router();

router.get('/', campaignController.list);
router.post('/copilot', campaignController.copilot);
router.post('/', campaignController.create);
router.get('/:id', campaignController.getOne);
router.post('/:id/launch', campaignController.launch);
router.get('/:id/stats', campaignController.getStats);
router.delete('/:id', campaignController.delete);

export default router;
