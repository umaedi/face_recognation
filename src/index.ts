import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import faceRoutes from './api/routes';
import 'dotenv/config';

const app = new Hono();

// --- Middleware ---
app.use('*', logger());
app.use('*', cors());

// --- Health Check ---
app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// --- API Routes ---
app.route('/api/face', faceRoutes);

// --- Server Lifecycle ---
const port = parseInt(process.env.PORT || '8888');

const server = serve({ fetch: app.fetch, port }, (info) => {
  console.log(`🚀 Face Recognition Service running on http://localhost:${info.port}`);
});

// Handle graceful shutdown
const handleShutdown = (signal: string) => {
    console.log(`\n${signal} received. Closing server...`);
    server.close(() => {
      console.log('Server closed.');
      process.exit(0);
    });
  
    setTimeout(() => {
      console.error('Forced shutdown');
      process.exit(1);
    }, 10000);
  };
  
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
