import 'dotenv/config';
import { createServer } from 'http';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { Server } from 'socket.io';
import { sessionRoutes } from './routes/session.js';
import { tagRoutes } from './routes/tags.js';
import { healthRoutes } from './routes/health.js';
import { redis } from './lib/redis.js';
import { setIO } from './lib/socket.js';
import { registerChatHandlers } from './handlers/chatHandler.js';
import './workers/expiryWorker.js';

const PORT = parseInt(process.env.PORT || '3001', 10);

const app = Fastify({ logger: true, serverFactory: (handler) => {
  const server = createServer(handler);
  return server;
}});

await app.register(cors, { origin: '*' });
await app.register(sessionRoutes);
await app.register(tagRoutes);
await app.register(healthRoutes);
await redis.connect();
await app.ready();

const io = new Server(app.server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  connectionStateRecovery: { maxDisconnectionDuration: 30000 },
});

setIO(io);

io.on('connection', (socket) => {
  app.log.info(`Socket connected: ${socket.id}`);
  registerChatHandlers(io, socket);
});

await app.listen({ port: PORT, host: '0.0.0.0' });
app.log.info(`Parallel API + Socket.io running on :${PORT}`);
