import {
  db,
  sales,
  saleItems,
  products,
  members,
  stockMovements,
  shifts,
  outlets,
} from '../../config/database';
import { generateInvoiceNumber } from '../../utils/invoice';
import { SaleStatus } from '../../utils/enums';
import { eq, and, gte, lte, inArray, like, desc } from 'drizzle-orm';

export class SalesService {
  static async createSale(data: any, cashierId: string, outletId: string) {
    const invoiceNumber = await generateInvoiceNumber();

    const saleId = db.transaction((tx) => {
      const outlet = tx.query.outlets.findFirst({
        where: (o, { eq }) => eq(o.id, outletId),
      }).sync();
      if (!outlet) throw { status: 404, message: 'Outlet not found' };

      const activeShift = tx.query.shifts.findFirst({
        where: (s, { eq, and }) => and(eq(s.outletId, outletId), eq(s.status, 'OPEN')),
        orderBy: (s, { desc }) => [desc(s.startTime)],
      }).sync();

      const uniqueProductIds = Array.from(new Set(data.items.map((item: any) => item.productId))) as string[];
      if (uniqueProductIds.length === 0) {
        throw { status: 400, message: 'Sale must contain at least one item' };
      }

      const productRecords = tx.query.products.findMany({
        where: (p, { inArray, eq, and }) =>
          and(inArray(p.id, uniqueProductIds), eq(p.outletId, outletId), eq(p.isActive, true)),
        with: { variants: true },
      }).sync();

      if (productRecords.length !== uniqueProductIds.length) {
        throw { status: 400, message: 'Some products are invalid or inactive' };
      }

      // Check total quantity per product against stock
      const productQtyMap = new Map<string, number>();
      for (const item of data.items) {
        productQtyMap.set(item.productId, (productQtyMap.get(item.productId) || 0) + item.quantity);
      }

      for (const prod of productRecords) {
        const totalRequested = productQtyMap.get(prod.id) || 0;
        if (prod.stock !== null && prod.stock < totalRequested) {
          throw { status: 400, message: `Stok untuk ${prod.name} tidak mencukupi (sisa: ${prod.stock})` };
        }
      }

      let subtotal = 0;
      const saleItemsToInsert: any[] = [];

      for (const item of data.items) {
        const prod = productRecords.find((p) => p.id === item.productId);
        if (!prod) continue;

        let unitPrice = prod.price;
        let unitHpp = prod.hpp || 0;
        if (item.variantName) {
          const variant = prod.variants.find((v: any) => v.name === item.variantName);
          if (variant) {
            unitPrice = variant.price;
            unitHpp = variant.hpp || 0;
          }
        }

        const itemSubtotal = unitPrice * item.quantity;
        subtotal += itemSubtotal;

        saleItemsToInsert.push({
          productId: prod.id,
          quantity: item.quantity,
          unitPrice: unitPrice,
          unitHpp: unitHpp,
          subtotal: itemSubtotal,
          notes: item.notes || null,
          variantName: item.variantName || null,
        });

        if (prod.stock !== null) {
          tx.update(products)
            .set({
              stock: prod.stock - item.quantity,
              updatedAt: new Date(),
            })
            .where(eq(products.id, prod.id))
            .run();
        }

        // Add StockMovement record
        tx.insert(stockMovements)
          .values({
            type: 'SALE',
            quantity: -item.quantity,
            notes: `Penjualan (Kasir: ${cashierId})`,
            productId: prod.id,
            userId: cashierId,
            outletId,
          })
          .run();
      }

      const additionalFee = Number(data.additionalFee || 0);
      const manualDiscount = Number(data.discountAmount) || 0;
      const discountedSubtotalPrePoints = Math.max(0, subtotal - manualDiscount);
      const taxAmount = outlet.hasTax ? Math.round(discountedSubtotalPrePoints * outlet.taxRate) : 0;
      const totalPrePoints = discountedSubtotalPrePoints + taxAmount + additionalFee;

      let pointsDiscount = 0;
      if (data.usePoints && data.memberId) {
        const member = tx.query.members.findFirst({
          where: (m, { eq }) => eq(m.id, data.memberId),
        }).sync();
        if (member && member.points > 0) {
          pointsDiscount = Math.min(member.points, totalPrePoints);
          tx.update(members)
            .set({
              points: member.points - pointsDiscount,
              updatedAt: new Date(),
            })
            .where(eq(members.id, member.id))
            .run();
        }
      }

      const total = Math.round(totalPrePoints - pointsDiscount);
      const discountAmount = manualDiscount + pointsDiscount;
      const changeAmount = Math.max(0, Math.round(data.amountPaid - total));

      if (data.paymentMethod === 'CASH' && data.amountPaid < total) {
        throw { status: 400, message: 'Nominal uang yang dibayarkan kurang dari total' };
      }

      let pointsEarned = 0;
      if (data.memberId && outlet.pointsEnabled && outlet.pointsRate > 0) {
        pointsEarned = Math.floor(total / outlet.pointsRate);
        if (pointsEarned > 0) {
          const currentMember = tx.query.members.findFirst({
            where: (m, { eq }) => eq(m.id, data.memberId),
          }).sync();
          if (currentMember) {
            tx.update(members)
              .set({
                points: currentMember.points + pointsEarned,
                updatedAt: new Date(),
              })
              .where(eq(members.id, data.memberId))
              .run();
          }
        }
      }

      const insertedSale = tx
        .insert(sales)
        .values({
          invoiceNumber,
          status: SaleStatus.PAID,
          paymentMethod: data.paymentMethod,
          subtotal,
          discountAmount,
          taxAmount,
          additionalFee: Number(data.additionalFee || 0),
          total,
          amountPaid: data.amountPaid,
          changeAmount,
          notes: data.notes || null,
          customerName: data.customerName || null,
          cashierId,
          outletId,
          memberId: data.memberId || null,
          pointsEarned,
          shiftId: activeShift ? activeShift.id : null,
        })
        .returning()
        .get();

      for (const sItem of saleItemsToInsert) {
        tx.insert(saleItems)
          .values({
            ...sItem,
            saleId: insertedSale.id,
          })
          .run();
      }

      return insertedSale.id;
    });

    return await db.query.sales.findFirst({
      where: (s, { eq }) => eq(s.id, saleId),
      with: {
        items: {
          with: { product: true },
        },
        cashier: true,
        member: true,
      },
    });
  }

