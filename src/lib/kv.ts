import type { Env } from "@/types/env";

const DEFAULT_TTL = 60;

export const kvCacheKey = (slug: string) => `wedding:public:${slug}`;

export const kvGet = async <T>(env: Env, key: string): Promise<T | null> => {
	const value = await env.KV_CACHE.get(key, "json");
	return (value as T | null) ?? null;
};

export const kvSet = async <T>(
	env: Env,
	key: string,
	value: T,
	ttlSeconds = DEFAULT_TTL
): Promise<void> => {
	await env.KV_CACHE.put(key, JSON.stringify(value), { expirationTtl: ttlSeconds });
};

export const rateLimit = async (
	env: Env,
	key: string,
	limit: number,
	windowSeconds: number
): Promise<{ allowed: boolean; remaining: number }> => {
	const windowStart = Math.floor(Date.now() / (windowSeconds * 1000));
	const bucketKey = `rl:${key}:${windowStart}`;
	const currentRaw = await env.KV_CACHE.get(bucketKey);
	const current = currentRaw ? Number.parseInt(currentRaw, 10) : 0;

	if (current >= limit) {
		return { allowed: false, remaining: 0 };
	}

	await env.KV_CACHE.put(bucketKey, String(current + 1), { expirationTtl: windowSeconds });
	return { allowed: true, remaining: Math.max(limit - current - 1, 0) };
};
