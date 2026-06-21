import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

let io;

export const initSocket = async (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // Set to your frontend URL in production
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    }
  });

  const pubClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
  const subClient = pubClient.duplicate();

  await Promise.all([pubClient.connect(), subClient.connect()]);

  io.adapter(createAdapter(pubClient, subClient));

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join a board room
    socket.on('joinBoard', (boardId) => {
      socket.join(`board:${boardId}`);
      console.log(`Socket ${socket.id} joined board:${boardId}`);
    });

    // Leave a board room
    socket.on('leaveBoard', (boardId) => {
      socket.leave(`board:${boardId}`);
      console.log(`Socket ${socket.id} left board:${boardId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIo = () => {
  if (!io) {
    throw new Error('Socket.io is not initialized!');
  }
  return io;
};