  static async getAll(outletId: string, query: any) {
    const { startDate, endDate, status, method } = query;

    return await db.query.sales.findMany({
      where: (s, { eq, and, gte, lte }) => {
        const conditions = [eq(s.outletId, outletId)];
        if (status) conditions.push(eq(s.status, status));
        if (method) conditions.push(eq(s.paymentMethod, method));
        if (startDate && endDate) {
          conditions.push(gte(s.createdAt, new Date(startDate)));
          conditions.push(lte(s.createdAt, new Date(endDate)));
        }
        return and(...conditions);
      },
      orderBy: (s, { desc }) => [desc(s.createdAt)],
      with: {
        cashier: true,
        member: true,
      },
    });
  }

  static async getById(id: string, outletId: string) {
    const sale = await db.query.sales.findFirst({
      where: (s, { eq, and }) => and(eq(s.id, id), eq(s.outletId, outletId)),
      with: {
        items: {
          with: { product: true },
        },
        cashier: true,
        outlet: true,
        member: true,
      },
    });
    if (!sale) throw { status: 404, message: 'Sale not found' };
    return sale;
  }

  static async cancelSale(id: string, outletId: string) {
    return db.transaction((tx) => {
      const sale = tx.query.sales.findFirst({
        where: (s, { eq, and }) => and(eq(s.id, id), eq(s.outletId, outletId)),
        with: { items: true },
      }).sync();

      if (!sale) throw { status: 404, message: 'Sale not found' };
      if (sale.status === SaleStatus.CANCELLED) {
        throw { status: 400, message: 'Sale is already cancelled' };
      }

      for (const item of sale.items) {
        const prod = tx.query.products.findFirst({
          where: (p, { eq }) => eq(p.id, item.productId),
        }).sync();
        if (prod && prod.stock !== null) {
          tx.update(products)
            .set({
              stock: prod.stock + item.quantity,
              updatedAt: new Date(),
            })
            .where(eq(products.id, prod.id))
            .run();
        }
      }

      return tx
        .update(sales)
        .set({ status: SaleStatus.CANCELLED, updatedAt: new Date() })
        .where(eq(sales.id, id))
        .returning()
        .get();
    });
  }

