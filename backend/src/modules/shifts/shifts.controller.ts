import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { ShiftsService } from './shifts.service';
import { errorResponse, successResponse } from '../../utils/response';

export class ShiftsController {
  static async getCurrent(req: AuthRequest, res: Response) {
    try {
      const shift = await ShiftsService.getCurrentShift(req.user!.outletId, req.user!.userId);
      return res.status(200).json(successResponse(shift));
    } catch (error: any) {
      return res.status(error.status || 500).json(errorResponse('ERROR', error.message));
    }
  }

  static async getActive(req: AuthRequest, res: Response) {
    try {
      const shift = await ShiftsService.getActiveShiftInOutlet(req.user!.outletId);
      return res.status(200).json(successResponse(shift));
    } catch (error: any) {
      return res.status(error.status || 500).json(errorResponse('ERROR', error.message));
    }
  }

  static async open(req: AuthRequest, res: Response) {
    try {
      const { startBalance } = req.body;
      const shift = await ShiftsService.openShift(req.user!.outletId, req.user!.userId, Number(startBalance) || 0);
      return res.status(201).json(successResponse(shift));
    } catch (error: any) {
      return res.status(error.status || 500).json(errorResponse('ERROR', error.message));
    }
  }

  static async close(req: AuthRequest, res: Response) {
    try {
      const { actualBalance } = req.body;
      const shift = await ShiftsService.closeShift(req.user!.outletId, req.user!.userId, Number(actualBalance) || 0);
      return res.status(200).json(successResponse(shift));
    } catch (error: any) {
      return res.status(error.status || 500).json(errorResponse('ERROR', error.message));
    }
  }

  static async getAll(req: AuthRequest, res: Response) {
    try {
      const shifts = await ShiftsService.getAllShifts(req.user!.outletId, req.query);
      return res.status(200).json(successResponse(shifts));
    } catch (error: any) {
      return res.status(error.status || 500).json(errorResponse('ERROR', error.message));
    }
  }
}
