import express from 'express';
import { getDatabase, resetDatabase } from './db.js';
import authRoutes from './routes/authRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
import driveRoutes from './routes/driveRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

export async function createExpressApp() {
  // Ensure database initialized
  await getDatabase();

  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // CORS headers
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // REST API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/students', studentRoutes);
  app.use('/api/companies', companyRoutes);
  app.use('/api/drives', driveRoutes);
  app.use('/api/applications', applicationRoutes);
  app.use('/api/dashboard', dashboardRoutes);

  // Seed / Reset endpoint for practical demonstrations
  app.post('/api/system/reset-demo-data', async (req, res) => {
    try {
      resetDatabase();
      return res.status(200).json({ message: 'Database reset to clean sample college placement data successfully.' });
    } catch (err: any) {
      return res.status(500).json({ error: 'Reset Failed', message: err.message });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      system: 'College Placement Management System REST API',
      database: 'SQLite 3 (Persistent)',
      timestamp: new Date().toISOString()
    });
  });

  return app;
}
