import { XMLParser } from "fast-xml-parser";
import type { ParsedWaypoint } from "./gpx";
import { createAutoWaypoints } from "./gpx";

export interface KmlParseResult {
	waypoints: ParsedWaypoint[];
	trackPoints: [number, number][];
}

function parseCoordinateToken(token: string): [number, number, number?] | null {
	const trimmed = token.trim();
	if (!trimmed) return null;

	const parts = trimmed.split(",").map((s) => s.trim()).filter((s) => s !== "");
	if (parts.length < 2) return null;

	const lon = Number(parts[0]);
	const lat = Number(parts[1]);
	const ele = parts.length >= 3 ? Number(parts[2]) : undefined;

	if (Number.isNaN(lat) || Number.isNaN(lon)) return null;

	return [lat, lon, Number.isNaN(Number(ele)) ? undefined : ele];
}

function parseCoordinates(
	coordString: string,
): Array<[number, number, number?]> {
	const points: Array<[number, number, number?]> = [];
	const trimmed = coordString.trim();
	if (!trimmed) return points;

	const lines = trimmed.split("\n");

	for (const line of lines) {
		const lineTrimmed = line.trim();
		if (!lineTrimmed) continue;

		if (lineTrimmed.includes(",")) {
			// Formato KML estándar: lon,lat,ele separados por espacios
			const tokens = lineTrimmed.split(/\s+/);
			for (const token of tokens) {
				const coord = parseCoordinateToken(token);
				if (coord) points.push(coord);
			}
		} else {
			// Formato sin comas: "lon lat ele" o "lon lat" por línea
			// También soporta múltiples coordenadas sin comas en una línea
			const parts = lineTrimmed.split(/\s+/).filter((s) => s !== "");
			if (parts.length >= 2) {
				if (parts.length === 2) {
					const lon = Number(parts[0]);
					const lat = Number(parts[1]);
					if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
						points.push([lat, lon, undefined]);
					}
				} else if (parts.length === 3) {
					const lon = Number(parts[0]);
					const lat = Number(parts[1]);
					const ele = Number(parts[2]);
					if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
						points.push([lat, lon, Number.isNaN(Number(ele)) ? undefined : ele]);
					}
				} else if (parts.length % 3 === 0) {
					// Múltiples: lon lat ele lon lat ele ...
					for (let i = 0; i < parts.length; i += 3) {
						const lon = Number(parts[i]);
						const lat = Number(parts[i + 1]);
						const ele = Number(parts[i + 2]);
						if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
							points.push([lat, lon, Number.isNaN(Number(ele)) ? undefined : ele]);
						}
					}
				} else if (parts.length % 2 === 0) {
					// Múltiples: lon lat lon lat ...
					for (let i = 0; i < parts.length; i += 2) {
						const lon = Number(parts[i]);
						const lat = Number(parts[i + 1]);
						if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
							points.push([lat, lon, undefined]);
						}
					}
				} else {
					// Fallback: tomar los primeros 2 o 3
					const lon = Number(parts[0]);
					const lat = Number(parts[1]);
					const ele = parts.length >= 3 ? Number(parts[2]) : undefined;
					if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
						points.push([lat, lon, Number.isNaN(Number(ele)) ? undefined : ele]);
					}
				}
			}
		}
	}

	return points;
}

function determineWaypointTypes(waypoints: ParsedWaypoint[]): ParsedWaypoint[] {
	if (waypoints.length === 0) return waypoints;

	const result = waypoints.map((wp) => ({
		...wp,
		type: "waypoint" as ParsedWaypoint["type"],
	}));

	result[0].type = "start";
	if (!result[0].name) result[0].name = "Inicio";

	if (result.length > 1) {
		result[result.length - 1].type = "end";
		if (!result[result.length - 1].name)
			result[result.length - 1].name = "Fin";
	}

	let highestIndex = -1;
	let highestElevation = -Infinity;

	for (let i = 1; i < result.length - 1; i++) {
		const ele = result[i].elevation;
		if (ele !== undefined && ele > highestElevation) {
			highestElevation = ele;
			highestIndex = i;
		}
	}

	if (highestIndex === -1 && result.length > 2) {
		highestIndex = Math.floor(result.length / 2);
	}

	if (highestIndex !== -1) {
		result[highestIndex].type = "summit";
		if (!result[highestIndex].name) result[highestIndex].name = "Cumbre";
	}

	return result;
}

function collectPlacemarks(node: unknown): Array<Record<string, unknown>> {
	const placemarks: Array<Record<string, unknown>> = [];

	function traverse(obj: unknown) {
		if (!obj || typeof obj !== "object") return;

		if (Array.isArray(obj)) {
			for (const item of obj) traverse(item);
			return;
		}

		const record = obj as Record<string, unknown>;

		if (record.Placemark) {
			if (Array.isArray(record.Placemark)) {
				for (const p of record.Placemark) {
					if (p && typeof p === "object") {
						placemarks.push(p as Record<string, unknown>);
					}
				}
			} else if (typeof record.Placemark === "object") {
				placemarks.push(record.Placemark as Record<string, unknown>);
			}
		}

		for (const key of Object.keys(record)) {
			if (key !== "Placemark") {
				const value = record[key];
				if (value && typeof value === "object") {
					traverse(value);
				}
			}
		}
	}

	traverse(node);
	return placemarks;
}

