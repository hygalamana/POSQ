import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { successResponse, errorResponse } from '../../utils/response';
import { AuthRequest } from '../../middleware/auth';

export class AuthController {
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const data = await AuthService.login(email, password);
      return res.status(200).json(successResponse(data));
    } catch (error: any) {
      return res.status(error.status || 500).json(
        errorResponse(error.code || 'UNAUTHORIZED', error.message)
      );
    }
  }

  static async refresh(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      const data = await AuthService.refresh(refreshToken);
      return res.status(200).json(successResponse(data));
    } catch (error: any) {
      return res.status(error.status || 401).json(
        errorResponse('UNAUTHORIZED', error.message)
      );
    }
  }

  static async logout(req: AuthRequest, res: Response) {
    try {
      if (req.user) {
        await AuthService.logout(req.user.userId);
      }
      return res.status(200).json(successResponse({ message: 'Logged out successfully' }));
    } catch (error: any) {
      return res.status(500).json(errorResponse('INTERNAL_ERROR', 'Failed to logout'));
    }
  }

  static async getMe(req: AuthRequest, res: Response) {
    try {
      if (!req.user) throw new Error('Not authenticated');
      const data = await AuthService.getMe(req.user.userId);
      return res.status(200).json(successResponse(data));
    } catch (error: any) {
      return res.status(error.status || 500).json(
        errorResponse(error.code || 'INTERNAL_ERROR', error.message)
      );
    }
  }

  static async updateProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.user) throw new Error('Not authenticated');
      const { name, avatar } = req.body;
      const data = await AuthService.updateProfile(req.user.userId, { name, avatar });
      return res.status(200).json(successResponse(data));
    } catch (error: any) {
      return res.status(error.status || 500).json(
        errorResponse(error.code || 'INTERNAL_ERROR', error.message)
      );
    }
  }

  static async updateOutlet(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== 'OWNER') {
        throw { status: 403, message: 'Akses ditolak. Hanya OWNER yang dapat mengubah informasi toko.' };
      }
      const { name, address, phone, taxRate, hasTax, receiptPrintTax, qrisPayload } = req.body;
      const data = await AuthService.updateOutlet(req.user.outletId, { name, address, phone, taxRate, hasTax, receiptPrintTax, qrisPayload });
      return res.status(200).json(successResponse(data));
    } catch (error: any) {
      return res.status(error.status || 500).json(
        errorResponse(error.code || 'INTERNAL_ERROR', error.message)
      );
    }
  }
}
