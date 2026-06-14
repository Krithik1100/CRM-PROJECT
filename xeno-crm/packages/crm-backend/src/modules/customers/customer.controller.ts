import { Request, Response, NextFunction } from 'express';
import { customerService } from './customer.service';
import { sendSuccess, sendPaginated } from '../../shared/utils/response';

export const customerController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = '1', limit = '20', search, tier, city } = req.query;
      const { customers, total } = await customerService.listCustomers({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        search: search as string,
        tier: tier as string,
        city: city as string,
      });
      sendPaginated(res, customers, total, parseInt(page as string), parseInt(limit as string));
    } catch (err) {
      next(err);
    }
  },

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await customerService.getCustomer(req.params.id);
      sendSuccess(res, customer);
    } catch (err) {
      next(err);
    }
  },

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await customerService.getStats();
      sendSuccess(res, stats);
    } catch (err) {
      next(err);
    }
  },

  async seed(req: Request, res: Response, next: NextFunction) {
    try {
      const { count = 500 } = req.body;
      const result = await customerService.seedData(count);
      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  },
};
