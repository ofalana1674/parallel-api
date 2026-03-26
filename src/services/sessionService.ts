import { FastifyInstance } from 'fastify';
import { v7 as uuidv7 } from 'uuid';
import { z } from 'zod';
import { redis, Keys, TTL } from '../lib/redis';
import { hasCrisisTag } from '../services/safetyService';
import { CANONICAL_TAG_IDS } from '../lib/taxonomy';
import { addToPool } from '../services/poolService';
import { triggerMatchAttempt } from '../services/matchService';

const EnterPoolSchema = z.object({
  tagIds: z
    .array(z.string())
    .min(1)
    .max(3)
    .refine(ids => ids.every(id => CANONICAL_TAG_IDS.has(id)), {
      message: 'One or more tag IDs are not in the canonical taxonomy',
    }),
});

export async function sessionRoutes(app: FastifyInstance) {

  // POST /session — create anonymous session
  app.post('/session', async (req, reply) => {
    const ip = req.ip;
    const rateLimitKey = Keys.rateLimit(ip);
    const count = await redis.incr(rateLimitKey);
    if (count === 1) await redis.expire(rateLimitKey, TTL.RATE_LIMIT);
    if (count > 3) return reply.code(429).send({ error: 'Too many sessions' });

    const sessionId = uuidv7();
    const expiresAt = new Date(Date.now() + TTL.SESSION * 1000).toISOString();

    await redis.hset(Keys.session(sessionId), {
      sessionId,
      createdAt:   new Date().toISOString(),
      poolEntryAt: '',
      matchId:     '',
      tagIds:      JSON.stringify([]),
      status:      'selecting',
    });
    await redis.expire(Keys.session(sessionId), TTL.SESSION);

    return { sessionId, expiresAt };
  });

  // POST /session/:id/enter-pool
  app.post<{ Params: { id: string } }>(
    '/session/:id/enter-pool',
    async (req, reply) => {
      const { id } = req.params;
      const body = EnterPoolSchema.safeParse(req.body);
      if (!body.success) return reply.code(400).send(body.error);

      const { tagIds } = body.data;
      const session = await redis.hgetall(Keys.session(id));
      if (!session.sessionId) return reply.code(404).send({ error: 'Session not found' });
      if (session.status === 'matched') return reply.code(409).send({ error: 'Already matched' });

      // ── Safety gate (synchronous — blocks pool entry) ────────
      if (hasCrisisTag(tagIds)) {
        return reply.code(200).send({
          action: 'crisis_routing',
          message: 'One or more tags triggered crisis routing. Show resources before pool entry.',
        });
      }

      // ── Enter pool ───────────────────────────────────────────
      await redis.hset(Keys.session(id), {
        tagIds:      JSON.stringify(tagIds),
        status:      'in_pool',
        poolEntryAt: new Date().toISOString(),
      });

      await addToPool(id, tagIds);
      triggerMatchAttempt(id, tagIds); // non-blocking

      return { status: 'in_pool' };
    }
  );

  // GET /session/:id/status
  app.get<{ Params: { id: string } }>(
    '/session/:id/status',
    async (req, reply) => {
      const { id } = req.params;
      const session = await redis.hgetall(Keys.session(id));
      if (!session.sessionId) return reply.code(404).send({ error: 'Not found' });

      return {
        status:  session.status,
        matchId: session.matchId || null,
      };
    }
  );

  // DELETE /session/:id/exit-pool
  app.delete<{ Params: { id: string } }>(
    '/session/:id/exit-pool',
    async (req, reply) => {
      const { id } = req.params;
      const session = await redis.hgetall(Keys.session(id));
      if (!session.sessionId) return reply.code(404).send({ error: 'Not found' });

      const tagIds: string[] = JSON.parse(session.tagIds || '[]');
      await removeFromPool(id, tagIds);
      await redis.hset(Keys.session(id), { status: 'selecting', tagIds: '[]' });

      return { status: 'selecting' };
    }
  );
}