import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { CategoriesService } from './categories.service';
import { successResponse, errorResponse } from '../../utils/response';

export class CategoriesController {
  static async getAll(req: AuthRequest, res: Response) {
    try {
      const outletId = req.user!.outletId;
      const activeOnly = req.query.all !== 'true';
      const data = await CategoriesService.getAll(outletId, activeOnly);
      return res.status(200).json(successResponse(data));
    } catch (error: any) {
      return res.status(error.status || 500).json(errorResponse('INTERNAL_ERROR', error.message));
    }
  }

  static async getById(req: AuthRequest, res: Response) {
    try {
      const data = await CategoriesService.getById(req.params.id as string, req.user!.outletId);
      return res.status(200).json(successResponse(data));
    } catch (error: any) {
      return res.status(error.status || 500).json(errorResponse('NOT_FOUND', error.message));
    }
  }

  static async create(req: AuthRequest, res: Response) {
    try {
      const data = await CategoriesService.create(req.body, req.user!.outletId);
      return res.status(201).json(successResponse(data));
    } catch (error: any) {
      return res.status(error.status || 500).json(errorResponse('INTERNAL_ERROR', error.message));
    }
  }

  static async update(req: AuthRequest, res: Response) {
    try {
      const data = await CategoriesService.update(req.params.id as string, req.body, req.user!.outletId);
      return res.status(200).json(successResponse(data));
    } catch (error: any) {
      return res.status(error.status || 500).json(errorResponse('INTERNAL_ERROR', error.message));
    }
  }

  static async delete(req: AuthRequest, res: Response) {
    try {
      const data = await CategoriesService.delete(req.params.id as string, req.user!.outletId);
      return res.status(200).json(successResponse(data));
    } catch (error: any) {
      return res.status(error.status || 500).json(errorResponse('INTERNAL_ERROR', error.message));
    }
  }
}
