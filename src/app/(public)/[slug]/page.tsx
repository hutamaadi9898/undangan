import { getCloudflareContext } from "@opennextjs/cloudflare";
import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Env } from "@/types/env";
import { getDb } from "@/lib/db/client";
import { pages, weddings } from "@/lib/db/schema";
import { kvCacheKey, kvGet, kvSet } from "@/lib/kv";
import RsvpForm from "./rsvp-form";

export const runtime = "nodejs";
export const revalidate = 300;

type Section = {
	id: string;
	type: string;
	orderIndex: number;
	content: Record<string, unknown>;
};

type InviteModel = {
	wedding: {
		id: string;
		title: string;
		slug: string;
		coupleNames: string;
		eventDate: string;
	};
	sections: Section[];
};

const parseJson = (raw: string) => {
	try {
		return JSON.parse(raw) as Record<string, unknown>;
	} catch {
		return {};
	}
};

const loadInvite = async (slug: string): Promise<InviteModel | null> => {
	const { env } = await getCloudflareContext({ async: true });
	const typedEnv = env as Env;

	const cached = await kvGet<InviteModel>(typedEnv, kvCacheKey(slug));
	if (cached) return cached;

	const db = await getDb(typedEnv);
	const wedding = await db.query.weddings.findFirst({
		where: eq(weddings.slug, slug)
	});

	if (!wedding || wedding.status !== "published") {
		return null;
	}

	const sectionRows = await db
		.select()
		.from(pages)
		.where(eq(pages.weddingId, wedding.id))
		.orderBy(asc(pages.orderIndex));

	const model: InviteModel = {
		wedding: {
			id: wedding.id,
			title: wedding.title,
			slug: wedding.slug,
			coupleNames: wedding.coupleNames,
			eventDate: wedding.eventDate
		},
		sections: sectionRows.map((row) => ({
			id: row.id,
			type: row.type,
			orderIndex: row.orderIndex,
			content: parseJson(row.contentJson)
		}))
	};

	await kvSet(typedEnv, kvCacheKey(slug), model, 300);
	return model;
};

type PageProps = {
	params?: Promise<{ slug?: string | string[] }>;
};

export default async function InvitePage({ params }: PageProps) {
	const resolvedParams = (await params) ?? {};
	const slug = Array.isArray(resolvedParams.slug) ? resolvedParams.slug[0] : resolvedParams.slug;
	if (!slug) return notFound();

	const data = await loadInvite(slug);
	if (!data) return notFound();

	return (
		<div className="min-h-screen bg-gradient-to-b from-white to-slate-50 text-slate-900">
			<header className="mx-auto w-full max-w-3xl px-6 py-12 text-center">
				<p className="text-sm uppercase tracking-[0.2em] text-slate-500">You&apos;re invited</p>
				<h1 className="mt-3 text-4xl font-semibold sm:text-5xl">{data.wedding.coupleNames}</h1>
				<p className="mt-2 text-base text-slate-600">
					Join us on <span className="font-medium text-slate-800">{data.wedding.eventDate}</span>
				</p>
			</header>

			<main className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 pb-16">
				<section className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
					<h2 className="text-xl font-semibold text-slate-800">Story & Schedule</h2>
					<div className="mt-3 space-y-4 text-sm text-slate-700">
						{data.sections.length === 0 ? (
							<p>Details coming soon.</p>
						) : (
							data.sections.map((section) => (
								<div key={section.id} className="rounded-xl bg-slate-50 p-4">
									<p className="text-xs uppercase tracking-[0.2em] text-slate-500">{section.type}</p>
									<pre className="mt-2 whitespace-pre-wrap text-sm text-slate-800">
										{JSON.stringify(section.content, null, 2)}
									</pre>
								</div>
							))
						)}
					</div>
				</section>

				<section className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
					<h2 className="text-xl font-semibold text-slate-800">RSVP</h2>
					<p className="mt-2 text-sm text-slate-600">
						Let us know if you can make it. We&apos;ll send details to the contact you provide.
					</p>
					<div className="mt-4">
						<Suspense fallback={<p>Loading form…</p>}>
							<RsvpForm slug={data.wedding.slug} />
						</Suspense>
					</div>
				</section>
			</main>
		</div>
	);
}
