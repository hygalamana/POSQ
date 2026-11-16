import { Router } from 'express';
import { SystemController } from './system.controller';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { Role } from '../../utils/enums';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Setup multer to upload to a temp directory
const uploadDir = path.join(process.cwd(), 'temp');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `restore-${Date.now()}.db`),
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // Max 50MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.db' || ext === '.sqlite' || ext === '.sqlite3' || file.mimetype === 'application/x-sqlite3') {
      cb(null, true);
    } else {
      cb(new Error('Format file tidak didukung. Harap unggah file database SQLite (.db)'));
    }
  },
});

const router = Router();

router.use(authenticate);

router.get('/backup', requireRole([Role.OWNER, Role.MANAGER]), SystemController.backup);
router.post('/restore', requireRole([Role.OWNER]), upload.single('database'), SystemController.restore);

export default router;
