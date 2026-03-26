import { redis, Keys, TTL } from './redis.js';

export interface ChatMessage {
  msgId:   string;
  sender:  'a' | 'b';
  text:    string;
  sentAt:  string;
  type:    'text' | 'system';
}

export async function saveMessage(matchId: string, msg: ChatMessage): Promise<void> {
  await redis.lpush(Keys.chat(matchId), JSON.stringify(msg));
  await redis.ltrim(Keys.chat(matchId), 0, 499);       // cap at 500 messages
  await redis.expire(Keys.chat(matchId), TTL.MATCH);
}

export async function getRecentMessages(matchId: string, count = 20): Promise<ChatMessage[]> {
  const raw = await redis.lrange(Keys.chat(matchId), 0, count - 1);
  return raw.map(r => JSON.parse(r)).reverse();
}

export async function getSenderRole(matchId: string, sessionId: string): Promise<'a' | 'b' | null> {
  const match = await redis.hgetall(Keys.match(matchId));
  if (!match.matchId) return null;
  if (match.sessionA === sessionId) return 'a';
  if (match.sessionB === sessionId) return 'b';
  return null;
}
