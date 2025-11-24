import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { getServerSession } from "@/lib/auth";

export const runtime = "nodejs";

type Props = {
	children: ReactNode;
};

export default async function AdminLayout({ children }: Props) {
	const headerList = await headers();
	const session = await getServerSession(headerList);

	if (!session?.user) {
		// Better Auth exposes sign-in endpoints under /api/auth; redirect to the email/password flow.
		redirect("/api/auth/sign-in/email?redirect=/admin");
	}

	return (
		<div className="min-h-screen bg-slate-950 text-slate-50">
			<header className="border-b border-slate-800 bg-slate-900/80 px-6 py-4">
				<div className="mx-auto flex w-full max-w-5xl items-center justify-between">
					<div>
						<p className="text-xs uppercase tracking-[0.2em] text-slate-400">Admin</p>
						<h1 className="text-lg font-semibold">Wedding Studio</h1>
					</div>
					<div className="text-sm text-slate-300">
						{session.user.email ?? session.user.id}
					</div>
				</div>
			</header>
			<main className="mx-auto w-full max-w-5xl px-6 py-8">{children}</main>
		</div>
	);
}
