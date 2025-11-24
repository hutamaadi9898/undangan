import { getCloudflareContext } from "@opennextjs/cloudflare";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Env } from "@/types/env";
import { getDb } from "@/lib/db/client";
import { weddings } from "@/lib/db/schema";

export const runtime = "nodejs";

const formSchema = z.object({
	title: z.string().min(3).max(160),
	slug: z.string().min(3).max(80),
	coupleNames: z.string().min(3).max(160),
	eventDate: z.string().min(3).max(80)
});

const createWedding = async (formData: FormData) => {
	"use server";
	const parsed = formSchema.safeParse({
		title: formData.get("title"),
		slug: formData.get("slug"),
		coupleNames: formData.get("coupleNames"),
		eventDate: formData.get("eventDate")
	});

	if (!parsed.success) {
		throw new Error("Invalid input");
	}

	const { env } = await getCloudflareContext({ async: true });
	const db = await getDb(env as Env);
	const id = crypto.randomUUID();

	await db.insert(weddings).values({
		id,
		title: parsed.data.title,
		slug: parsed.data.slug,
		coupleNames: parsed.data.coupleNames,
		eventDate: parsed.data.eventDate,
		status: "draft"
	});

	revalidatePath("/admin");
	redirect(`/admin/${id}/edit`);
};

export default function NewWeddingPage() {
	return (
		<div className="space-y-6">
			<div>
				<p className="text-sm text-slate-400">Create a wedding</p>
				<h2 className="text-2xl font-semibold text-white">New wedding</h2>
			</div>
			<form action={createWedding} className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-6">
				<label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
					Title
					<input
						name="title"
						required
						className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-slate-500 focus:outline-none"
					/>
				</label>
				<label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
					Slug
					<input
						name="slug"
						required
						className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-slate-500 focus:outline-none"
						placeholder="john-and-jane"
					/>
				</label>
				<label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
					Couple names
					<input
						name="coupleNames"
						required
						className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-slate-500 focus:outline-none"
						placeholder="John & Jane"
					/>
				</label>
				<label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
					Event date
					<input
						name="eventDate"
						required
						className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-slate-500 focus:outline-none"
						placeholder="June 20, 2026"
					/>
				</label>
				<button
					type="submit"
					className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900"
				>
					Create
				</button>
			</form>
		</div>
	);
}
