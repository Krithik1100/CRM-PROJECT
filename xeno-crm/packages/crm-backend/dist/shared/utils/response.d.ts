import { Response } from 'express';
export declare const sendSuccess: <T>(res: Response, data: T, statusCode?: number, meta?: Record<string, unknown>) => void;
export declare const sendPaginated: <T>(res: Response, data: T[], total: number, page: number, limit: number) => void;
//# sourceMappingURL=response.d.ts.map