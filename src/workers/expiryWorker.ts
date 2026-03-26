import 'dotenv/config';
import { Worker, Queue } from 'bullmq';
import { v7 as uuidv7 } from 'uuid';
import { redis, bullRedis, Keys } from '../lib/redis.js';
import { getIO } from '../lib/socket.js';

export const expiryQueue = new Queue('match-expiry', { connection: bullRedis });

export async function scheduleMatchExpiry(matchId: string, expiresAt: string): Promise<void> {
  const expiryTime   = new Date(expiresAt).getTime();
  const now          = Date.now();
  const warningDelay = expiryTime - now - 3600_000;
  const expiryDelay  = expiryTime - now;

  if (warningDelay > 0) {
    await expiryQueue.add('match:warning', { matchId }, {
      delay: warningDelay,
      jobId: `warning:${matchId}`,
      removeOnComplete: true,
    });
  }

  await expiryQueue.add('match:expire', { matchId }, {
    delay: expiryDelay,
    jobId: `expire:${matchId}`,
    removeOnComplete: true,
  });
}

new Worker('match-expiry', async (job) => {

  if (job.name === 'match:warning') {
    const { matchId } = job.data;
    const sysMsg = {
      msgId:  uuidv7(),
      sender: 'system',
      text:   'One hour left. This conversation dissolves at midnight.',
      sentAt: new Date().toISOString(),
      type:   'system',
    };
    await redis.lpush(Keys.chat(matchId), JSON.stringify(sysMsg));
    try {
      getIO().to(`match:${matchId}`).emit('chat:message', sysMsg);
      getIO().to(`match:${matchId}`).emit('match:expiring', { minutesLeft: 60 });
    } catch {}
  }

  if (job.name === 'match:expire') {
    const { matchId } = job.data;
    const match = await redis.hgetall(Keys.match(matchId));
    if (!match.matchId || match.status === 'ended') return;

    await redis.hset(Keys.match(matchId), { status: 'ended' });

    try {
      getIO().to(`match:${matchId}`).emit('match:ended', { reason: 'expiry' });
    } catch {}

    await redis.del(Keys.chat(matchId));
    await writeAuditRow(matchId, match);

    setTimeout(async () => {
      await redis.del(Keys.match(matchId));
    }, 5000);
  }

}, { connection: bullRedis });

async function writeAuditRow(matchId: string, match: Record<string, string>) {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.DATABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );
    await supabase.from('match_audit').insert({
      match_id:   matchId,
      tag_ids:    JSON.parse(match.tagIds || '[]'),
      started_at: match.createdAt,
      expired_at: new Date().toISOString(),
      ended_by:   'expiry',
    });
  } catch (e) {
    console.error('Audit write failed:', e);
  }
}
