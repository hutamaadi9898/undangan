import type { Env } from "@/types/env";

const DEFAULT_MAX_BYTES = 5 * 1024 * 1024; // 5MB per upload
const DEFAULT_TYPES = ["image/jpeg", "image/png", "image/webp"];

type PresignInput = {
	weddingId: string;
	fileName?: string;
	contentType: string;
	contentLength?: number;
	maxBytes?: number;
	allowedTypes?: string[];
};

export type PresignedUpload = {
	key: string;
	url: string;
	headers: Record<string, string>;
};

export const createPresignedUpload = async (env: Env, input: PresignInput): Promise<PresignedUpload> => {
	const maxBytes = input.maxBytes ?? DEFAULT_MAX_BYTES;
	const allowed = input.allowedTypes ?? DEFAULT_TYPES;

	if (!allowed.includes(input.contentType)) {
		throw new Error("Unsupported file type");
	}

	if (input.contentLength && input.contentLength > maxBytes) {
		throw new Error("File too large");
	}

	const key = [
		"weddings",
		input.weddingId,
		"uploads",
		`${crypto.randomUUID()}-${input.fileName ?? "photo"}`
	].join("/");

	const presigned = await env.R2_BUCKET.createPresignedUrl({
		key,
		method: "PUT",
		expiresIn: 60,
		contentType: input.contentType
	});

	return {
		key,
		url: presigned.url.toString(),
		headers: presigned.headers
	};
};
