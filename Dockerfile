# Gunakan Bullseye karena memiliki pustaka sistem paling lengkap untuk native modules
FROM node:20-bullseye-slim AS builder

# Instal dependensi sistem yang dibutuhkan oleh node-canvas dan node-gyp
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Salin package manifest
COPY package*.json ./

# Instal dependensi termasuk native modules (canvas, tfjs-node)
RUN npm install

# Salin seluruh kode sumber
COPY . .

# Tahap Runtime
FROM node:20-bullseye-slim

WORKDIR /app

# Instal pustaka sistem RUNTIME saja
RUN apt-get update && apt-get install -y \
    libcairo2 \
    libpango-1.0-0 \
    libjpeg62-turbo \
    libgif7 \
    librsvg2-2 \
    && rm -rf /var/lib/apt/lists/*

# Instal PM2 dan TSX secara global
RUN npm install -g pm2 tsx

# Salin hanya node_modules dan file yang dibutuhkan dari builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app ./

# Expose port API (sesuai konfigurasi terakhir Anda 9923)
EXPOSE 9923

# Jalankan menggunakan PM2
CMD ["pm2-runtime", "start", "ecosystem.config.cjs"]
