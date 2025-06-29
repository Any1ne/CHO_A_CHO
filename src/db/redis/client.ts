import Redis from "ioredis";

export const redis = new Redis(process.env.REDIS_URL!, {
  connectTimeout: 30000, // 30 секунд
  maxRetriesPerRequest: 5,
  retryStrategy(times) {
    return Math.min(times * 100, 2000); // експоненційна затримка
  },
  keepAlive: 10000,
});
