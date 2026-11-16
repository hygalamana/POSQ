import { z } from 'zod';
import { PaymentMethod } from '../../utils/enums';

export const createSaleSchema = z.object({
  body: z.object({
    paymentMethod: z.nativeEnum(PaymentMethod),
    notes: z.string().optional().nullable(),
    customerName: z.string().optional().nullable(),
    memberId: z.string().optional().nullable(),
    amountPaid: z.number().min(0),
    discountAmount: z.number().min(0).optional(),
    additionalFee: z.number().min(0).optional(),
    usePoints: z.boolean().optional(),
    items: z
      .array(
        z.object({
          productId: z.string().min(1, 'Product ID is required'),
          quantity: z.number().int().min(1, 'Quantity minimal 1'),
          variantName: z.string().optional().nullable(),
          notes: z.string().optional().nullable(),
        })
      )
      .min(1, 'Sale must contain at least one item'),
  }),
});
