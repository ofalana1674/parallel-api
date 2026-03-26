import { redis, Keys } from '../lib/redis.js';

export async function addToPool(sessionId: string, tagIds: string[]): Promise<void> {
  const score = Date.now();
  const pipeline = redis.pipeline();
  for (const tagId of tagIds) {
    pipeline.zadd(Keys.poolTag(tagId), score, sessionId);
    pipeline.incr(Keys.tagCount(tagId));
  }
  await pipeline.exec();
}

export async function removeFromPool(sessionId: string, tagIds: string[]): Promise<void> {
  const pipeline = redis.pipeline();
  for (const tagId of tagIds) {
    pipeline.zrem(Keys.poolTag(tagId), sessionId);
    pipeline.decr(Keys.tagCount(tagId));
  }
  await pipeline.exec();
}
