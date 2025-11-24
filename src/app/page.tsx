export default function Home() {
	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50">
			<main className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 py-16">
				<section className="space-y-4">
					<p className="text-sm uppercase tracking-[0.3em] text-slate-400">Cloudflare Workers</p>
					<h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
						Wedding invitations with admin studio + public pages
					</h1>
					<p className="text-lg text-slate-200">
						Next.js 15 on OpenNext for Cloudflare. Admin at <code className="font-mono">/admin</code>, public invites at
						<code className="font-mono"> /&lt;slug&gt;</code>, RSVPs via server actions + D1.
					</p>
					<div className="flex flex-wrap gap-3">
						<a
							className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900"
							href="/admin"
						>
							Open Admin
						</a>
						<a
							className="inline-flex items-center rounded-lg border border-slate-500 px-4 py-2 text-sm font-semibold text-slate-100"
							href="/api/auth/sign-in/email"
						>
							Sign in
						</a>
					</div>
				</section>
				<section className="grid gap-4 sm:grid-cols-2">
					<div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
						<p className="text-sm text-slate-400">Data</p>
						<p className="text-base font-semibold text-white">Cloudflare D1 + Drizzle</p>
					</div>
					<div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
						<p className="text-sm text-slate-400">Auth</p>
						<p className="text-base font-semibold text-white">Better Auth on Workers</p>
					</div>
				</section>
			</main>
		</div>
	);
}
