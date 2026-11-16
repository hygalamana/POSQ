import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { MembersService } from "./members.service";

export class MembersController {
  static async getAll(req: AuthRequest, res: Response) {
    try {
      const outletId = req.user!.outletId;
      const members = await MembersService.getAllMembers(outletId);
      res.json({ success: true, data: members });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  }

  static async getById(req: AuthRequest, res: Response) {
    try {
      const outletId = req.user!.outletId;
      const { id } = req.params;
      const member = await MembersService.getMemberById(id as string, outletId);
      if (!member) {
        return res.status(404).json({ success: false, error: { message: "Member not found" } });
      }
      res.json({ success: true, data: member });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  }

  static async create(req: AuthRequest, res: Response) {
    try {
      const outletId = req.user!.outletId;
      const member = await MembersService.createMember(outletId, req.body);
      res.status(201).json({ success: true, data: member });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }

  static async update(req: AuthRequest, res: Response) {
    try {
      const outletId = req.user!.outletId;
      const { id } = req.params;
      const member = await MembersService.updateMember(id as string, outletId, req.body);
      res.json({ success: true, data: member });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }

  static async delete(req: AuthRequest, res: Response) {
    try {
      const outletId = req.user!.outletId;
      const { id } = req.params;
      await MembersService.deleteMember(id as string, outletId);
      res.json({ success: true, message: "Member deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }
}
