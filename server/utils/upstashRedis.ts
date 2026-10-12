interface RedisResponse<T> {
  result?: T;
  error?: string;
}

const getRedisConfig = () => {
  let config: ReturnType<typeof useRuntimeConfig>;
  try {
    config = useRuntimeConfig();
  } catch {
    // Outside the Nitro runtime (unit tests, scripts) there is no runtime
    // config — Redis is optional, so degrade to null instead of crashing.
    return null;
  }
  const url = config.upstashRedisRestUrl;
  const token = config.upstashRedisRestToken;

  if (!url || !token) return null;
  return { url: String(url).replace(/\/$/, ""), token: String(token) };
};

// Bound every Redis call: on serverless a slow Upstash must fail fast to
// the MongoDB fallback instead of burning the whole function time budget
// (a timeout here would surface as 504, which clients read as "logged out").
const UPSTASH_REQUEST_TIMEOUT_MS = 3000;

const command = async <T>(...args: string[]): Promise<T | null> => {
  const redis = getRedisConfig();
  if (!redis) return null;

  try {
    const response = await fetch(`${redis.url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${redis.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([args]),
      signal: AbortSignal.timeout(UPSTASH_REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      console.error(`Upstash Redis request failed with status ${response.status}`);
      return null;
    }

    const data = (await response.json()) as RedisResponse<T>[];
    if (data[0]?.error) {
      console.error("Upstash Redis command failed:", data[0].error);
      return null;
    }
    return data[0]?.result ?? null;
  } catch (error) {
    console.error("Upstash Redis is unavailable:", error);
    return null;
  }
};

export const redisSetJson = async (
  key: string,
  value: Record<string, unknown>,
  ttlSeconds: number
): Promise<boolean> => {
  const result = await command<string>(
    "SET",
    key,
    JSON.stringify(value),
    "EX",
    String(ttlSeconds)
  );
  return result === "OK";
};

export const redisGetJson = async <T>(key: string): Promise<T | null> => {
  const result = await command<string>("GET", key);
  if (!result) return null;

  try {
    return JSON.parse(result) as T;
  } catch {
    console.error(`Invalid JSON stored in Redis key ${key}`);
    return null;
  }
};

export const redisDelete = async (key: string): Promise<boolean> => {
  const result = await command<number>("DEL", key);
  return result !== null;
};

/**
 * Atomically increments a counter and assigns its expiry on the first hit.
 * Returns null when Redis is not configured or unavailable so callers can
 * fall back to their durable store.
 */
export const redisIncrementWithExpiry = async (
  key: string,
  windowSeconds: number
): Promise<number | null> => {
  const script = `
    local count = redis.call("INCR", KEYS[1])
    if count == 1 then
      redis.call("EXPIRE", KEYS[1], ARGV[1])
    end
    return count
  `;
  return command<number>("EVAL", script, "1", key, String(windowSeconds));
};
