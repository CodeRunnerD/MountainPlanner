import { supabase } from "./supabase";

const ROUTE_GPX_BUCKET = "route-gpx";

export async function uploadRouteGpx(
	file: File,
	routeId: string,
): Promise<{ path: string; error: Error | null }> {
	const extension = file.name.split(".").pop()?.toLowerCase() || "gpx";
	const path = `${routeId}/${Date.now()}.${extension}`;

	const { error } = await supabase.storage
		.from(ROUTE_GPX_BUCKET)
		.upload(path, file, {
			cacheControl: "3600",
			upsert: false,
		});

	if (error) {
		return { path: "", error: new Error(error.message) };
	}

	return { path, error: null };
}

export function getGpxPublicUrl(path: string): string {
	const { data } = supabase.storage.from(ROUTE_GPX_BUCKET).getPublicUrl(path);
	return data.publicUrl;
}

export async function downloadRouteFile(path: string): Promise<Blob> {
	const { data, error } = await supabase.storage
		.from(ROUTE_GPX_BUCKET)
		.download(path);
	if (error) {
		throw new Error(error.message);
	}
	if (!data) {
		throw new Error("No data received from storage");
	}
	return data;
}
