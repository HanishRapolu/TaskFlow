import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import { redisConnection } from './redis.js';

let io;

export const initSocket = async (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // Set to your frontend URL in production
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    }
  });

  const { host, port, username, password, tls } = redisConnection;
  const pubClient = new Redis({ host, port, username, password, tls });
  const subClient = pubClient.duplicate();

  pubClient.on('error', (err) => console.error('Redis pub client error:', err.message));
  subClient.on('error', (err) => console.error('Redis sub client error:', err.message));

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
