import 'dotenv/config';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import faceRoutes from './api/routes';
import { FaceService } from './services/face.service';

console.log('🔄 Initializing Face Recognition Service...');

const app = new Hono();

// --- Middleware ---
app.use('*', logger());
app.use('*', cors());

// --- Health Check ---
app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// --- API Routes ---
app.route('/api/face', faceRoutes);

/**
 * STARTUP SEQUENCE
 */
async function startServer() {
  try {
    console.log('📦 Loading AI Models...');
    await FaceService.loadModels();

    const port = parseInt(process.env.PORT || '8888');
    
    console.log(`🌐 Attempting to start server on port ${port}...`);
    
    const server = serve({ fetch: app.fetch, port, hostname: '0.0.0.0' }, (info) => {
      console.log(`🚀 Face Recognition Service IS ONLINE at http://0.0.0.0:${info.port}`);
    });

    // Handle graceful shutdown
    const handleShutdown = (signal: string) => {
      console.log(`\n${signal} received. Closing server...`);
      server.close(() => {
        console.log('Server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));

  } catch (error: any) {
    console.error('❌ FATAL ERROR DURING STARTUP:', error);
    process.exit(1);
  }
}

// Jalankan Inisialisasi
startServer();
