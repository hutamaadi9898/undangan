declare global {
	interface R2Bucket {
		createPresignedUrl(input: {
			key: string;
			method: "PUT" | "GET";
			expiresIn?: number;
			expiration?: number;
			contentType?: string;
			customMetadata?: Record<string, string>;
		}): Promise<{
			url: URL;
			method: string;
			headers: Record<string, string>;
		}>;
	}
}

export {};
