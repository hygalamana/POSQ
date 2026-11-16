import { db, users } from '../../config/database';
import { eq, and, desc } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export class UsersService {
  static async getUsers(outletId: string) {
    return await db.query.users.findMany({
      where: (u, { eq }) => eq(u.outletId, outletId),
      columns: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: (u, { desc }) => [desc(u.createdAt)],
    });
  }

  static async createUser(outletId: string, data: any) {
    const existing = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.email, data.email),
    });
    if (existing) {
      throw { status: 400, message: 'Email sudah terdaftar' };
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = db
      .insert(users)
      .values({
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role,
        outletId,
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })
      .get();

    return user;
  }

  static async updateUser(outletId: string, userId: string, data: any) {
    const existing = await db.query.users.findFirst({
      where: (u, { eq, and }) => and(eq(u.id, userId), eq(u.outletId, outletId)),
    });
    if (!existing) {
      throw { status: 404, message: 'Pengguna tidak ditemukan' };
    }

    if (data.email && data.email !== existing.email) {
      const emailExists = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.email, data.email),
      });
      if (emailExists) {
        throw { status: 400, message: 'Email sudah terdaftar pada akun lain' };
      }
    }

    const updateData: any = {
      name: data.name,
      email: data.email,
      role: data.role,
      isActive: data.isActive,
      updatedAt: new Date(),
    };

    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }

    const user = db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })
      .get();

    return user;
  }

  static async deleteUser(outletId: string, userId: string) {
    const existing = await db.query.users.findFirst({
      where: (u, { eq, and }) => and(eq(u.id, userId), eq(u.outletId, outletId)),
    });
    if (!existing) {
      throw { status: 404, message: 'Pengguna tidak ditemukan' };
    }

    if (existing.role === 'OWNER') {
      throw { status: 403, message: 'Akun Pemilik (OWNER) tidak dapat dihapus' };
    }

    db.delete(users).where(eq(users.id, userId)).run();

    return { success: true };
  }
}
