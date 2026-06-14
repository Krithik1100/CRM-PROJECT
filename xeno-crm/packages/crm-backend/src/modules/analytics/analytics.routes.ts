import { Router, Request, Response, NextFunction } from 'express';
import { campaignRepository } from '../campaigns/campaign.repository';
import { customerRepository } from '../customers/customer.repository';
import { sendSuccess } from '../../shared/utils/response';

const router = Router();

router.get('/overview', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [campaignStats, customerStats] = await Promise.all([
      campaignRepository.getOverviewStats(),
      customerRepository.getStats(),
    ]);
    sendSuccess(res, { campaigns: campaignStats, customers: customerStats });
  } catch (err) { next(err); }
});

export default router;