function extractFromPlacemark(placemark: unknown): {
	waypoints: ParsedWaypoint[];
	rawTrackPoints: Array<{ lat: number; lng: number; elevation?: number }>;
} {
	const waypoints: ParsedWaypoint[] = [];
	const rawTrackPoints: Array<{ lat: number; lng: number; elevation?: number }> =
		[];

	if (!placemark || typeof placemark !== "object") {
		return { waypoints, rawTrackPoints };
	}

	const p = placemark as Record<string, unknown>;
	const name = p.name !== undefined ? String(p.name) : undefined;

	function processPoint(node: Record<string, unknown>) {
		if (node.coordinates) {
			const coords = parseCoordinates(String(node.coordinates));
			for (const [lat, lng, ele] of coords) {
				// Solo agregar como waypoint si el Placemark tiene nombre
				if (name) {
					waypoints.push({
						lat,
						lng,
						elevation: ele,
						name,
						type: "waypoint",
					});
				}
			}
		}
	}

	function processLineString(node: Record<string, unknown>) {
		if (node.coordinates) {
			const coords = parseCoordinates(String(node.coordinates));
			for (const [lat, lng, ele] of coords) {
				rawTrackPoints.push({ lat, lng, elevation: ele });
			}
		}
	}

	function processTrack(node: Record<string, unknown>) {
		if (node.coord) {
			const coords = Array.isArray(node.coord) ? node.coord : [node.coord];
			for (const coordStr of coords) {
				const parsed = parseCoordinates(String(coordStr));
				for (const [lat, lng, ele] of parsed) {
					rawTrackPoints.push({ lat, lng, elevation: ele });
				}
			}
		}
	}

	function processMultiGeometry(node: Record<string, unknown>) {
		if (node.Point) {
			const points = Array.isArray(node.Point) ? node.Point : [node.Point];
			for (const pt of points) {
				if (typeof pt === "object" && pt !== null) {
					processPoint(pt as Record<string, unknown>);
				}
			}
		}
		if (node.LineString) {
			const lines = Array.isArray(node.LineString)
				? node.LineString
				: [node.LineString];
			for (const ls of lines) {
				if (typeof ls === "object" && ls !== null) {
					processLineString(ls as Record<string, unknown>);
				}
			}
		}
		if (node.Track) {
			const tracks = Array.isArray(node.Track) ? node.Track : [node.Track];
			for (const t of tracks) {
				if (typeof t === "object" && t !== null) {
					processTrack(t as Record<string, unknown>);
				}
			}
		}
		if (node.MultiGeometry) {
			const mgs = Array.isArray(node.MultiGeometry)
				? node.MultiGeometry
				: [node.MultiGeometry];
			for (const mg of mgs) {
				if (typeof mg === "object" && mg !== null) {
					processMultiGeometry(mg as Record<string, unknown>);
				}
			}
		}
	}

	// Procesar directamente en el Placemark
	if (p.Point) {
		const points = Array.isArray(p.Point) ? p.Point : [p.Point];
		for (const pt of points) {
			if (typeof pt === "object" && pt !== null) {
				processPoint(pt as Record<string, unknown>);
			}
		}
	}

	if (p.LineString) {
		const lines = Array.isArray(p.LineString) ? p.LineString : [p.LineString];
		for (const ls of lines) {
			if (typeof ls === "object" && ls !== null) {
				processLineString(ls as Record<string, unknown>);
			}
		}
	}

	if (p.Track) {
		const tracks = Array.isArray(p.Track) ? p.Track : [p.Track];
		for (const t of tracks) {
			if (typeof t === "object" && t !== null) {
				processTrack(t as Record<string, unknown>);
			}
		}
	}

	if (p.MultiGeometry) {
		const mgs = Array.isArray(p.MultiGeometry)
			? p.MultiGeometry
			: [p.MultiGeometry];
		for (const mg of mgs) {
			if (typeof mg === "object" && mg !== null) {
				processMultiGeometry(mg as Record<string, unknown>);
			}
		}
	}

	return { waypoints, rawTrackPoints };
}

export function parseKml(xml: string): KmlParseResult {
	const parser = new XMLParser({
		ignoreAttributes: false,
		attributeNamePrefix: "",
		parseAttributeValue: false,
		removeNSPrefix: true,
	});

	const parsed = parser.parse(xml);

	if (!parsed || typeof parsed !== "object") {
		throw new Error("Invalid KML file: could not parse XML");
	}

	const kml = (parsed as Record<string, unknown>).kml;
	if (!kml) {
		throw new Error("Invalid KML file: missing <kml> root element");
	}

	const placemarks = collectPlacemarks(kml);

	const explicitWaypoints: ParsedWaypoint[] = [];
	let rawTrackPoints: Array<{ lat: number; lng: number; elevation?: number }> =
		[];

	for (const placemark of placemarks) {
		const { waypoints, rawTrackPoints: pts } =
			extractFromPlacemark(placemark);
		explicitWaypoints.push(...waypoints);
		rawTrackPoints = rawTrackPoints.concat(pts);
	}

	const trackPoints: [number, number][] = rawTrackPoints.map((pt) => [
		pt.lat,
		pt.lng,
	]);

	let finalWaypoints: ParsedWaypoint[];

	if (explicitWaypoints.length > 0) {
		// Hay waypoints explícitos: usarlos y NO generar waypoints del track
		finalWaypoints = determineWaypointTypes(explicitWaypoints);
	} else if (rawTrackPoints.length > 0) {
		// No hay waypoints explícitos, pero hay track: crear automáticos
		finalWaypoints = createAutoWaypoints(rawTrackPoints);
	} else {
		throw new Error(
			"No valid waypoints or track points found in KML file",
		);
	}

	return {
		waypoints: finalWaypoints,
		trackPoints,
	};
}
