module.exports = {
  apps: [
    {
      name: 'face-api',
      script: 'npm',
      args: 'start',
      exec_mode: 'fork', // API sebaiknya fork jika port tunggal
      instances: 1,      // Bisa ditingkatkan ke 'max' jika menggunakan load balancer eksternal
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'face-worker',
      script: 'npm',
      args: 'run worker',
      instances: 1,      // Kita sudah menggunakan concurrency 20 di dalam kode
      autorestart: true,
      watch: false,
      max_memory_restart: '2G', // AI memakan banyak RAM
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
