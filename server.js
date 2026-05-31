import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import 'express-async-errors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { initCloudinary } from './config/cloudinary.js';
import errorHandler from './middleware/errorMiddleware.js';
import seedAdmin from './scripts/seedAdmin.js';

import authRoutes from './routes/authRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import inquiryRoutes from './routes/inquiryRoutes.js';
import adminInquiryRoutes from './routes/adminInquiryRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('CORS blocked for this origin'));
  },
  credentials: true,
}));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(mongoSanitize());

app.use('/uploads', express.static('uploads', { maxAge: '7d', index: false, redirect: false }));

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '5A Events API is running',
    data: {
      version: '2.0.0',
      endpoints: {
        auth: '/api/auth',
        events: '/api/events',
        feedback: '/api/feedback',
        inquiries: '/api/inquiries',
      },
    },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/admin/inquiries', adminInquiryRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

app.use(errorHandler);

const startServer = async () => {
  await connectDB();
  initCloudinary();
  await seedAdmin();

  if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Frontend URL: ${allowedOrigins.join(', ')}`);
    });

    server.on('error', (err) => {
      if (err && err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Stop that process or set a different PORT in .env.`);
        console.error('Helpful commands (Windows):');
        console.error(`  netstat -aon | findstr :${PORT}`);
        console.error('  tasklist /FI "PID eq <pid>"');
        console.error('  taskkill /PID <pid> /F');
        process.exit(1);
      }

      console.error('Server error:', err);
      process.exit(1);
    });
  }
};

startServer().catch((error) => {
  console.error('Failed to start server:', error.message);
  process.exit(1);
});

export default app;
