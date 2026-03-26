import type { Server, Socket } from 'socket.io';
import { v7 as uuidv7 } from 'uuid';
import { redis, Keys } from '../lib/redis.js';
import { saveMessage, getRecentMessages, getSenderRole } from '../lib/chat.js';
import { scanMessage, claudeCrisisScan } from '../services/safetyService.js';

const CRISIS_RESOURCE = 'If you\'re having thoughts of hurting yourself, real support is available right now. Call or text 988, or text HOME to 741741.';

export function registerChatHandlers(io: Server, socket: Socket) {

  socket.on('match:join', async ({ matchId, sessionId }: { matchId: string; sessionId: string }) => {
    const match = await redis.hgetall(Keys.match(matchId));
    if (!match.matchId || match.status === 'ended') {
      socket.emit('match:ended', { reason: 'expired' });
      return;
    }
    const role = await getSenderRole(matchId, sessionId);
    if (!role) { socket.emit('error', { message: 'Unauthorized' }); return; }
    socket.join(`match:${matchId}`);
    socket.data.matchId   = matchId;
    socket.data.sessionId = sessionId;
    socket.data.role      = role;
    const recent = await getRecentMessages(matchId, 20);
    socket.emit('chat:history', { messages: recent, expiresAt: match.expiresAt });
    socket.to(`match:${matchId}`).emit('match:peer_joined', {});
  });

  socket.on('chat:send', async ({ text }: { text: string }, ack) => {
    const { matchId, role } = socket.data;
    if (!matchId || !role) return;
    const match = await redis.hgetall(Keys.match(matchId));
    if (!match.matchId || match.status === 'ended') {
      socket.emit('match:ended', { reason: 'expired' });
      return;
    }
    const msg = {
      msgId:  uuidv7(),
      sender: role as 'a' | 'b',
      text:   text.slice(0, 1000),
      sentAt: new Date().toISOString(),
      type:   'text' as const,
    };
    await saveMessage(matchId, msg);
    io.to(`match:${matchId}`).emit('chat:message', msg);
    if (ack) ack({ ok: true, msgId: msg.msgId });
    const trieResult = scanMessage(text);
    if (trieResult.isCrisis) { injectCrisisMessage(io, matchId); return; }
    claudeCrisisScan(text).then(result => {
      if (result.isCrisis && result.confidence !== 'low') injectCrisisMessage(io, matchId);
    }).catch(() => {});
  });

  socket.on('chat:typing', () => {
    const { matchId, role } = socket.data;
    if (!matchId || !role) return;
    socket.to(`match:${matchId}`).emit('chat:typing', { sender: role });
  });

  socket.on('match:leave', async () => {
    const { matchId } = socket.data;
    if (!matchId) return;
    await redis.hset(Keys.match(matchId), { status: 'ended' });
    io.to(`match:${matchId}`).emit('match:ended', { reason: 'peer_left' });
  });

  socket.on('disconnect', () => {
    const { matchId } = socket.data;
    if (matchId) socket.to(`match:${matchId}`).emit('match:peer_disconnected', {});
  });
}

async function injectCrisisMessage(io: Server, matchId: string) {
  const sysMsg = {
    msgId:  uuidv7(),
    sender: 'system' as any,
    text:   CRISIS_RESOURCE,
    sentAt: new Date().toISOString(),
    type:   'system' as const,
  };
  await saveMessage(matchId, sysMsg);
  io.to(`match:${matchId}`).emit('chat:message', sysMsg);
}
