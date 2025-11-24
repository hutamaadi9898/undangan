import { getCloudflareContext } from "@opennextjs/cloudflare";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import type { Env } from "@/types/env";
import { getDb } from "@/lib/db/client";
import { rsvps, weddings } from "@/lib/db/schema";
import { rateLimit } from "@/lib/kv";

export const runtime = "nodejs";

const schema = z.object({
	slug: z.string().min(1),
	guestName: z.string().min(1).max(120),
	contact: z.string().min(3).max(160),
	attending: z.enum(["yes", "no", "maybe"]),
	paxCount: z.number().int().min(1).max(20).default(1),
	message: z.string().max(1000).optional(),
	honeypot: z.string().max(0).optional()
});

export async function POST(req: Request) {
	const payload = await req.json();
	const parsed = schema.safeParse(payload);

	if (!parsed.success) {
		return NextResponse.json({ error: "Invalid RSVP data", issues: parsed.error.flatten() }, { status: 400 });
	}

	if (parsed.data.honeypot) {
		return NextResponse.json({ status: "ok" });
	}

	const { env, cf } = await getCloudflareContext({ async: true });
	const typedEnv = env as Env;

	const ip = req.headers.get("cf-connecting-ip") ?? cf?.clientTcpRtt?.toString() ?? "unknown";
	const rlKey = `rsvp:${parsed.data.slug}:${ip}`;
	const limit = await rateLimit(typedEnv, rlKey, 5, 60);

	if (!limit.allowed) {
		return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
	}

	const db = await getDb(typedEnv);
	const wedding = await db.query.weddings.findFirst({
		where: eq(weddings.slug, parsed.data.slug)
	});

	if (!wedding || wedding.status !== "published") {
		return NextResponse.json({ error: "Wedding not found" }, { status: 404 });
	}

	await db.insert(rsvps).values({
		weddingId: wedding.id,
		guestName: parsed.data.guestName,
		contact: parsed.data.contact,
		attending: parsed.data.attending,
		paxCount: parsed.data.paxCount,
		message: parsed.data.message ?? null
	});

	return NextResponse.json({ status: "ok" });
}
