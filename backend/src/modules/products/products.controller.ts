import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { ProductsService } from './products.service';
import { successResponse, errorResponse } from '../../utils/response';

export class ProductsController {
  static async getAll(req: AuthRequest, res: Response) {
    try {
      const data = await ProductsService.getAll(req.user!.outletId, req.query);
      return res.status(200).json(successResponse(data));
    } catch (error: any) {
      return res.status(error.status || 500).json(errorResponse('INTERNAL_ERROR', error.message));
    }
  }

  static async getById(req: AuthRequest, res: Response) {
    try {
      const data = await ProductsService.getById(req.params.id as string, req.user!.outletId);
      return res.status(200).json(successResponse(data));
    } catch (error: any) {
      return res.status(error.status || 500).json(errorResponse('NOT_FOUND', error.message));
    }
  }

  static async create(req: AuthRequest, res: Response) {
    try {
      const data = await ProductsService.create(req.body, req.user!.outletId);
      return res.status(201).json(successResponse(data));
    } catch (error: any) {
      return res.status(error.status || 500).json(errorResponse('INTERNAL_ERROR', error.message));
    }
  }

  static async update(req: AuthRequest, res: Response) {
    try {
      const data = await ProductsService.update(req.params.id as string, req.body, req.user!.outletId);
      return res.status(200).json(successResponse(data));
    } catch (error: any) {
      return res.status(error.status || 500).json(errorResponse('INTERNAL_ERROR', error.message));
    }
  }

  static async delete(req: AuthRequest, res: Response) {
    try {
      const data = await ProductsService.delete(req.params.id as string, req.user!.outletId);
      return res.status(200).json(successResponse(data));
    } catch (error: any) {
      return res.status(error.status || 500).json(errorResponse('INTERNAL_ERROR', error.message));
    }
  }

  static async uploadImage(req: AuthRequest, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json(errorResponse('VALIDATION_ERROR', 'No file uploaded'));
      }
      // Multer-storage-cloudinary adds `path` property as the URL
      const imageUrl = (req.file as any).path;
      const data = await ProductsService.uploadImage(req.params.id as string, imageUrl, req.user!.outletId);
      return res.status(200).json(successResponse(data));
    } catch (error: any) {
      return res.status(error.status || 500).json(errorResponse('INTERNAL_ERROR', error.message));
    }
  }

  static async getStockMovements(req: AuthRequest, res: Response) {
    try {
      const data = await ProductsService.getStockMovements(req.params.id as string, req.user!.outletId);
      return res.status(200).json(successResponse(data));
    } catch (error: any) {
      return res.status(error.status || 500).json(errorResponse('INTERNAL_ERROR', error.message));
    }
  }

  static async addStockMovement(req: AuthRequest, res: Response) {
    try {
      const data = await ProductsService.addStockMovement(req.params.id as string, req.user!.outletId, req.user!.userId, req.body);
      return res.status(201).json(successResponse(data));
    } catch (error: any) {
      return res.status(error.status || 500).json(errorResponse('INTERNAL_ERROR', error.message));
    }
  }
}

