import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string({
      message: 'Refresh token is required',
    }),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    avatar: z.string().optional().nullable(),
  }),
});

export const updateOutletSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Outlet name must be at least 2 characters'),
    address: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    taxRate: z.number().optional(),
    hasTax: z.boolean().optional(),
    receiptPrintTax: z.boolean().optional(),
    qrisPayload: z.string().optional().nullable(),
  }),
});
