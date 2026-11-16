import { db, shifts, sales } from '../../config/database';
import { eq, and, desc } from 'drizzle-orm';

export class ShiftsService {
  static async getCurrentShift(outletId: string, cashierId: string) {
    return await db.query.shifts.findFirst({
      where: (s, { eq, and }) =>
        and(eq(s.outletId, outletId), eq(s.cashierId, cashierId), eq(s.status, 'OPEN')),
      orderBy: (s, { desc }) => [desc(s.startTime)],
    });
  }

  static async getActiveShiftInOutlet(outletId: string) {
    return await db.query.shifts.findFirst({
      where: (s, { eq, and }) => and(eq(s.outletId, outletId), eq(s.status, 'OPEN')),
      orderBy: (s, { desc }) => [desc(s.startTime)],
      with: { cashier: true },
    });
  }

  static async openShift(outletId: string, cashierId: string, startBalance: number) {
    const existingInOutlet = await this.getActiveShiftInOutlet(outletId);
    if (existingInOutlet) {
      throw {
        status: 400,
        message: `Ada shift yang masih aktif di outlet ini (kasir: ${existingInOutlet.cashier?.name || 'kasir lain'}). Tutup shift tersebut terlebih dahulu.`,
      };
    }

    return db
      .insert(shifts)
      .values({
        outletId,
        cashierId,
        startBalance: Number(startBalance),
        status: 'OPEN',
      })
      .returning()
      .get();
  }

  static async closeShift(outletId: string, cashierId: string, actualBalance: number) {
    let shift = await this.getCurrentShift(outletId, cashierId);
    if (!shift) {
      // Fallback to active shift in outlet (e.g. Owner/Manager closing shift on register)
      shift = await this.getActiveShiftInOutlet(outletId);
    }
    if (!shift) {
      throw { status: 404, message: 'Tidak ada shift yang aktif untuk ditutup.' };
    }

    const shiftSales = await db.query.sales.findMany({
      where: (s, { eq, and }) => and(eq(s.shiftId, shift.id), eq(s.status, 'PAID')),
    });

    let systemCashCollected = 0;
    for (const sale of shiftSales) {
      if (sale.paymentMethod === 'CASH') {
        systemCashCollected += sale.total;
      }
    }

    const expectedEndBalance = shift.startBalance + systemCashCollected;

    return db
      .update(shifts)
      .set({
        status: 'CLOSED',
        endTime: new Date(),
        endBalance: expectedEndBalance,
        actualBalance: Number(actualBalance),
      })
      .where(eq(shifts.id, shift.id))
      .returning()
      .get();
  }

  static async getAllShifts(outletId: string, query: any) {
    return await db.query.shifts.findMany({
      where: (s, { eq }) => eq(s.outletId, outletId),
      orderBy: (s, { desc }) => [desc(s.startTime)],
      with: { cashier: true },
      limit: 50,
    });
  }
}
