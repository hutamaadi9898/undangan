import { getCloudflareContext } from "@opennextjs/cloudflare";
import { betterAuth } from "better-auth";
import { withCloudflare } from "better-auth-cloudflare";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { IncomingRequestCfProperties, KVNamespace, R2Bucket } from "@cloudflare/workers-types";
import { drizzle } from "drizzle-orm/d1";
import type { Env } from "@/types/env";
import * as appSchema from "./db/schema";
import * as authSchema from "./db/auth-schema";

type AuthInstance = ReturnType<typeof betterAuth>;

declare const global: typeof globalThis & {
	__auth__: AuthInstance | undefined;
};

const buildDb = (env?: Env) => {
	const schema = { ...authSchema, ...appSchema };
	return env ? drizzle(env.D1_DB, { schema }) : ({} as any);
};

export const createAuth = (env?: Env, cf?: IncomingRequestCfProperties): AuthInstance =>
	betterAuth({
		...withCloudflare(
			{
				cf: cf ?? ({} as IncomingRequestCfProperties),
				d1: env
					? {
							db: buildDb(env)
						}
					: undefined,
				kv: env?.KV_CACHE ? (env.KV_CACHE as unknown as KVNamespace) : undefined,
				r2: env?.R2_BUCKET ? { bucket: env.R2_BUCKET as any, maxFileSize: 10 * 1024 * 1024 } : undefined
			},
			{
				emailAndPassword: { enabled: true },
				rateLimit: { enabled: true, window: 60, max: 100 }
			}
		),
		...(env
			? {}
			: {
					database: drizzleAdapter(buildDb(env), { provider: "sqlite", usePlural: true })
				})
	});

export const getAuth = async (): Promise<AuthInstance> => {
	if (global.__auth__) return global.__auth__;
	const { env, cf } = await getCloudflareContext({ async: true });
	const instance = createAuth(env as Env, cf);
	global.__auth__ = instance;
	return instance;
};

export const getServerSession = async (headers: Headers | HeadersInit) => {
	const authInstance = await getAuth();
	const normalizedHeaders = headers instanceof Headers ? headers : new Headers(headers);
	return authInstance.api.getSession({ headers: normalizedHeaders });
};

// Static export for Better Auth CLI schema generation (no runtime env).
export const auth = createAuth();
