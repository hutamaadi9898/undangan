import { getCloudflareContext } from "@opennextjs/cloudflare";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Env } from "@/types/env";
import { getDb } from "@/lib/db/client";
import { weddings } from "@/lib/db/schema";

export const runtime = "nodejs";

const updateSchema = z.object({
	title: z.string().min(3).max(160),
	slug: z.string().min(3).max(80),
	coupleNames: z.string().min(3).max(160),
	eventDate: z.string().min(3).max(80),
	status: z.enum(["draft", "published"])
});

const updateWedding = async (id: string, formData: FormData) => {
	"use server";
	const parsed = updateSchema.safeParse({
		title: formData.get("title"),
		slug: formData.get("slug"),
		coupleNames: formData.get("coupleNames"),
		eventDate: formData.get("eventDate"),
		status: formData.get("status")
	});

	if (!parsed.success) throw new Error("Invalid input");

	const { env } = await getCloudflareContext({ async: true });
	const db = await getDb(env as Env);

	await db
		.update(weddings)
		.set({
			title: parsed.data.title,
			slug: parsed.data.slug,
			coupleNames: parsed.data.coupleNames,
			eventDate: parsed.data.eventDate,
			status: parsed.data.status
		})
		.where(eq(weddings.id, id));

	revalidatePath("/admin");
	revalidatePath(`/admin/${id}/edit`);
};

type PageProps = { params?: Promise<{ id?: string | string[] }> };

export default async function EditWeddingPage({ params }: PageProps) {
	const resolvedParams = (await params) ?? {};
	const weddingId = Array.isArray(resolvedParams.id) ? resolvedParams.id[0] : resolvedParams.id;

	if (!weddingId) {
		redirect("/admin");
	}

	const { env } = await getCloudflareContext({ async: true });
	const db = await getDb(env as Env);

	const wedding = await db.query.weddings.findFirst({
		where: eq(weddings.id, weddingId)
	});

	if (!wedding) {
		redirect("/admin");
	}

	const action = updateWedding.bind(null, wedding.id);

	return (
		<div className="space-y-6">
			<div>
				<p className="text-sm text-slate-400">Edit wedding</p>
				<h2 className="text-2xl font-semibold text-white">{wedding.title}</h2>
			</div>
			<form action={action} className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-6">
				<label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
					Title
					<input
						name="title"
						defaultValue={wedding.title}
						required
						className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-slate-500 focus:outline-none"
					/>
				</label>
				<label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
					Slug
					<input
						name="slug"
						defaultValue={wedding.slug}
						required
						className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-slate-500 focus:outline-none"
					/>
				</label>
				<label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
					Couple names
					<input
						name="coupleNames"
						defaultValue={wedding.coupleNames}
						required
						className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-slate-500 focus:outline-none"
					/>
				</label>
				<label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
					Event date
					<input
						name="eventDate"
						defaultValue={wedding.eventDate}
						required
						className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-slate-500 focus:outline-none"
					/>
				</label>
				<label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
					Status
					<select
						name="status"
						defaultValue={wedding.status}
						className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-slate-500 focus:outline-none"
					>
						<option value="draft">Draft</option>
						<option value="published">Published</option>
					</select>
				</label>
				<button
					type="submit"
					className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900"
				>
					Save changes
				</button>
			</form>
		</div>
	);
}
