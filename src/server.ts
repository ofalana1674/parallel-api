import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { sessionRoutes } from './routes/session.js';
import { tagRoutes } from './routes/tags.js';
import { redis } from './lib/redis.js';

const app = Fastify({ logger: true });

await app.register(cors, { origin: process.env.ALLOWED_ORIGINS?.split(',') || '*' });
await app.register(sessionRoutes);
await app.register(tagRoutes);
await redis.connect();
await app.listen({ port: 3001, host: '0.0.0.0' });
