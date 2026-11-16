import { db, cashflows } from '../../config/database';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

export class CashflowService {
  static async getAll(outletId: string, query: any) {
    const { startDate, endDate, type } = query;

    return await db.query.cashflows.findMany({
      where: (c, { eq, and, gte, lte }) => {
        const conditions = [eq(c.outletId, outletId)];
        if (type) conditions.push(eq(c.type, type));
        if (startDate && endDate) {
          conditions.push(gte(c.date, new Date(startDate)));
          conditions.push(lte(c.date, new Date(endDate)));
        }
        return and(...conditions);
      },
      orderBy: (c, { desc }) => [desc(c.date)],
      with: {
        user: {
          columns: {
            name: true,
          },
        },
      },
    });
  }

  static async create(data: any, outletId: string, userId: string) {
    if (!data.type || !data.amount || !data.description) {
      throw { status: 400, message: 'Type, amount, and description are required' };
    }

    return db
      .insert(cashflows)
      .values({
        type: data.type,
        amount: Number(data.amount),
        description: data.description,
        date: data.date ? new Date(data.date) : new Date(),
        outletId,
        userId,
      })
      .returning()
      .get();
  }

  static async delete(id: string, outletId: string) {
    const record = await db.query.cashflows.findFirst({
      where: (c, { eq, and }) => and(eq(c.id, id), eq(c.outletId, outletId)),
    });
    if (!record) throw { status: 404, message: 'Cashflow record not found' };

    return db.delete(cashflows).where(eq(cashflows.id, id)).returning().get();
  }
}
