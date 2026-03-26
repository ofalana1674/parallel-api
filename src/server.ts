import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { sessionRoutes } from './routes/session.js';
import { tagRoutes } from './routes/tags.js';
import { redis } from './lib/redis.js';
import { registerChatHandlers } from './handlers/chatHandler.js';

const app = Fastify({ logger: true });

await app.register(cors, { origin: process.env.ALLOWED_ORIGINS?.split(',') || '*' });
await app.register(sessionRoutes);
await app.register(tagRoutes);

await redis.connect();
await app.ready();

// ── Attach Socket.io to the underlying HTTP server ──────────
const httpServer = createServer(app.server);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  connectionStateRecovery: { maxDisconnectionDuration: 30000 },
});

io.on('connection', (socket) => {
  app.log.info(`Socket connected: ${socket.id}`);
  registerChatHandlers(io, socket);
});

// ── Start ────────────────────────────────────────────────────
httpServer.listen(3001, '0.0.0.0', () => {
  app.log.info('Parallel API + Socket.io running on :3001');
});
