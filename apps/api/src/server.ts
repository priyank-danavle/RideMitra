import http from 'http';
import { app } from './app.js';
import { config } from './config/index.js';

import { closeDbPool } from './db/index.js';

const server = http.createServer(app);

server.listen(config.port, () => {
  console.log(`🚀 RideMitra API listening on port ${config.port} (${config.env})`);
  console.log(`📡 Health Check URL: http://localhost:${config.port}${config.apiPrefix}/health`);
  console.log(`🔒 Allowed CORS Origins: ${config.corsOrigins.join(', ')}`);
});

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(signal: string) {
  console.log(`\n🛑 Received ${signal}. Initiating graceful shutdown...`);

  await closeDbPool();

  server.close((err) => {
    if (err) {
      console.error('Error during server close:', err);
      process.exit(1);
    }
    console.log('✅ HTTP server and database pool closed gracefully.');
    process.exit(0);
  });

  // Force close after 10 seconds if hanging
  setTimeout(() => {
    console.error('⚠️  Forceful shutdown initiated after timeout.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
