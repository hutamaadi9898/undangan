import { getCloudflareContext } from "@opennextjs/cloudflare";
import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
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

const readAdminConfig = (env?: Env) => {
	const fromEnv = (key: string) => {
		const value = (env as Record<string, string | undefined> | undefined)?.[key];
		return typeof value === "string" ? value.trim() : undefined;
	};

	const adminEmail =
		fromEnv("ADMIN_EMAIL") ??
		fromEnv("admin_email") ??
		(process.env.ADMIN_EMAIL ?? process.env.admin_email)?.trim();

	const adminPassword =
		fromEnv("ADMIN_PASSWORD") ??
		fromEnv("admin_pass") ??
		(process.env.ADMIN_PASSWORD ?? process.env.admin_pass)?.trim();

	return {
		adminEmail: adminEmail?.toLowerCase(),
		adminPassword
	};
};

export const createAuth = (env?: Env, cf?: IncomingRequestCfProperties): AuthInstance => {
	const db = buildDb(env);
	const kv = env?.KV_CACHE as KVNamespace<string> | undefined;
	const secret =
		(env as { BETTER_AUTH_SECRET?: string } | undefined)?.BETTER_AUTH_SECRET ??
		process.env.BETTER_AUTH_SECRET ??
		"dev-secret-change-me";

	const { adminEmail, adminPassword } = readAdminConfig(env);

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
				secret,
				hooks: {
					before: createAuthMiddleware(async (ctx) => {
						// Enforce single-admin allowlist for email/password auth.
						if (!adminEmail) return;

						const bodyEmail = (ctx.body?.email as string | undefined)?.toLowerCase();
						const isAllowedEmail = bodyEmail === adminEmail;

						if (ctx.path === "/sign-up/email") {
							if (!isAllowedEmail) {
								throw new APIError("FORBIDDEN", { message: "Sign-ups are restricted to the configured admin." });
							}
							if (adminPassword && ctx.body?.password !== adminPassword) {
								throw new APIError("FORBIDDEN", { message: "Sign-ups require the configured admin password." });
							}
							return;
						}

						if (ctx.path === "/sign-in/email" && !isAllowedEmail) {
							throw new APIError("FORBIDDEN", { message: "Only the configured admin can sign in." });
						}
					})
				}
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

export const getAdminAllowlistEmail = (env?: Env) => readAdminConfig(env).adminEmail;

export const getServerSession = async (headers: Headers | HeadersInit) => {
	const authInstance = await getAuth();
	const normalizedHeaders = headers instanceof Headers ? headers : new Headers(headers);
	return authInstance.api.getSession({ headers: normalizedHeaders });
};

// Static export for Better Auth CLI schema generation (no runtime env).
export const auth = createAuth();
