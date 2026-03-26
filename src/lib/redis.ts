import Redis from 'ioredis';

export const redis = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

// Separate connection for BullMQ (requires maxRetriesPerRequest: null)
export const bullRedis = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
  lazyConnect: false,
});

export const Keys = {
  session:     (id: string)        => `session:${id}`,
  poolTag:     (tagId: string)     => `pool:tag:${tagId}`,
  match:       (id: string)        => `match:${id}`,
  chat:        (matchId: string)   => `chat:${matchId}:messages`,
  matchExpiry: (matchId: string)   => `match:expiry:${matchId}`,
  tagCount:    (tagId: string)     => `tagcount:${tagId}`,
  rateLimit:   (ip: string)        => `ratelimit:session:${ip}`,
  seenBloom:   (sessionId: string) => `session:${sessionId}:seen`,
};

export const TTL = {
  SESSION:    86400,
  MATCH:      86400,
  RATE_LIMIT: 3600,
};
