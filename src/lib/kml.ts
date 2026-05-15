import { XMLParser } from "fast-xml-parser";
import type { ParsedWaypoint } from "./gpx";

export interface ParsedTrack {
	points: [lat: number, lng: number, ele?: number][];
}

interface KmlParsedResult {
	waypoints: ParsedWaypoint[];
	track?: ParsedTrack;
}

function parseCoordinates(
	coordString: string,
): Array<[number, number, number?]> {
	const points: Array<[number, number, number?]> = [];
	const lines = coordString.trim().split(/\s+/);

	for (const line of lines) {
		const parts = line.split(",").map((s) => s.trim());
		if (parts.length < 2) continue;

		const lon = Number(parts[0]);
		const lat = Number(parts[1]);
		const ele = parts.length >= 3 ? Number(parts[2]) : undefined;

		if (Number.isNaN(lat) || Number.isNaN(lon)) continue;

		points.push([lat, lon, Number.isNaN(Number(ele)) ? undefined : ele]);
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
	if (result.length > 1) {
		result[result.length - 1].type = "end";
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
	}

	return result;
}

export function parseKml(xml: string): KmlParsedResult {
	const parser = new XMLParser({
		ignoreAttributes: false,
		attributeNamePrefix: "",
		parseAttributeValue: false,
	});

	const parsed = parser.parse(xml);

	if (!parsed || typeof parsed !== "object") {
		throw new Error("Invalid KML file: could not parse XML");
	}

	const kml = parsed.kml;
	if (!kml) {
		throw new Error("Invalid KML file: missing <kml> root element");
	}

	const waypoints: ParsedWaypoint[] = [];
	let trackPoints: [number, number, number?][] = [];

	// Navigate through Document -> Folder -> Placemark or Document -> Placemark
	const document = kml.Document;
	if (!document) {
		throw new Error("Invalid KML file: missing <Document> element");
	}

	const folders = document.Folder
		? Array.isArray(document.Folder)
			? document.Folder
			: [document.Folder]
		: [document];

	for (const folder of folders) {
		const placemarks = folder.Placemark;
		if (!placemarks) continue;

		const placemarkArray = Array.isArray(placemarks)
			? placemarks
			: [placemarks];

		for (const placemark of placemarkArray) {
			if (!placemark) continue;

			const name =
				placemark.name !== undefined ? String(placemark.name) : undefined;

			// Parse Point
			if (placemark.Point && placemark.Point.coordinates) {
				const coords = parseCoordinates(String(placemark.Point.coordinates));
				for (const [lat, lon, ele] of coords) {
					waypoints.push({
						lat,
						lng: lon,
						elevation: ele,
						name,
						type: "waypoint",
					});
				}
			}

			// Parse LineString
			if (placemark.LineString && placemark.LineString.coordinates) {
				const coords = parseCoordinates(
					String(placemark.LineString.coordinates),
				);
				trackPoints = trackPoints.concat(coords);

				// Add linestring start/end as waypoints if no explicit points
				if (coords.length > 0) {
					waypoints.push({
						lat: coords[0][0],
						lng: coords[0][1],
						elevation: coords[0][2],
						name: name ? `${name} (inicio)` : undefined,
						type: "waypoint",
					});

					if (coords.length > 1) {
						waypoints.push({
							lat: coords[coords.length - 1][0],
							lng: coords[coords.length - 1][1],
							elevation: coords[coords.length - 1][2],
							name: name ? `${name} (fin)` : undefined,
							type: "waypoint",
						});
					}
				}
			}
		}
	}

	if (waypoints.length === 0 && trackPoints.length === 0) {
		throw new Error("No valid waypoints or track points found in KML file");
	}

	const result: KmlParsedResult = {
		waypoints: determineWaypointTypes(waypoints),
	};

	if (trackPoints.length > 0) {
		result.track = { points: trackPoints };
	}

	return result;
}
