import dotenv from 'dotenv';
dotenv.config();

const REST_URL = process.env.UPSTASH_REDIS_REST_URL || '';
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || '';

// Extract the hostname from the Upstash REST URL, e.g. https://foo.upstash.io -> foo.upstash.io
const UPSTASH_HOST = REST_URL.replace(/^https?:\/\//, '');

const localConnection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT || 6379),
};

// Upstash exposes the Redis protocol on port 6379 over TLS. The REST token
// doubles as the password and 'default' is the username. maxRetriesPerRequest
// is required by BullMQ workers.
export const redisConnection =
  UPSTASH_HOST && REST_TOKEN
    ? {
        host: UPSTASH_HOST,
        port: 6379,
        username: 'default',
        password: REST_TOKEN,
        tls: { rejectUnauthorized: false },
        maxRetriesPerRequest: null,
      }
    : localConnection;

export const isUpstash = Boolean(UPSTASH_HOST && REST_TOKEN);
