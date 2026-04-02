import { Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import dotenv from 'dotenv';
import { FaceService } from './services/face.service';
import { db } from './db/index';
import { faceEmbeddings } from './db/schema';
import { FaceJobData } from './core/queue';

dotenv.config();

// Koneksi Redis untuk BullMQ (Prioritas REDIS_URL)
const connection = process.env.REDIS_URL 
  ? new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null })
  : new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      maxRetriesPerRequest: null,
    });

const worker = new Worker(
  'face-recognition-queue',
  async (job: Job<FaceJobData>) => {
    const { userId, imageUrl, imageBuffer, webhookUrl, type } = job.data;

    try {
      if (type === 'register') {
        console.log(`👷 Processing Registration for User: ${userId}`);
        const embedding = await FaceService.extractFaceEmbedding(imageUrl!);
        await db.insert(faceEmbeddings).values({
          userId,
          embedding,
          imageUrl,
        });
        console.log(`✅ Registration Success for User: ${userId}`);
        return { success: true, userId };
      } 
      
      else if (type === 'verify') {
        console.log(`👷 Processing Verification for User: ${userId} (Async)`);
        
        // Pilih sumber gambar (Buffer/Base64 atau URL)
        let source: string | Buffer | undefined = imageBuffer || imageUrl;
        
        if (typeof imageBuffer === 'string') {
          source = Buffer.from(imageBuffer, 'base64');
        }

        if (!source) throw new Error('No image source provided for verification');

        const result = await FaceService.performFullVerification(userId, source as any);
        
        console.log(`✅ Verification Completed for User: ${userId}. Match: ${result.isMatch}`);

        // Kirim hasil ke Webhook jika tersedia (Prioritas: job data > .env)
        const targetWebhook = webhookUrl || process.env.WEBHOOK_URL;
        
        if (targetWebhook) {
          console.log(`📡 Sending result to Webhook: ${targetWebhook}`);
          try {
            await fetch(targetWebhook, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jobId: job.id,
                ...result,
                timestamp: new Date().toISOString()
              })
            });
          } catch (webhookErr: any) {
            console.error(`❌ Webhook Failed to ${targetWebhook}: ${webhookErr.message}`);
          }
        }

        return result;
      }
    } catch (error: any) {
      console.error(`❌ Worker Failed for User ${userId}: ${error.message}`);
      throw error;
    }
  },
  { 
    connection,
    concurrency: 10 // Optimal untuk 64 Core CPU
  }
);

console.log('🚀 Face Recognition Worker is Running (Hybrid Mode)...');
