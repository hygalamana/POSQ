import { db, categories } from '../../config/database';
import { eq } from 'drizzle-orm';

export class CategoriesService {
  static async getAll(outletId: string, activeOnly: boolean = true) {
    return await db.query.categories.findMany({
      where: (c, { eq, and }) =>
        activeOnly ? and(eq(c.outletId, outletId), eq(c.isActive, true)) : eq(c.outletId, outletId),
      orderBy: (c, { asc }) => [asc(c.sortOrder)],
    });
  }

  static async getById(id: string, outletId: string) {
    const category = await db.query.categories.findFirst({
      where: (c, { eq, and }) => and(eq(c.id, id), eq(c.outletId, outletId)),
    });
    if (!category) throw { status: 404, message: 'Category not found' };
    return category;
  }

  static async create(data: any, outletId: string) {
    const inserted = db
      .insert(categories)
      .values({ ...data, outletId })
      .returning()
      .get();
    return inserted;
  }

  static async update(id: string, data: any, outletId: string) {
    await this.getById(id, outletId);
    const updated = db
      .update(categories)
      .set(data)
      .where(eq(categories.id, id))
      .returning()
      .get();
    return updated;
  }

  static async delete(id: string, outletId: string) {
    await this.getById(id, outletId);
    const updated = db
      .update(categories)
      .set({ isActive: false })
      .where(eq(categories.id, id))
      .returning()
      .get();
    return updated;
  }
}
