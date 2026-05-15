import { XMLParser } from "fast-xml-parser";

export interface ParsedWaypoint {
	lat: number;
	lng: number;
	elevation?: number;
	name?: string;
	type: "start" | "waypoint" | "summit" | "end";
}

function determineWaypointTypes(waypoints: ParsedWaypoint[]): ParsedWaypoint[] {
	if (waypoints.length === 0) return waypoints;

	const result = waypoints.map((wp, index) => ({
		...wp,
		type: "waypoint" as ParsedWaypoint["type"],
	}));

	// First waypoint is start
	result[0].type = "start";

	// Last waypoint is end (if more than one)
	if (result.length > 1) {
		result[result.length - 1].type = "end";
	}

	// Find highest elevation waypoint as summit (excluding start/end)
	let highestIndex = -1;
	let highestElevation = -Infinity;

	for (let i = 1; i < result.length - 1; i++) {
		const ele = result[i].elevation;
		if (ele !== undefined && ele > highestElevation) {
			highestElevation = ele;
			highestIndex = i;
		}
	}

	// If no elevation data, use middle point as summit
	if (highestIndex === -1 && result.length > 2) {
		highestIndex = Math.floor(result.length / 2);
	}

	if (highestIndex !== -1) {
		result[highestIndex].type = "summit";
	}

	return result;
}

export function parseGpx(xml: string): ParsedWaypoint[] {
	const parser = new XMLParser({
		ignoreAttributes: false,
		attributeNamePrefix: "",
		parseAttributeValue: true,
		numberParseOptions: {
			hex: false,
			leadingZeros: false,
		},
	});

	const parsed = parser.parse(xml);

	if (!parsed || typeof parsed !== "object") {
		throw new Error("Invalid GPX file: could not parse XML");
	}

	const gpx = parsed.gpx;
	if (!gpx) {
		throw new Error("Invalid GPX file: missing <gpx> root element");
	}

	const waypoints: ParsedWaypoint[] = [];

	// Parse <wpt> elements
	const wpts = gpx.wpt;
	if (wpts) {
		const wptArray = Array.isArray(wpts) ? wpts : [wpts];
		for (const wpt of wptArray) {
			const lat = Number(wpt.lat);
			const lon = Number(wpt.lon);
			if (Number.isNaN(lat) || Number.isNaN(lon)) continue;

			waypoints.push({
				lat,
				lng: lon,
				elevation: wpt.ele !== undefined ? Number(wpt.ele) : undefined,
				name: wpt.name !== undefined ? String(wpt.name) : undefined,
				type: "waypoint",
			});
		}
	}

	// Parse <trkpt> elements from tracks
	const trks = gpx.trk;
	if (trks) {
		const trkArray = Array.isArray(trks) ? trks : [trks];
		for (const trk of trkArray) {
			const trksegs = trk.trkseg;
			if (!trksegs) continue;

			const segArray = Array.isArray(trksegs) ? trksegs : [trksegs];
			for (const seg of segArray) {
				const trkpts = seg.trkpt;
				if (!trkpts) continue;

				const ptArray = Array.isArray(trkpts) ? trkpts : [trkpts];
				for (const pt of ptArray) {
					const lat = Number(pt.lat);
					const lon = Number(pt.lon);
					if (Number.isNaN(lat) || Number.isNaN(lon)) continue;

					waypoints.push({
						lat,
						lng: lon,
						elevation: pt.ele !== undefined ? Number(pt.ele) : undefined,
						name: pt.name !== undefined ? String(pt.name) : undefined,
						type: "waypoint",
					});
				}
			}
		}
	}

	// Parse <rtept> elements from routes
	const rtes = gpx.rte;
	if (rtes) {
		const rteArray = Array.isArray(rtes) ? rtes : [rtes];
		for (const rte of rteArray) {
			const rtepts = rte.rtept;
			if (!rtepts) continue;

			const ptArray = Array.isArray(rtepts) ? rtepts : [rtepts];
			for (const pt of ptArray) {
				const lat = Number(pt.lat);
				const lon = Number(pt.lon);
				if (Number.isNaN(lat) || Number.isNaN(lon)) continue;

				waypoints.push({
					lat,
					lng: lon,
					elevation: pt.ele !== undefined ? Number(pt.ele) : undefined,
					name: pt.name !== undefined ? String(pt.name) : undefined,
					type: "waypoint",
				});
			}
		}
	}

	if (waypoints.length === 0) {
		throw new Error("No valid waypoints found in GPX file");
	}

	return determineWaypointTypes(waypoints);
}
