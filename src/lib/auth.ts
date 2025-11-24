import { getCloudflareContext } from "@opennextjs/cloudflare";
import { betterAuth } from "better-auth";
import { withCloudflare } from "better-auth-cloudflare";
import type { D1Database, IncomingRequestCfProperties, KVNamespace } from "@cloudflare/workers-types";
import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import type { Env } from "@/types/env";
import * as appSchema from "./db/schema";
import * as authSchema from "./db/auth-schema";

type AuthInstance = ReturnType<typeof betterAuth>;

declare const global: typeof globalThis & {
	__auth__: AuthInstance | undefined;
};

type CombinedSchema = typeof appSchema & typeof authSchema;

const buildDb = (
	env?: Env
): (DrizzleD1Database<CombinedSchema> & { $client: D1Database }) | undefined => {
	if (!env) return undefined;
	const schema: CombinedSchema = { ...authSchema, ...appSchema };
	const db = drizzle(env.D1_DB, { schema });
	return db as DrizzleD1Database<CombinedSchema> & { $client: D1Database };
};

export const createAuth = (env?: Env, cf?: IncomingRequestCfProperties): AuthInstance => {
	const db = buildDb(env);
	const kv = env?.KV_CACHE as KVNamespace<string> | undefined;
	const secret =
		(env as { BETTER_AUTH_SECRET?: string } | undefined)?.BETTER_AUTH_SECRET ??
		process.env.BETTER_AUTH_SECRET ??
		"dev-secret-change-me";

	return betterAuth(
		withCloudflare(
			{
				cf: cf ?? ({} as IncomingRequestCfProperties),
				d1: db ? { db } : undefined,
				kv,
				r2: env?.R2_BUCKET ? { bucket: env.R2_BUCKET, maxFileSize: 10 * 1024 * 1024 } : undefined
			},
			{
				emailAndPassword: { enabled: true },
				rateLimit: { enabled: true, window: 60, max: 100 },
				secret
			}
		)
	);
};

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
