import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { finished } from 'stream/promises';

const BASE_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/';

const MODELS = [
  // SSD MobileNet V1 (Membutuhkan 2 Shard)
  { folder: 'ssd_mobilenetv1', file: 'ssd_mobilenetv1_model-weights_manifest.json' },
  { folder: 'ssd_mobilenetv1', file: 'ssd_mobilenetv1_model-shard1' },
  { folder: 'ssd_mobilenetv1', file: 'ssd_mobilenetv1_model-shard2' },

  // Face Landmark 68
  { folder: 'face_landmark_68', file: 'face_landmark_68_model-weights_manifest.json' },
  { folder: 'face_landmark_68', file: 'face_landmark_68_model-shard1' },

  // Face Recognition (Membutuhkan 2 Shard)
  { folder: 'face_recognition', file: 'face_recognition_model-weights_manifest.json' },
  { folder: 'face_recognition', file: 'face_recognition_model-shard1' },
  { folder: 'face_recognition', file: 'face_recognition_model-shard2' }
];

async function downloadModels() {
  const destDir = path.join(process.cwd(), 'models');
  
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir);
  }

  console.log('🚀 Starting model download (Full Shards)...');

  for (const item of MODELS) {
    const url = `${BASE_URL}${item.folder}/${item.file}`;
    const dest = path.join(destDir, item.file);

    // Skip jika file sudah ada agar tidak download ulang
    if (fs.existsSync(dest)) {
        console.log(`⏩ Skipping ${item.file} (Already exists)`);
        continue;
    }

    console.log(`📥 Downloading ${item.file}...`);
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Unexpected response ${response.statusText} for ${url}`);
      }

      const fileStream = fs.createWriteStream(dest);
      // @ts-ignore
      await finished(Readable.fromWeb(response.body).pipe(fileStream));
      
    } catch (error: any) {
      console.error(`❌ Failed to download ${item.file}: ${error.message}`);
    }
  }

  console.log('✅ All model shards downloaded successfully!');
}

downloadModels();
