import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { db, sales, saleItems, products, cashflows } from '../../config/database';
import { sql, eq, and, gte, lte, desc } from 'drizzle-orm';
import { format } from 'date-fns';
import { successResponse, errorResponse } from '../../utils/response';

export class ReportsController {
  static async getSummary(req: AuthRequest, res: Response) {
    try {
      const outletId = req.user!.outletId;
      const { startDate, endDate } = req.query;

      // Default to today if no date provided
      let start = new Date();
      start.setHours(0, 0, 0, 0);
      let end = new Date();
      end.setHours(23, 59, 59, 999);

      if (startDate && endDate) {
        start = new Date(String(startDate));
        end = new Date(String(endDate));
      }

      // Sales Aggregation
      const salesAgg = db
        .select({
          total: sql<number>`COALESCE(SUM(${sales.total}), 0)`,
          count: sql<number>`COUNT(${sales.id})`,
        })
        .from(sales)
        .where(
          and(
            eq(sales.outletId, outletId),
            eq(sales.status, 'PAID'),
            gte(sales.createdAt, start),
            lte(sales.createdAt, end)
          )
        )
        .get();

      // Expenses Aggregation
      const expensesAgg = db
        .select({
          total: sql<number>`COALESCE(SUM(${cashflows.amount}), 0)`,
        })
        .from(cashflows)
        .where(
          and(
            eq(cashflows.outletId, outletId),
            eq(cashflows.type, 'EXPENSE'),
            gte(cashflows.date, start),
            lte(cashflows.date, end)
          )
        )
        .get();

      // Best selling products (Top 5)
      const topProductsRaw = db
        .select({
          productId: saleItems.productId,
          quantity: sql<number>`COALESCE(SUM(${saleItems.quantity}), 0)`,
          subtotal: sql<number>`COALESCE(SUM(${saleItems.subtotal}), 0)`,
        })
        .from(saleItems)
        .innerJoin(sales, eq(saleItems.saleId, sales.id))
        .where(
          and(
            eq(sales.outletId, outletId),
            eq(sales.status, 'PAID'),
            gte(sales.createdAt, start),
            lte(sales.createdAt, end)
          )
        )
        .groupBy(saleItems.productId)
        .orderBy(desc(sql`SUM(${saleItems.quantity})`))
        .limit(5)
        .all();

      const topProducts = await Promise.all(
        topProductsRaw.map(async (p) => {
          const prod = await db.query.products.findFirst({
            where: (pr, { eq }) => eq(pr.id, p.productId),
          });
          return {
            name: prod?.name || 'Unknown',
            emoji: prod?.emoji,
            quantity: p.quantity,
            revenue: p.subtotal,
          };
        })
      );

      // Chart data (Group by day)
      const recentSales = await db.query.sales.findMany({
        where: (s, { eq, and, gte, lte }) =>
          and(
            eq(s.outletId, outletId),
            eq(s.status, 'PAID'),
            gte(s.createdAt, start),
            lte(s.createdAt, end)
          ),
        columns: {
          createdAt: true,
          total: true,
        },
        orderBy: (s, { asc }) => [asc(s.createdAt)],
      });

      const chartDataMap: Record<string, number> = {};
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 31) {
        for (let i = 0; i < diffDays; i++) {
          const d = new Date(start);
          d.setDate(d.getDate() + i);
          chartDataMap[format(d, 'yyyy-MM-dd')] = 0;
        }
      }

      recentSales.forEach((sale) => {
        const dateStr = format(new Date(sale.createdAt), 'yyyy-MM-dd');
        if (chartDataMap[dateStr] === undefined) {
          chartDataMap[dateStr] = 0;
        }
        chartDataMap[dateStr] += sale.total;
      });

      const chartData = Object.keys(chartDataMap)
        .sort()
        .map((date) => ({
          date,
          revenue: chartDataMap[date],
        }));

      // Calculate COGS
      const saleItemsList = db
        .select({
          quantity: saleItems.quantity,
          unitHpp: saleItems.unitHpp,
        })
        .from(saleItems)
        .innerJoin(sales, eq(saleItems.saleId, sales.id))
        .where(
          and(
            eq(sales.outletId, outletId),
            eq(sales.status, 'PAID'),
            gte(sales.createdAt, start),
            lte(sales.createdAt, end)
          )
        )
        .all();

      let totalCogs = 0;
      let itemsSold = 0;
      saleItemsList.forEach((item) => {
        totalCogs += item.quantity * (item.unitHpp || 0);
        itemsSold += item.quantity;
      });

      // Calculate Previous Period Data
      const prevEnd = new Date(start.getTime() - 1);
      const prevStart = new Date(start.getTime() - diffTime - 1);

      const prevSalesAgg = db
        .select({
          total: sql<number>`COALESCE(SUM(${sales.total}), 0)`,
          count: sql<number>`COUNT(${sales.id})`,
        })
        .from(sales)
        .where(
          and(
            eq(sales.outletId, outletId),
            eq(sales.status, 'PAID'),
            gte(sales.createdAt, prevStart),
            lte(sales.createdAt, prevEnd)
          )
        )
        .get();

      const prevExpensesAgg = db
        .select({
          total: sql<number>`COALESCE(SUM(${cashflows.amount}), 0)`,
        })
        .from(cashflows)
        .where(
          and(
            eq(cashflows.outletId, outletId),
            eq(cashflows.type, 'EXPENSE'),
            gte(cashflows.date, prevStart),
            lte(cashflows.date, prevEnd)
          )
        )
        .get();

      const prevSaleItemsList = db
        .select({
          quantity: saleItems.quantity,
          unitHpp: saleItems.unitHpp,
        })
        .from(saleItems)
        .innerJoin(sales, eq(saleItems.saleId, sales.id))
        .where(
          and(
            eq(sales.outletId, outletId),
            eq(sales.status, 'PAID'),
            gte(sales.createdAt, prevStart),
            lte(sales.createdAt, prevEnd)
          )
        )
        .all();

      let prevTotalCogs = 0;
      let prevItemsSold = 0;
      prevSaleItemsList.forEach((item) => {
        prevTotalCogs += item.quantity * (item.unitHpp || 0);
        prevItemsSold += item.quantity;
      });

      const prevRevenue = prevSalesAgg?.total || 0;
      const prevExpense = prevExpensesAgg?.total || 0;
      const prevNetRevenue = prevRevenue - prevTotalCogs - prevExpense;
      const prevTransactions = prevSalesAgg?.count || 0;

      // Calculate Busiest Hours
      const hourlySales = new Array(24).fill(0);
      recentSales.forEach((sale) => {
        const hour = new Date(sale.createdAt).getHours();
        hourlySales[hour]++;
      });

      const busiestHours = hourlySales
        .map((count, hour) => ({
          hour: `${hour.toString().padStart(2, '0')}:00 - ${(hour + 1).toString().padStart(2, '0')}:00`,
          count,
        }))
        .filter((h) => h.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate Payment Methods
      const paymentMethodsRaw = db
        .select({
          method: sales.paymentMethod,
          revenue: sql<number>`COALESCE(SUM(${sales.total}), 0)`,
          transactions: sql<number>`COUNT(${sales.id})`,
        })
        .from(sales)
        .where(
          and(
            eq(sales.outletId, outletId),
            eq(sales.status, 'PAID'),
            gte(sales.createdAt, start),
            lte(sales.createdAt, end)
          )
        )
        .groupBy(sales.paymentMethod)
        .all();

      const paymentMethods = paymentMethodsRaw.sort((a, b) => b.transactions - a.transactions);

      // All-time balance (without filter)
      const allTimeSalesAgg = db
        .select({ total: sql<number>`COALESCE(SUM(${sales.total}), 0)` })
        .from(sales)
        .where(and(eq(sales.outletId, outletId), eq(sales.status, 'PAID')))
        .get();

      const allTimeIncomeAgg = db
        .select({ total: sql<number>`COALESCE(SUM(${cashflows.amount}), 0)` })
        .from(cashflows)
        .where(and(eq(cashflows.outletId, outletId), eq(cashflows.type, 'INCOME')))
        .get();

      const allTimeExpenseAgg = db
        .select({ total: sql<number>`COALESCE(SUM(${cashflows.amount}), 0)` })
        .from(cashflows)
        .where(and(eq(cashflows.outletId, outletId), eq(cashflows.type, 'EXPENSE')))
        .get();

      const totalAllTimeIncome = (allTimeSalesAgg?.total || 0) + (allTimeIncomeAgg?.total || 0);
      const totalAllTimeExpense = allTimeExpenseAgg?.total || 0;
      const allTimeBalance = totalAllTimeIncome - totalAllTimeExpense;

      const revenue = salesAgg?.total || 0;
      const expense = expensesAgg?.total || 0;
      const netRevenue = revenue - totalCogs - expense;
      const transactions = salesAgg?.count || 0;

      return res.status(200).json(
        successResponse({
          summary: {
            allTimeBalance,
            allTimeIncome: totalAllTimeIncome,
            allTimeExpense: totalAllTimeExpense,
            revenue,
            expense,
            netRevenue,
            transactions,
            itemsSold,
            prevRevenue,
            prevExpense,
            prevNetRevenue,
            prevTransactions,
            prevItemsSold,
          },
          topProducts,
          chartData,
          busiestHours,
          paymentMethods,
        })
      );
    } catch (error: any) {
      return res.status(500).json(errorResponse('INTERNAL_ERROR', error.message));
    }
  }
}
