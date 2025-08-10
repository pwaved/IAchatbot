// backend/config/redis.js
import Redis from 'ioredis';

// Connect to your Redis server using a configuration object
const redis = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
});

redis.on('connect', () => {
  console.log('Successfully connected to Redis!');
});

redis.on('error', (err) => {
  console.error('Redis Client Error', err)
});

export default redis;