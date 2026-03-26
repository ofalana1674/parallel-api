import { FastifyInstance } from 'fastify';
import { redis, Keys } from '../lib/redis.js';
import { TAXONOMY } from '../lib/taxonomy.js';

export async function tagRoutes(app: FastifyInstance) {
  app.get('/tags', async () => TAXONOMY);

  app.get('/tags/pulse', async () => {
    const pipeline = redis.pipeline();
    const allTagIds = TAXONOMY.flatMap((c: any) => c.tags.map((t: any) => t.id));
    for (const id of allTagIds) pipeline.get(Keys.tagCount(id));
    const results = await pipeline.exec();
    return allTagIds.map((tagId: string, i: number) => {
      const count = parseInt((results?.[i]?.[1] as string) || '0', 10);
      return { tagId, activeCount: count, visibility: count === 0 ? 'hidden' : count < 3 ? 'muted' : count < 10 ? 'normal' : 'pulse' };
    });
  });
}
