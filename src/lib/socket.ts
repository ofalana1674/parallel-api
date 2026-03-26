import { Server } from 'socket.io';

let io: Server;

export function setIO(instance: Server): void {
  io = instance;
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}