  static async deleteSale(id: string, outletId: string) {
    return db.transaction((tx) => {
      const sale = tx.query.sales.findFirst({
        where: (s, { eq, and }) => and(eq(s.id, id), eq(s.outletId, outletId)),
        with: { items: true },
      }).sync();

      if (!sale) throw { status: 404, message: 'Transaksi tidak ditemukan' };

      // Restore stock if the sale was PAID
      if (sale.status === SaleStatus.PAID) {
        for (const item of sale.items) {
          const prod = tx.query.products.findFirst({
            where: (p, { eq }) => eq(p.id, item.productId),
          }).sync();
          if (prod && prod.stock !== null) {
            tx.update(products)
              .set({
                stock: prod.stock + item.quantity,
                updatedAt: new Date(),
              })
              .where(eq(products.id, prod.id))
              .run();
          }
        }

        if (sale.memberId && sale.pointsEarned && sale.pointsEarned > 0) {
          const member = tx.query.members.findFirst({
            where: (m, { eq }) => eq(m.id, sale.memberId!),
          }).sync();
          if (member) {
            tx.update(members)
              .set({
                points: Math.max(0, member.points - sale.pointsEarned),
                updatedAt: new Date(),
              })
              .where(eq(members.id, sale.memberId))
              .run();
          }
        }
      }

      // Delete items and sale
      tx.delete(saleItems).where(eq(saleItems.saleId, id)).run();
      tx.delete(sales).where(eq(sales.id, id)).run();

      return { success: true };
    });
  }

  static async syncOfflineSales(offlineSalesList: any[], cashierId: string, outletId: string) {
    const results: any[] = [];
    for (const offlineSale of offlineSalesList) {
      try {
        if (offlineSale.offlineTempId) {
          const existing = await db.query.sales.findFirst({
            where: (s, { eq, and, like }) =>
              and(eq(s.outletId, outletId), like(s.notes, `%${offlineSale.offlineTempId}%`)),
          });
          if (existing) {
            results.push({
              offlineTempId: offlineSale.offlineTempId,
              status: 'SKIPPED_EXISTING',
              saleId: existing.id,
            });
            continue;
          }
        }

        const saleData = {
          ...offlineSale,
          notes: offlineSale.notes
            ? `${offlineSale.notes} [Offline: ${offlineSale.offlineTempId || 'ID'}]`
            : `[Offline: ${offlineSale.offlineTempId || 'ID'}]`,
        };

        const created = await this.createSale(saleData, cashierId, outletId);

        if (offlineSale.offlineCreatedAt && created) {
          db.update(sales)
            .set({ createdAt: new Date(offlineSale.offlineCreatedAt) })
            .where(eq(sales.id, created.id))
            .run();
        }

        results.push({
          offlineTempId: offlineSale.offlineTempId,
          status: 'SYNCED',
          saleId: created?.id,
        });
      } catch (err: any) {
        results.push({
          offlineTempId: offlineSale.offlineTempId,
          status: 'ERROR',
          message: err.message || 'Gagal sinkronisasi transaksi',
        });
      }
    }
    return results;
  }
}
