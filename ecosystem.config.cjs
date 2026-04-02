module.exports = {
  apps: [
    {
      name: 'face-api',
      script: 'node',
      args: '--import tsx src/index.ts',
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
      script: 'node',
      args: '--import tsx src/worker.ts',
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
