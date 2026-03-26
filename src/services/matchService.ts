import { v7 as uuidv7 } from 'uuid';
import { redis, Keys, TTL } from '../lib/redis.js';
import { removeFromPool } from './poolService.js';

export async function triggerMatchAttempt(incomingId: string, tagIds: string[]): Promise<void> {
  const candidate = await findCandidate(incomingId, tagIds);
  if (!candidate) return;
  await createMatch(incomingId, candidate.sessionId, candidate.sharedTags, tagIds);
}

async function findCandidate(incomingId: string, tagIds: string[]): Promise<{ sessionId: string; sharedTags: string[] } | null> {
  for (let size = tagIds.length; size >= 2; size--) {
    const result = await findByTagOverlap(incomingId, tagIds, size);
    if (result) return result;
  }
  for (const tagId of tagIds) {
    const candidates = await redis.zrange(Keys.poolTag(tagId), 0, 9);
    for (const cId of candidates) {
      if (cId === incomingId) continue;
      if (await hasSeen(incomingId, cId)) continue;
      return { sessionId: cId, sharedTags: [tagId] };
    }
  }
  return null;
}

async function findByTagOverlap(incomingId: string, tagIds: string[], minOverlap: number): Promise<{ sessionId: string; sharedTags: string[] } | null> {
  const counts = new Map<string, string[]>();
  for (const tagId of tagIds) {
    const members = await redis.zrange(Keys.poolTag(tagId), 0, -1);
    for (const m of members) {
      if (m === incomingId) continue;
      if (!counts.has(m)) counts.set(m, []);
      counts.get(m)!.push(tagId);
    }
  }
  const eligible = [...counts.entries()].filter(([, tags]) => tags.length >= minOverlap).sort((a, b) => b[1].length - a[1].length);
  for (const [candidateId, sharedTags] of eligible) {
    if (await hasSeen(incomingId, candidateId)) continue;
    return { sessionId: candidateId, sharedTags };
  }
  return null;
}

async function createMatch(sessionA: string, sessionB: string, sharedTags: string[], allTagsA: string[]): Promise<string> {
  const matchId = uuidv7();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + TTL.MATCH * 1000).toISOString();
  const allTagsB: string[] = JSON.parse((await redis.hget(Keys.session(sessionB), 'tagIds')) || '[]');
  const pipeline = redis.pipeline();
  pipeline.hset(Keys.match(matchId), { matchId, sessionA, sessionB, tagIds: JSON.stringify(sharedTags), createdAt: now.toISOString(), expiresAt, status: 'active' });
  pipeline.expire(Keys.match(matchId), TTL.MATCH);
  pipeline.set(Keys.matchExpiry(matchId), 'pending', 'EX', TTL.MATCH);
  pipeline.hset(Keys.session(sessionA), { status: 'matched', matchId });
  pipeline.hset(Keys.session(sessionB), { status: 'matched', matchId });
  await pipeline.exec();
  await removeFromPool(sessionA, allTagsA);
  await removeFromPool(sessionB, allTagsB);
  await redis.sadd(Keys.seenBloom(sessionA), sessionB);
  await redis.sadd(Keys.seenBloom(sessionB), sessionA);
  return matchId;
}

async function hasSeen(sessionA: string, sessionB: string): Promise<boolean> {
  return (await redis.sismember(Keys.seenBloom(sessionA), sessionB)) === 1;
}

import { scheduleMatchExpiry } from '../workers/expiryWorker.js';

export async function scheduleExpiry(matchId: string, expiresAt: string): Promise<void> {
  await scheduleMatchExpiry(matchId, expiresAt);
}
