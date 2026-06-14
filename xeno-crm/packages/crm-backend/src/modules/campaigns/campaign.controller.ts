import { Request, Response, NextFunction } from 'express';
import { campaignService } from './campaign.service';
import { sendSuccess } from '../../shared/utils/response';

export const campaignController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const campaigns = await campaignService.listCampaigns();
      sendSuccess(res, campaigns);
    } catch (err) { next(err); }
  },

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const campaign = await campaignService.getCampaign(req.params.id);
      sendSuccess(res, campaign);
    } catch (err) { next(err); }
  },

  async copilot(req: Request, res: Response, next: NextFunction) {
    try {
      const { goal } = req.body;
      if (!goal) {
        res.status(400).json({ success: false, error: { message: 'goal is required' } });
        return;
      }
      const recommendation = await campaignService.copilot(goal);
      sendSuccess(res, recommendation);
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const campaign = await campaignService.createCampaign(req.body);
      sendSuccess(res, campaign, 201);
    } catch (err) { next(err); }
  },

  async launch(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await campaignService.launchCampaign(req.params.id);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await campaignService.deleteCampaign(req.params.id);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  },

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const campaign = await campaignService.getCampaign(req.params.id);
      sendSuccess(res, campaign);
    } catch (err) { next(err); }
  },
};
