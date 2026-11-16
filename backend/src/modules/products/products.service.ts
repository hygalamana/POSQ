import { db, products, productVariants, stockMovements } from '../../config/database';
import { eq, and, like, asc, desc } from 'drizzle-orm';

export class ProductsService {
  static async getAll(outletId: string, query: any) {
    const { categoryId, search, activeOnly } = query;

    return await db.query.products.findMany({
      where: (p, { eq, and, like }) => {
        const conditions = [eq(p.outletId, outletId)];
        if (activeOnly !== 'false') {
          conditions.push(eq(p.isActive, true));
        }
        if (categoryId) {
          conditions.push(eq(p.categoryId, String(categoryId)));
        }
        if (search) {
          conditions.push(like(p.name, `%${search}%`));
        }
        return and(...conditions);
      },
      with: {
        category: true,
        variants: true,
      },
      orderBy: (p, { asc }) => [asc(p.sortOrder)],
    });
  }

  static async getById(id: string, outletId: string) {
    const product = await db.query.products.findFirst({
      where: (p, { eq, and }) => and(eq(p.id, id), eq(p.outletId, outletId)),
      with: {
        category: true,
        variants: true,
      },
    });
    if (!product) throw { status: 404, message: 'Product not found' };
    return product;
  }

  static async create(data: any, outletId: string) {
    const { variants, ...rest } = data;

    return db.transaction((tx) => {
      const insertedProduct = tx
        .insert(products)
        .values({
          ...rest,
          outletId,
          price: Number(rest.price),
          hpp: Number(rest.hpp || 0),
          stock: rest.stock !== undefined && rest.stock !== null ? Number(rest.stock) : null,
          sortOrder: Number(rest.sortOrder || 0),
        })
        .returning()
        .get();

      if (variants && variants.length > 0) {
        for (const v of variants) {
          tx.insert(productVariants)
            .values({
              name: v.name,
              price: Number(v.price),
              hpp: Number(v.hpp || 0),
              productId: insertedProduct.id,
            })
            .run();
        }
      }

      return tx.query.products.findFirst({
        where: (p, { eq }) => eq(p.id, insertedProduct.id),
        with: { category: true, variants: true },
      }).sync();
    });
  }

  static async update(id: string, data: any, outletId: string) {
    await this.getById(id, outletId);
    const { variants, ...rest } = data;

    return db.transaction((tx) => {
      if (variants !== undefined) {
        tx.delete(productVariants).where(eq(productVariants.productId, id)).run();
        if (Array.isArray(variants) && variants.length > 0) {
          for (const v of variants) {
            tx.insert(productVariants)
              .values({
                name: v.name,
                price: Number(v.price),
                hpp: Number(v.hpp || 0),
                productId: id,
              })
              .run();
          }
        }
      }

      const updateData: any = {
        ...rest,
        updatedAt: new Date(),
      };
      if (rest.price !== undefined) updateData.price = Number(rest.price);
      if (rest.hpp !== undefined) updateData.hpp = Number(rest.hpp);
      if (rest.stock !== undefined) {
        updateData.stock = rest.stock === null ? null : Number(rest.stock);
      }
      if (rest.sortOrder !== undefined) updateData.sortOrder = Number(rest.sortOrder);

      tx.update(products).set(updateData).where(eq(products.id, id)).run();

      return tx.query.products.findFirst({
        where: (p, { eq }) => eq(p.id, id),
        with: { category: true, variants: true },
      }).sync();
    });
  }

  static async delete(id: string, outletId: string) {
    await this.getById(id, outletId);
    return db
      .update(products)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning()
      .get();
  }

  static async uploadImage(id: string, imageUrl: string, outletId: string) {
    await this.getById(id, outletId);
    return db
      .update(products)
      .set({ imageUrl, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning()
      .get();
  }

  static async getStockMovements(productId: string, outletId: string) {
    await this.getById(productId, outletId);
    return await db.query.stockMovements.findMany({
      where: (sm, { eq, and }) => and(eq(sm.productId, productId), eq(sm.outletId, outletId)),
      orderBy: (sm, { desc }) => [desc(sm.createdAt)],
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });
  }

  static async addStockMovement(productId: string, outletId: string, userId: string, data: any) {
    const product = await this.getById(productId, outletId);
    const { type, quantity, notes } = data;
    const qty = Number(quantity) || 0;

    return db.transaction((tx) => {
      const movement = tx
        .insert(stockMovements)
        .values({
          type,
          quantity: qty,
          notes,
          productId,
          userId,
          outletId,
        })
        .returning()
        .get();

      if (product.stock !== null) {
        tx.update(products)
          .set({
            stock: product.stock + qty,
            updatedAt: new Date(),
          })
          .where(eq(products.id, productId))
          .run();
      }

      return movement;
    });
  }
}
