import { FastifyInstance } from 'fastify';
import { v7 as uuidv7 } from 'uuid';
import { z } from 'zod';
import { redis, Keys, TTL } from '../lib/redis.js';
import { hasCrisisTag } from '../services/safetyService.js';
import { CANONICAL_TAG_IDS } from '../lib/taxonomy.js';
import { addToPool, removeFromPool } from '../services/poolService.js';
import { triggerMatchAttempt } from '../services/matchService.js';

const EnterPoolSchema = z.object({
  tagIds: z.array(z.string()).min(1).max(3).refine(ids => ids.every(id => CANONICAL_TAG_IDS.has(id)), { message: 'Invalid tag IDs' }),
});

export async function sessionRoutes(app: FastifyInstance) {
  app.post('/session', async (req, reply) => {
    const ip = req.ip;
    const rateLimitKey = Keys.rateLimit(ip);
    const count = await redis.incr(rateLimitKey);
    if (count === 1) await redis.expire(rateLimitKey, TTL.RATE_LIMIT);
    if (count > 3) return reply.code(429).send({ error: 'Too many sessions' });
    const sessionId = uuidv7();
    const expiresAt = new Date(Date.now() + TTL.SESSION * 1000).toISOString();
    await redis.hset(Keys.session(sessionId), { sessionId, createdAt: new Date().toISOString(), poolEntryAt: '', matchId: '', tagIds: JSON.stringify([]), status: 'selecting' });
    await redis.expire(Keys.session(sessionId), TTL.SESSION);
    return { sessionId, expiresAt };
  });

  app.post<{ Params: { id: string } }>('/session/:id/enter-pool', async (req, reply) => {
    const { id } = req.params;
    const body = EnterPoolSchema.safeParse(req.body);
    if (!body.success) return reply.code(400).send(body.error);
    const { tagIds } = body.data;
    const session = await redis.hgetall(Keys.session(id));
    if (!session.sessionId) return reply.code(404).send({ error: 'Session not found' });
    if (session.status === 'matched') return reply.code(409).send({ error: 'Already matched' });
    if (hasCrisisTag(tagIds)) return reply.code(200).send({ action: 'crisis_routing', message: 'Crisis tag detected. Show resources before pool entry.' });
    await redis.hset(Keys.session(id), { tagIds: JSON.stringify(tagIds), status: 'in_pool', poolEntryAt: new Date().toISOString() });
    await addToPool(id, tagIds);
    triggerMatchAttempt(id, tagIds);
    return { status: 'in_pool' };
  });

  app.get<{ Params: { id: string } }>('/session/:id/status', async (req, reply) => {
    const { id } = req.params;
    const session = await redis.hgetall(Keys.session(id));
    if (!session.sessionId) return reply.code(404).send({ error: 'Not found' });
    return { status: session.status, matchId: session.matchId || null };
  });

  app.delete<{ Params: { id: string } }>('/session/:id/exit-pool', async (req, reply) => {
    const { id } = req.params;
    const session = await redis.hgetall(Keys.session(id));
    if (!session.sessionId) return reply.code(404).send({ error: 'Not found' });
    const tagIds: string[] = JSON.parse(session.tagIds || '[]');
    await removeFromPool(id, tagIds);
    await redis.hset(Keys.session(id), { status: 'selecting', tagIds: '[]' });
    return { status: 'selecting' };
  });
}
