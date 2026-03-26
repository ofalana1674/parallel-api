import { Server } from 'socket.io';
import type { Server as HttpServer } from 'http';

let io: Server;

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    connectionStateRecovery: { maxDisconnectionDuration: 30000 },
  });
  return io;
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}
