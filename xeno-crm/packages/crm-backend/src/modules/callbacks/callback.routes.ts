import { Router } from 'express';
import { callbackController } from './callback.controller';

const router = Router();

router.post('/communication-event', callbackController.handleCommunicationEvent);

export default router;
