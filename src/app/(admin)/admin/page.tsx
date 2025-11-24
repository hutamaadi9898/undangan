import { getCloudflareContext } from "@opennextjs/cloudflare";
import Link from "next/link";
import type { Env } from "@/types/env";
import { getDb } from "@/lib/db/client";
import { weddings } from "@/lib/db/schema";

export const runtime = "nodejs";

export default async function AdminHome() {
	const { env } = await getCloudflareContext({ async: true });
	const db = await getDb(env as Env);
	const records = await db.select().from(weddings);

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<p className="text-sm text-slate-400">Manage weddings</p>
					<h2 className="text-2xl font-semibold text-white">Weddings</h2>
				</div>
				<Link
					href="/admin/new"
					className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900"
				>
					New wedding
				</Link>
			</div>

			<div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60">
				<table className="min-w-full text-sm text-slate-200">
					<thead className="bg-slate-900/70">
						<tr>
							<th className="px-4 py-3 text-left font-semibold">Title</th>
							<th className="px-4 py-3 text-left font-semibold">Slug</th>
							<th className="px-4 py-3 text-left font-semibold">Date</th>
							<th className="px-4 py-3 text-left font-semibold">Status</th>
							<th className="px-4 py-3 text-left font-semibold">Actions</th>
						</tr>
					</thead>
					<tbody>
						{records.map((wedding) => (
							<tr key={wedding.id} className="border-t border-slate-800/80">
								<td className="px-4 py-3">{wedding.title}</td>
								<td className="px-4 py-3 text-slate-400">{wedding.slug}</td>
								<td className="px-4 py-3 text-slate-300">{wedding.eventDate}</td>
								<td className="px-4 py-3">
									<span
										className={`rounded-full px-3 py-1 text-xs font-semibold ${
											wedding.status === "published"
												? "bg-emerald-500/20 text-emerald-200"
												: "bg-amber-500/20 text-amber-200"
										}`}
									>
										{wedding.status}
									</span>
								</td>
								<td className="px-4 py-3">
									<div className="flex gap-2">
										<Link
											href={`/admin/${wedding.id}/edit`}
											className="text-xs font-semibold text-sky-300 hover:text-sky-200"
										>
											Edit
										</Link>
										<Link
											href={`/admin/${wedding.id}/rsvp`}
											className="text-xs font-semibold text-slate-200 hover:text-white"
										>
											RSVPs
										</Link>
									</div>
								</td>
							</tr>
						))}
						{records.length === 0 && (
							<tr>
								<td className="px-4 py-6 text-slate-400" colSpan={5}>
									No weddings yet. Click “New wedding” to start.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}
