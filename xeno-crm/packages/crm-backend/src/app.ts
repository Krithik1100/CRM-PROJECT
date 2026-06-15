import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

import customerRoutes from './modules/customers/customer.routes';
import segmentRoutes from './modules/segments/segment.routes';
import campaignRoutes from './modules/campaigns/campaign.routes';
import callbackRoutes from './modules/callbacks/callback.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import { errorHandler, notFoundHandler } from './shared/middleware/errorHandler';
import { logger } from './shared/utils/logger';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('combined', {
  stream: { write: (msg) => logger.info(msg.trim()) },
}));

// Health check
app.get('/', (_, res) => {
  res.json({
    service: 'KK CRM Backend',
    status: 'running',
    health: '/health',
    api: {
      customers: '/api/customers',
      segments: '/api/segments',
      campaigns: '/api/campaigns',
      analytics: '/api/analytics/overview',
      callbacks: '/api/callbacks/communication-event',
    },
  });
});

app.get('/health', (_, res) => {
  res.json({ status: 'ok', service: 'crm-backend', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/customers', customerRoutes);
app.use('/api/segments', segmentRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/callbacks', callbackRoutes);
app.use('/api/analytics', analyticsRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`🚀 CRM Backend running on port ${PORT}`);
});

export default app;
