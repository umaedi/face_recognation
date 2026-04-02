import { pgTable, uuid, varchar, timestamp, vector, text, boolean, real } from 'drizzle-orm/pg-core';

// Tabel untuk menyimpan Face Embedding (Vektor Wajah) yang sudah terdaftar
export const faceEmbeddings = pgTable('face_embeddings', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  embedding: vector('embedding', { dimensions: 128 }).notNull(),
  imageUrl: text('image_url'),
  label: varchar('label', { length: 100 }), 
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Tabel Log Verifikasi untuk evaluasi dan audit
export const verificationLogs = pgTable('verification_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  
  // Hasil perbandingan (Euclidean distance)
  matchScore: real('match_score').notNull(),
  
  // Apakah dianggap cocok berdasarkan threshold
  isMatch: boolean('is_match').notNull(),
  
  // Metadata tambahan (opsional)
  metadata: text('metadata'), 
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type FaceEmbedding = typeof faceEmbeddings.$inferSelect;
export type InsertFaceEmbedding = typeof faceEmbeddings.$inferInsert;

export type VerificationLog = typeof verificationLogs.$inferSelect;
export type InsertVerificationLog = typeof verificationLogs.$inferInsert;
