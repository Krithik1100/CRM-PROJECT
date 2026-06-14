import { Request, Response, NextFunction } from 'express';
import { segmentService } from './segment.service';
import { sendSuccess } from '../../shared/utils/response';

export const segmentController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const segments = await segmentService.listSegments();
      sendSuccess(res, segments);
    } catch (err) { next(err); }
  },

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const segment = await segmentService.getSegment(req.params.id);
      sendSuccess(res, segment);
    } catch (err) { next(err); }
  },

  async aiQuery(req: Request, res: Response, next: NextFunction) {
    try {
      const { query } = req.body;
      const result = await segmentService.aiQuery(query);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const segment = await segmentService.createSegment(req.body);
      sendSuccess(res, segment, 201);
    } catch (err) { next(err); }
  },

  async getCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await segmentService.getSegmentCustomers(req.params.id);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  },
};
