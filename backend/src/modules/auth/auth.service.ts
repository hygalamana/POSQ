import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db, users, outlets } from '../../config/database';
import { eq } from 'drizzle-orm';
import redis from '../../config/redis';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access-secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret';

export class AuthService {
  static async login(email: string, password: string) {
    const user = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.email, email),
      with: { outlet: true },
    });

    if (!user) {
      throw { status: 401, message: 'Email tidak terdaftar' };
    }

    if (!user.isActive) {
      throw { status: 401, message: 'Akun Anda sedang dinonaktifkan' };
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw { status: 401, message: 'Password salah' };
    }

    const payload = { userId: user.id, role: user.role, outletId: user.outletId };
    
    const accessToken = jwt.sign(payload, ACCESS_SECRET, { expiresIn: (process.env.JWT_ACCESS_EXPIRES || '15m') as any });
    const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: (process.env.JWT_REFRESH_EXPIRES || '7d') as any });

    // Store hash of refresh token in Redis
    const tokenHash = await bcrypt.hash(refreshToken, 10);
    await redis.set(`refresh:${user.id}`, tokenHash, 'EX', 7 * 24 * 60 * 60);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        outlet: user.outlet,
      },
      accessToken,
      refreshToken,
    };
  }

  static async refresh(token: string) {
    try {
      const decoded = jwt.verify(token, REFRESH_SECRET) as any;
      
      const storedHash = await redis.get(`refresh:${decoded.userId}`);
      if (!storedHash) {
        throw new Error('Token revoked');
      }

      const isValid = await bcrypt.compare(token, storedHash);
      if (!isValid) {
        throw new Error('Invalid token');
      }

      const payload = { userId: decoded.userId, role: decoded.role, outletId: decoded.outletId };
      const newAccessToken = jwt.sign(payload, ACCESS_SECRET, { expiresIn: (process.env.JWT_ACCESS_EXPIRES || '15m') as any });
      const newRefreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: (process.env.JWT_REFRESH_EXPIRES || '7d') as any });

      const tokenHash = await bcrypt.hash(newRefreshToken, 10);
      await redis.set(`refresh:${decoded.userId}`, tokenHash, 'EX', 7 * 24 * 60 * 60);

      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (error) {
      throw { status: 401, message: 'Invalid or expired refresh token' };
    }
  }

  static async logout(userId: string) {
    await redis.del(`refresh:${userId}`);
    return true;
  }

  static async getMe(userId: string) {
    const user = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, userId),
      with: { outlet: true },
    });
    
    if (!user) throw { status: 404, message: 'User not found' };
    
    const { passwordHash, ...userData } = user;
    return userData;
  }

  static async updateProfile(userId: string, data: { name: string; avatar?: string | null }) {
    db.update(users)
      .set({
        name: data.name,
        avatar: data.avatar,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .run();

    const user = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, userId),
      with: { outlet: true },
    });

    if (!user) throw { status: 404, message: 'User not found' };

    const { passwordHash, ...userData } = user;
    return userData;
  }

  static async updateOutlet(outletId: string, data: { name: string; address?: string | null; phone?: string | null; taxRate?: number; hasTax?: boolean; receiptPrintTax?: boolean; qrisPayload?: string | null }) {
    const updateData: any = {
      name: data.name,
      address: data.address,
      phone: data.phone,
    };
    if (data.taxRate !== undefined) updateData.taxRate = data.taxRate;
    if (data.hasTax !== undefined) updateData.hasTax = data.hasTax;
    if (data.receiptPrintTax !== undefined) updateData.receiptPrintTax = data.receiptPrintTax;
    if (data.qrisPayload !== undefined) updateData.qrisPayload = data.qrisPayload;

    db.update(outlets)
      .set(updateData)
      .where(eq(outlets.id, outletId))
      .run();

    const outlet = await db.query.outlets.findFirst({
      where: (o, { eq }) => eq(o.id, outletId),
    });
    return outlet;
  }
}
