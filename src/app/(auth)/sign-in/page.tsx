"use client";

import { Suspense, FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SignInPage() {
	return (
		<Suspense fallback={<LoadingShell />}> 
			<SignInForm />
		</Suspense>
	);
}

function SignInForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const redirectTo = searchParams.get("redirect") ?? "/admin";

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setError(null);
		setLoading(true);

		const res = await fetch("/api/auth/sign-in/email", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email, password, callbackURL: redirectTo })
		});

		if (!res.ok) {
			const body = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
			setError(body.message ?? body.error ?? "Sign in failed. Check your email/password.");
			setLoading(false);
			return;
		}

		router.push(redirectTo);
	};

	const onCreateAdmin = async () => {
		setError(null);
		setLoading(true);

		const res = await fetch("/api/auth/sign-up/email", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email, password, callbackURL: redirectTo })
		});

		if (!res.ok) {
			const body = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
			setError(body.message ?? body.error ?? "Sign up failed. Confirm admin email/password.");
			setLoading(false);
			return;
		}

		router.push(redirectTo);
	};

	return (
		<div className="min-h-screen bg-slate-950 text-slate-50">
			<main className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 py-14">
				<div className="space-y-2 text-center">
					<p className="text-xs uppercase tracking-[0.3em] text-slate-500">Admin access</p>
					<h1 className="text-2xl font-semibold">Sign in</h1>
					<p className="text-sm text-slate-400">
						Only the configured admin email can access the studio.
					</p>
				</div>

				<form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/70 p-6">
					<label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
						Email
						<input
							type="email"
							required
							autoComplete="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-slate-500 focus:outline-none"
						/>
					</label>
					<label className="flex flex-col gap-1 text-sm font-medium text-slate-200">
						Password
						<input
							type="password"
							required
							autoComplete="current-password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-slate-500 focus:outline-none"
						/>
					</label>
					{error && <p className="text-sm text-rose-300">{error}</p>}
					<button
						type="submit"
						disabled={loading}
						className="inline-flex w-full items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-70"
					>
						{loading ? "Working…" : "Sign in"}
					</button>
					<button
						type="button"
						disabled={loading}
						onClick={onCreateAdmin}
						className="inline-flex w-full items-center justify-center rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-800 disabled:opacity-70"
					>
						Create admin account
					</button>
				</form>

				<p className="text-center text-xs text-slate-500">
					Tip: set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in your env, then hit "Create admin account" once to seed.
				</p>
			</main>
		</div>
	);
}

function LoadingShell() {
	return (
		<div className="min-h-screen bg-slate-950 text-slate-50">
			<main className="mx-auto flex w-full max-w-md flex-col gap-4 px-6 py-14">
				<div className="h-6 w-24 animate-pulse rounded bg-slate-800" />
				<div className="h-10 w-full animate-pulse rounded bg-slate-800" />
				<div className="h-10 w-full animate-pulse rounded bg-slate-800" />
			</main>
		</div>
	);
}
