import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { addFaceJob, addVerifyJob } from '../core/queue';
import { FaceService } from '../services/face.service';
import { LoadMonitor } from '../core/load-monitor';

const faceRoutes = new Hono();

/**
 * Endpoint: Registrasi Wajah Baru (Async via Worker)
 */
faceRoutes.post(
  '/register',
  zValidator(
    'json',
    z.object({
      userId: z.string().uuid(),
      imageUrl: z.string().url(),
    })
  ),
  async (c) => {
    const { userId, imageUrl } = c.req.valid('json');
    await addFaceJob({ userId, imageUrl });
    return c.json({ success: true, message: 'Face registration job queued', userId });
  }
);

/**
 * Endpoint: Verifikasi Wajah (Hybrid Sync/Async)
 * Alur Rigid:
 * - Jika server kosong: Proses Real-time (Sync)
 * - Jika server sibuk: Proses via Worker (Async) + Webhook
 */
faceRoutes.post('/verify', async (c) => {
  try {
    const body = await c.req.parseBody();
    const userId = body.userId as string;
    const file = body.file as File;
    const webhookUrl = body.webhookUrl as string;

    if (!userId || !file) {
      return c.json({ success: false, message: 'Missing userId or file' }, 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // LOGIKA HYBRID
    if (LoadMonitor.isBusy()) {
      console.log(`⚠️ Server Busy (${LoadMonitor.getCurrentLoad()} tasks). Offloading Face ID: ${userId} to worker...`);
      
      // Kirim ke Worker (Async)
      const job = await addVerifyJob({
        userId,
        imageBuffer: buffer.toString('base64'), // Mengirim Base64 agar lebih kompatibel dengan Redis
        webhookUrl
      });

      return c.json({
        success: true,
        status: 'queued',
        jobId: job.id,
        message: 'Server is busy. Process moved to worker. Result will be sent via webhook if provided.'
      }, 202); // 202 Accepted
    }

    // JALUR REAL-TIME (Sync)
    try {
      LoadMonitor.startTask();
      console.log(`⚡ Processing Real-time Verification for User: ${userId}...`);
      
      const result = await FaceService.performFullVerification(userId, buffer);
      
      return c.json({
        success: true,
        status: 'completed',
        ...result,
        message: result.isMatch ? 'Face Match!' : 'Face does not match profile'
      });
    } finally {
      LoadMonitor.endTask();
    }

  } catch (error: any) {
    console.error('Verify error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default faceRoutes;
