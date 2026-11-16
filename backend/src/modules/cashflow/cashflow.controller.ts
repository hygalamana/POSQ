import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { CashflowService } from './cashflow.service';
import { successResponse, errorResponse } from '../../utils/response';

export class CashflowController {
  static async getAll(req: AuthRequest, res: Response) {
    try {
      if (!req.user) throw new Error('Not authenticated');
      const data = await CashflowService.getAll(req.user.outletId, req.query);
      return res.status(200).json(successResponse(data));
    } catch (error: any) {
      return res.status(error.status || 500).json(
        errorResponse(error.code || 'INTERNAL_ERROR', error.message)
      );
    }
  }

  static async create(req: AuthRequest, res: Response) {
    try {
      if (!req.user) throw new Error('Not authenticated');
      const data = await CashflowService.create(req.body, req.user.outletId, req.user.userId);
      return res.status(201).json(successResponse(data));
    } catch (error: any) {
      return res.status(error.status || 500).json(
        errorResponse(error.code || 'INTERNAL_ERROR', error.message)
      );
    }
  }

  static async delete(req: AuthRequest, res: Response) {
    try {
      if (!req.user) throw new Error('Not authenticated');
      await CashflowService.delete(req.params.id as string, req.user.outletId);
      return res.status(200).json(successResponse({ message: 'Cashflow record deleted' }));
    } catch (error: any) {
      return res.status(error.status || 500).json(
        errorResponse(error.code || 'INTERNAL_ERROR', error.message)
      );
    }
  }
}
