import redis from '../config/redis';
import { format } from 'date-fns';
import { db } from '../config/database';

export async function generateInvoiceNumber(): Promise<string> {
  const today = format(new Date(), 'yyyyMMdd');
  const key = `invoice:counter:${today}`;

  // Synchronize mock redis with database on first run
  const currentSeq = await redis.get(key);
  if (!currentSeq) {
    const latestSale = await db.query.sales.findFirst({
      where: (s, { like }) => like(s.invoiceNumber, `INV-${today}-%`),
      orderBy: (s, { desc }) => [desc(s.invoiceNumber)],
    });

    if (latestSale) {
      const parts = latestSale.invoiceNumber.split('-');
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) {
        await redis.set(key, String(lastSeq));
      }
    }
  }

  const seq = await redis.incr(key);
  await redis.expire(key, 86400 * 2); // TTL 2 hari
  return `INV-${today}-${String(seq).padStart(4, '0')}`;
}
