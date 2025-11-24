"use client";

import { FormEvent, useState } from "react";

type Props = {
	slug: string;
};

type FormState =
	| { status: "idle" }
	| { status: "submitting" }
	| { status: "success" }
	| { status: "error"; message: string };

const RsvpForm = ({ slug }: Props) => {
	const [state, setState] = useState<FormState>({ status: "idle" });

	const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);
		setState({ status: "submitting" });
		const payload = {
			slug,
			guestName: formData.get("guestName"),
			contact: formData.get("contact"),
			attending: formData.get("attending"),
			paxCount: Number(formData.get("paxCount") ?? 1),
			message: formData.get("message"),
			honeypot: formData.get("website") // anti-bot field, should stay empty
		};

		const res = await fetch("/api/rsvp", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(payload)
		});

		if (!res.ok) {
			const body = (await res.json().catch(() => ({}))) as { error?: string };
			setState({ status: "error", message: body.error ?? "Something went wrong" });
			return;
		}

		setState({ status: "success" });
	};

	return (
		<form onSubmit={onSubmit} className="space-y-4">
			<div className="grid gap-3 sm:grid-cols-2">
				<label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
					Guest name
					<input
						name="guestName"
						required
						className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
					/>
				</label>
				<label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
					Phone or email
					<input
						name="contact"
						type="text"
						required
						className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
					/>
				</label>
			</div>

			<div className="grid gap-3 sm:grid-cols-2">
				<label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
					Attending?
					<select
						name="attending"
						required
						className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
						defaultValue="yes"
					>
						<option value="yes">Yes</option>
						<option value="no">No</option>
						<option value="maybe">Maybe</option>
					</select>
				</label>
				<label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
					Number of guests
					<input
						name="paxCount"
						type="number"
						min={1}
						max={20}
						defaultValue={1}
						className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
					/>
				</label>
			</div>

			<label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
				Message (optional)
				<textarea
					name="message"
					rows={3}
					className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
				/>
			</label>

			{/* Honeypot field to catch basic bots */}
			<label className="hidden">
				Leave this field empty
				<input name="website" type="text" autoComplete="off" tabIndex={-1} />
			</label>

			<button
				type="submit"
				disabled={state.status === "submitting"}
				className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
			>
				{state.status === "submitting" ? "Sending..." : "Submit RSVP"}
			</button>

			{state.status === "error" && <p className="text-sm text-red-600">{state.message}</p>}
			{state.status === "success" && (
				<p className="text-sm text-green-700">Thanks! Your RSVP has been recorded.</p>
			)}
		</form>
	);
};

export default RsvpForm;
