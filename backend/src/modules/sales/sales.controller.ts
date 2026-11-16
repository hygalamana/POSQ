import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { SalesService } from './sales.service';
import { successResponse, errorResponse } from '../../utils/response';

export class SalesController {
  static async create(req: AuthRequest, res: Response) {
    try {
      const data = await SalesService.createSale(req.body, req.user!.userId, req.user!.outletId);
      return res.status(201).json(successResponse(data));
    } catch (error: any) {
      return res.status(error.status || 500).json(errorResponse('INTERNAL_ERROR', error.message));
    }
  }

  static async getAll(req: AuthRequest, res: Response) {
    try {
      const data = await SalesService.getAll(req.user!.outletId, req.query);
      return res.status(200).json(successResponse(data));
    } catch (error: any) {
      return res.status(error.status || 500).json(errorResponse('INTERNAL_ERROR', error.message));
    }
  }

  static async getById(req: AuthRequest, res: Response) {
    try {
      const data = await SalesService.getById(req.params.id as string, req.user!.outletId);
      return res.status(200).json(successResponse(data));
    } catch (error: any) {
      return res.status(error.status || 500).json(errorResponse('NOT_FOUND', error.message));
    }
  }

  static async cancel(req: AuthRequest, res: Response) {
    try {
      const data = await SalesService.cancelSale(req.params.id as string, req.user!.outletId);
      return res.status(200).json(successResponse(data));
    } catch (error: any) {
      return res.status(error.status || 500).json(errorResponse('INTERNAL_ERROR', error.message));
    }
  }

  static async syncOffline(req: AuthRequest, res: Response) {
    try {
      const sales = Array.isArray(req.body.sales) ? req.body.sales : [];
      const data = await SalesService.syncOfflineSales(sales, req.user!.userId, req.user!.outletId);
      return res.status(200).json(successResponse(data));
    } catch (error: any) {
      return res.status(error.status || 500).json(errorResponse('INTERNAL_ERROR', error.message));
    }
  }

  static async delete(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== 'OWNER') {
        throw { status: 403, message: 'Akses ditolak. Hanya OWNER yang dapat menghapus transaksi.' };
      }
      const data = await SalesService.deleteSale(req.params.id as string, req.user!.outletId);
      return res.status(200).json(successResponse(data, 'Transaksi berhasil dihapus'));
    } catch (error: any) {
      return res.status(error.status || 500).json(errorResponse('INTERNAL_ERROR', error.message));
    }
  }
}
