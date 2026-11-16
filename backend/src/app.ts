import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import authRoutes from './modules/auth/auth.routes';
import categoriesRoutes from './modules/categories/categories.routes';
import productsRoutes from './modules/products/products.routes';
import salesRoutes from './modules/sales/sales.routes';
import reportsRoutes from './modules/reports/reports.routes';
import cashflowRoutes from './modules/cashflow/cashflow.routes';
import systemRoutes from './modules/system/system.routes';
import usersRoutes from './modules/users/users.routes';
import membersRoutes from './modules/members/members.routes';
import outletsRoutes from './modules/outlets/outlets.routes';
import shiftsRoutes from './modules/shifts/shifts.routes';

dotenv.config();

const app: Express = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use('/api', limiter);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/cashflow', cashflowRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/members', membersRoutes);
app.use('/api/outlets', outletsRoutes);
app.use('/api/shifts', shiftsRoutes);

// Frontend static serving for production SPA
const possibleDistPaths = [
  path.resolve(process.cwd(), 'frontend/dist'),
  path.resolve(__dirname, '../../frontend/dist'),
  path.resolve(__dirname, '../frontend/dist'),
];
const frontendDist = possibleDistPaths.find(p => fs.existsSync(p)) || path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/health')) {
      return res.sendFile(path.join(frontendDist, 'index.html'));
    }
    next();
  });
}

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'Something went wrong!',
      details: err.details || null,
    },
  });
});

const isCompiled = __filename.includes('dist');
const PORT = process.env.PORT_OVERRIDE || (isCompiled ? (process.env.PROD_PORT || 9990) : (process.env.PORT || 9991));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} ${isCompiled ? '(Serving Frontend + Backend)' : '(Backend API only)'}`);
});

export default app;
