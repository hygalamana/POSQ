import { Response } from 'express';
import { UsersService } from './users.service';
import { successResponse, errorResponse } from '../../utils/response';
import { AuthRequest } from '../../middleware/auth';

export class UsersController {
  static async getUsers(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== 'OWNER') {
        throw { status: 403, message: 'Akses ditolak. Hanya OWNER yang dapat melihat pengguna.' };
      }
      const data = await UsersService.getUsers(req.user.outletId);
      return res.status(200).json(successResponse(data));
    } catch (error: any) {
      return res.status(error.status || 500).json(
        errorResponse(error.code || 'INTERNAL_ERROR', error.message)
      );
    }
  }

  static async createUser(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== 'OWNER') {
        throw { status: 403, message: 'Akses ditolak. Hanya OWNER yang dapat membuat pengguna.' };
      }
      const data = await UsersService.createUser(req.user.outletId, req.body);
      return res.status(201).json(successResponse(data));
    } catch (error: any) {
      return res.status(error.status || 500).json(
        errorResponse(error.code || 'INTERNAL_ERROR', error.message)
      );
    }
  }

  static async updateUser(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== 'OWNER') {
        throw { status: 403, message: 'Akses ditolak. Hanya OWNER yang dapat mengedit pengguna.' };
      }
      const data = await UsersService.updateUser(req.user.outletId, req.params.id as string, req.body);
      return res.status(200).json(successResponse(data));
    } catch (error: any) {
      return res.status(error.status || 500).json(
        errorResponse(error.code || 'INTERNAL_ERROR', error.message)
      );
    }
  }

  static async deleteUser(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== 'OWNER') {
        throw { status: 403, message: 'Akses ditolak. Hanya OWNER yang dapat menghapus pengguna.' };
      }
      const data = await UsersService.deleteUser(req.user.outletId, req.params.id as string);
      return res.status(200).json(successResponse(data));
    } catch (error: any) {
      return res.status(error.status || 500).json(
        errorResponse(error.code || 'INTERNAL_ERROR', error.message)
      );
    }
  }
}
