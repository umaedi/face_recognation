module.exports = {
  apps: [
    {
      name: 'face-api',
      script: 'src/index.ts',
      interpreter: 'node',
      interpreter_args: '--import tsx', // Menggunakan tsx untuk menjalankan TypeScript langsung
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'face-worker',
      script: 'src/worker.ts',
      interpreter: 'node',
      interpreter_args: '--import tsx',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
