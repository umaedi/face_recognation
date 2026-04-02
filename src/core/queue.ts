import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// Koneksi Redis untuk BullMQ (Prioritas REDIS_URL)
const connection = process.env.REDIS_URL 
  ? new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null })
  : new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      maxRetriesPerRequest: null,
    });

// Definisi Antrean Face Recognition
export const faceQueue = new Queue('face-recognition-queue', { connection });

// Interface data yang dikirim ke antrean
export interface FaceJobData {
  userId: string;
  imageUrl?: string;
  imageBuffer?: Buffer | string; // Buffer atau Base64
  webhookUrl?: string;
  type: 'register' | 'verify';
}

/**
 * Menambahkan tugas registrasi wajah ke antrean
 */
export const addFaceJob = async (data: Omit<FaceJobData, 'type'>) => {
  return faceQueue.add('register-face', { ...data, type: 'register' }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: true,
  });
};

/**
 * Menambahkan tugas verifikasi wajah ke antrean (Async Path)
 */
export const addVerifyJob = async (data: Omit<FaceJobData, 'type'>) => {
  return faceQueue.add('verify-face', { ...data, type: 'verify' }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: true,
  });
};
