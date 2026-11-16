import { z } from "zod";

export const createMemberSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Nama wajib diisi"),
    phone: z.string().optional(),
    email: z.string().email("Format email tidak valid").optional().or(z.literal('')),
  })
});

export const updateMemberSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Nama wajib diisi").optional(),
    phone: z.string().optional(),
    email: z.string().email("Format email tidak valid").optional().or(z.literal('')),
    points: z.number().int().min(0).optional(),
  })
});
