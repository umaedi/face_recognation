import '@tensorflow/tfjs';
import * as faceapi from '@vladmandic/face-api';
import { Canvas, Image, ImageData, loadImage } from 'canvas';
import path from 'path';
import { db } from '../db/index';
import { faceEmbeddings, verificationLogs } from '../db/schema';
import { eq } from 'drizzle-orm';
import util from 'node:util';

// Polyfill untuk Node.js v25+ karena util.isNullOrUndefined sudah dihapus
if (!(util as any).isNullOrUndefined) {
  (util as any).isNullOrUndefined = (value: any) => value === null || value === undefined;
}

// Konfigurasi Canvas untuk lingkungan Node.js agar Face-API dapat berjalan
// @ts-ignore
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

export class FaceService {
  private static isModelLoaded = false;

  /**
   * Memuat model AI dari folder lokal (SSD MobileNet V1, Face Landmark, Face Recognition)
   */
  static async loadModels() {
    if (this.isModelLoaded) return;
    const modelPath = path.join(process.cwd(), 'models');
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);
    this.isModelLoaded = true;
    console.log('✅ Face Recognition Models Loaded Successfully');
  }

  /**
   * Mengekstrak Vektor (Embedding) dari sebuah gambar
   * @param imageSource Path, URL, atau Buffer data gambar langsung
   */
  static async extractFaceEmbedding(imageSource: string | Buffer) {
    await this.loadModels();
    const img = await loadImage(imageSource) as any;
    const detection = await faceapi
      .detectSingleFace(img)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      throw new Error('No face detected in the image');
    }
    return Array.from(detection.descriptor);
  }

  /**
   * Logika perbandingan kemiripan wajah (untuk Verifikasi)
   */
  static async compareEmbeddings(embedding1: number[], embedding2: number[]) {
    return faceapi.euclideanDistance(embedding1, embedding2);
  }

  /**
   * Proses Verifikasi Lengkap (Hybrid Support)
   * Menggabungkan extraksi, DB lookup, comparison, dan logging.
   */
  static async performFullVerification(userId: string, imageSource: string | Buffer) {
    // 1. Ambil data embedding terdaftar
    const registeredFaces = await db
      .select()
      .from(faceEmbeddings)
      .where(eq(faceEmbeddings.userId, userId))
      .limit(1);

    if (registeredFaces.length === 0) {
      throw new Error('User face not registered');
    }

    const registeredFace = registeredFaces[0];

    // 2. Ekstrak embedding dari gambar baru
    const currentEmbedding = await this.extractFaceEmbedding(imageSource);

    // 3. Bandingkan
    const distance = await this.compareEmbeddings(
      registeredFace.embedding as number[],
      currentEmbedding
    );

    const isMatch = distance < 0.5; // Threshold yang diminta user terakhir

    // 4. Simpan Log
    await db.insert(verificationLogs).values({
      userId,
      matchScore: distance,
      isMatch,
      metadata: `Verified. Distance: ${distance.toFixed(4)}`,
    });

    return { isMatch, matchScore: distance, userId };
  }
}
