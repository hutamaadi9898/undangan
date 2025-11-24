import { getAuth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const runtime = "nodejs";

const handlersPromise = getAuth().then((auth) => toNextJsHandler(auth));

export async function GET(request: Request) {
	const handlers = await handlersPromise;
	return handlers.GET(request);
}

export async function POST(request: Request) {
	const handlers = await handlersPromise;
	return handlers.POST(request);
}
