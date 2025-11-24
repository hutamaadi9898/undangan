import { getCloudflareContext } from "@opennextjs/cloudflare";
import { desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import type { Env } from "@/types/env";
import { getDb } from "@/lib/db/client";
import { rsvps, weddings } from "@/lib/db/schema";

export const runtime = "nodejs";

type PageProps = { params?: Promise<{ id?: string | string[] }> };

export default async function RsvpDashboard({ params }: PageProps) {
	const resolvedParams = (await params) ?? {};
	const weddingId = Array.isArray(resolvedParams.id) ? resolvedParams.id[0] : resolvedParams.id;

	if (!weddingId) return notFound();

	const { env } = await getCloudflareContext({ async: true });
	const db = await getDb(env as Env);

	const wedding = await db.query.weddings.findFirst({
		where: eq(weddings.id, weddingId)
	});

	if (!wedding) return notFound();

	const responses = await db.select().from(rsvps).where(eq(rsvps.weddingId, weddingId)).orderBy(desc(rsvps.createdAt));

	return (
		<div className="space-y-6">
			<div>
				<p className="text-sm text-slate-400">RSVPs</p>
				<h2 className="text-2xl font-semibold text-white">{wedding.title}</h2>
			</div>
			<div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60">
				<table className="min-w-full text-sm text-slate-200">
					<thead className="bg-slate-900/70">
						<tr>
							<th className="px-4 py-3 text-left font-semibold">Guest</th>
							<th className="px-4 py-3 text-left font-semibold">Contact</th>
							<th className="px-4 py-3 text-left font-semibold">Attending</th>
							<th className="px-4 py-3 text-left font-semibold">Pax</th>
							<th className="px-4 py-3 text-left font-semibold">Message</th>
							<th className="px-4 py-3 text-left font-semibold">Created</th>
						</tr>
					</thead>
					<tbody>
						{responses.map((entry) => (
							<tr key={entry.id} className="border-t border-slate-800/80">
								<td className="px-4 py-3">{entry.guestName}</td>
								<td className="px-4 py-3 text-slate-300">{entry.contact}</td>
								<td className="px-4 py-3">
									<span
										className={`rounded-full px-3 py-1 text-xs font-semibold ${
											entry.attending === "yes"
												? "bg-emerald-500/20 text-emerald-200"
												: entry.attending === "maybe"
													? "bg-amber-500/20 text-amber-200"
													: "bg-rose-500/20 text-rose-200"
										}`}
									>
										{entry.attending}
									</span>
								</td>
								<td className="px-4 py-3">{entry.paxCount}</td>
								<td className="px-4 py-3 text-slate-300">{entry.message ?? "—"}</td>
								<td className="px-4 py-3 text-slate-400">
									{new Date(entry.createdAt).toLocaleString()}
								</td>
							</tr>
						))}
						{responses.length === 0 && (
							<tr>
								<td className="px-4 py-6 text-slate-400" colSpan={6}>
									No RSVPs yet.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}
