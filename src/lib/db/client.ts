import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import type { Env } from "@/types/env";
import * as appSchema from "./schema";
import * as authSchema from "./auth-schema";

type CombinedSchema = typeof appSchema & typeof authSchema;
type DbClient = DrizzleD1Database<CombinedSchema>;

declare const global: typeof globalThis & {
	__db__: DbClient | undefined;
};

const getEnv = async (env?: Env) => {
	if (env) return env;
	const ctx = await getCloudflareContext({ async: true });
	return ctx.env as Env;
};

export const getDb = async (env?: Env): Promise<DbClient> => {
	if (global.__db__) return global.__db__;
	const resolvedEnv = await getEnv(env);
	const db = drizzle(resolvedEnv.D1_DB, { schema: { ...appSchema, ...authSchema } });
	global.__db__ = db;
	return db;
};
