import { z } from 'zod';

const variantSchema = z.object({
  name: z.string().min(1, 'Nama varian wajib diisi'),
  price: z.union([z.number(), z.string()]).transform((val) => Number(val)),
  hpp: z.union([z.number(), z.string()]).optional().transform((val) => (val !== undefined ? Number(val) : 0)),
});

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional().nullable(),
    price: z.number().min(0),
    hpp: z.number().min(0).optional(),
    emoji: z.string().optional(),
    sku: z.string().optional().nullable(),
    stock: z.number().int().optional().nullable(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
    categoryId: z.string(),
    variants: z.array(variantSchema).optional(),
  }),
});

export const updateProductSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional().nullable(),
    price: z.number().min(0).optional(),
    hpp: z.number().min(0).optional(),
    emoji: z.string().optional(),
    sku: z.string().optional().nullable(),
    stock: z.number().int().optional().nullable(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
    categoryId: z.string().optional(),
    variants: z.array(variantSchema).optional(),
  }),
});
