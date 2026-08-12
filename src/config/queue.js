import { Queue } from 'bullmq';
import { redisConnection } from './redis.js';

export const taskQueue = new Queue('taskQueue', { connection: redisConnection });
