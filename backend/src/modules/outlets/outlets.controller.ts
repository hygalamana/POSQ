import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { db, outlets } from '../../config/database';
import { eq } from 'drizzle-orm';
import { errorResponse, successResponse } from '../../utils/response';

export class OutletsController {
  static async getOutlet(req: AuthRequest, res: Response) {
    try {
      const outletId = req.user!.outletId;
      const outlet = await db.query.outlets.findFirst({
        where: (o, { eq }) => eq(o.id, outletId),
      });
      if (!outlet) return res.status(404).json(errorResponse('NOT_FOUND', 'Outlet not found'));
      return res.status(200).json(successResponse(outlet));
    } catch (error: any) {
      return res.status(500).json(errorResponse('INTERNAL_ERROR', error.message));
    }
  }

  static async updatePointsSettings(req: AuthRequest, res: Response) {
    try {
      const outletId = req.user!.outletId;
      if (req.user?.role !== 'OWNER' && req.user?.role !== 'MANAGER') {
        return res.status(403).json(errorResponse('FORBIDDEN', 'Hanya manajer yang bisa mengubah ini'));
      }

      const { pointsEnabled, pointsRate } = req.body;
      const updated = db
        .update(outlets)
        .set({
          pointsEnabled: Boolean(pointsEnabled),
          pointsRate: Number(pointsRate) || 0,
        })
        .where(eq(outlets.id, outletId))
        .returning()
        .get();

      return res.status(200).json(successResponse(updated));
    } catch (error: any) {
      return res.status(500).json(errorResponse('INTERNAL_ERROR', error.message));
    }
  }
}
