import { db, members } from '../../config/database';
import { eq, and, desc } from 'drizzle-orm';

export class MembersService {
  static async getAllMembers(outletId: string) {
    return await db.query.members.findMany({
      where: (m, { eq }) => eq(m.outletId, outletId),
      orderBy: (m, { desc }) => [desc(m.createdAt)],
    });
  }

  static async getMemberById(id: string, outletId: string) {
    return await db.query.members.findFirst({
      where: (m, { eq, and }) => and(eq(m.id, id), eq(m.outletId, outletId)),
    });
  }

  static async createMember(outletId: string, data: any) {
    return db
      .insert(members)
      .values({
        ...data,
        outletId,
        points: Number(data.points || 0),
      })
      .returning()
      .get();
  }

  static async updateMember(id: string, outletId: string, data: any) {
    const member = await this.getMemberById(id, outletId);
    if (!member) throw new Error('Member not found');

    const updateData: any = {
      ...data,
      updatedAt: new Date(),
    };
    if (data.points !== undefined) updateData.points = Number(data.points);

    return db
      .update(members)
      .set(updateData)
      .where(eq(members.id, id))
      .returning()
      .get();
  }

  static async deleteMember(id: string, outletId: string) {
    const member = await this.getMemberById(id, outletId);
    if (!member) throw new Error('Member not found');

    return db.delete(members).where(eq(members.id, id)).returning().get();
  }
}
