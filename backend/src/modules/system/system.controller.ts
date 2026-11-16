import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import path from 'path';
import fs from 'fs';
import { dbPath, sqlite } from '../../config/database';
import { errorResponse, successResponse } from '../../utils/response';

export class SystemController {
  static async backup(req: AuthRequest, res: Response) {
    try {
      if (req.user?.role !== 'OWNER' && req.user?.role !== 'MANAGER') {
        return res.status(403).json(errorResponse('FORBIDDEN', 'Hanya pemilik atau manajer yang bisa melakukan backup'));
      }

      if (!fs.existsSync(dbPath)) {
        return res.status(404).json(errorResponse('NOT_FOUND', 'Database file not found'));
      }

      // Flush WAL journal to main database file before backup
      try {
        sqlite.pragma('wal_checkpoint(TRUNCATE)');
      } catch (e) {}

      res.download(dbPath, `backup-posq-${new Date().toISOString().split('T')[0]}.db`);
    } catch (error: any) {
      return res.status(500).json(errorResponse('INTERNAL_ERROR', error.message));
    }
  }

  static async restore(req: AuthRequest, res: Response) {
    let uploadedPath: string | null = null;
    try {
      if (req.user?.role !== 'OWNER') {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(403).json(errorResponse('FORBIDDEN', 'Hanya pemilik yang bisa melakukan restore'));
      }

      const file = req.file;
      if (!file) {
        return res.status(400).json(errorResponse('BAD_REQUEST', 'No database file provided'));
      }
      uploadedPath = file.path;

      // Validate SQLite Header magic bytes ('SQLite format 3\0')
      const buffer = Buffer.alloc(16);
      const fd = fs.openSync(uploadedPath, 'r');
      fs.readSync(fd, buffer, 0, 16, 0);
      fs.closeSync(fd);

      const header = buffer.toString('utf8');
      if (!header.startsWith('SQLite format 3')) {
        fs.unlinkSync(uploadedPath);
        return res.status(400).json(errorResponse('BAD_REQUEST', 'File bukan database SQLite yang valid'));
      }

      // Flush WAL on current database
      try {
        sqlite.pragma('wal_checkpoint(TRUNCATE)');
      } catch (e) {}

      // Create backup of current database first
      if (fs.existsSync(dbPath)) {
        fs.copyFileSync(dbPath, `${dbPath}.bak`);
      }

      // Overwrite main database
      fs.copyFileSync(uploadedPath, dbPath);

      // Clean up WAL and SHM files to prevent corruption from mismatched logs
      const walPath = `${dbPath}-wal`;
      const shmPath = `${dbPath}-shm`;
      if (fs.existsSync(walPath)) {
        try { fs.unlinkSync(walPath); } catch (e) {}
      }
      if (fs.existsSync(shmPath)) {
        try { fs.unlinkSync(shmPath); } catch (e) {}
      }

      // Re-enable WAL mode on the restored database
      try {
        sqlite.pragma('journal_mode = WAL');
      } catch (e) {}

      fs.unlinkSync(uploadedPath);
      uploadedPath = null;

      return res.status(200).json(successResponse({ message: 'Database restored successfully' }));
    } catch (error: any) {
      if (uploadedPath && fs.existsSync(uploadedPath)) {
        try { fs.unlinkSync(uploadedPath); } catch (e) {}
      }
      return res.status(500).json(errorResponse('INTERNAL_ERROR', error.message));
    }
  }
}
