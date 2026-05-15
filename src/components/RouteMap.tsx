import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { ParsedWaypoint } from "#/lib/gpx";

interface RouteMapProps {
	waypoints: ParsedWaypoint[];
	trackPoints?: [number, number][];
	editable?: boolean;
	height?: string;
	onWaypointMove?: (index: number, lat: number, lng: number) => void;
}

const waypointColors: Record<string, string> = {
	start: "#22c55e",
	waypoint: "#6b7280",
	summit: "#ef4444",
	end: "#3b82f6",
};

export function RouteMap({
	waypoints,
	trackPoints,
	editable = false,
	height = "400px",
	onWaypointMove,
}: RouteMapProps) {
	const mapRef = useRef<HTMLDivElement>(null);
	const leafletMap = useRef<L.Map | null>(null);
	const markersRef = useRef<L.Marker[]>([]);
	const polylineRef = useRef<L.Polyline | null>(null);

	useEffect(() => {
		if (!mapRef.current) return;

		// Initialize map
		const map = L.map(mapRef.current);
		leafletMap.current = map;

		L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
			attribution:
				'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
			maxZoom: 19,
		}).addTo(map);

		return () => {
			map.remove();
			leafletMap.current = null;
		};
	}, []);

	useEffect(() => {
		const map = leafletMap.current;
		if (!map) return;

		// Clear existing markers
		for (const marker of markersRef.current) {
			marker.remove();
		}
		markersRef.current = [];

		// Clear existing polyline
		if (polylineRef.current) {
			polylineRef.current.remove();
			polylineRef.current = null;
		}

		if (waypoints.length === 0 && (!trackPoints || trackPoints.length === 0)) {
			return;
		}

		const bounds = L.latLngBounds([]);

		// Add track polyline
		const pointsToDraw: [number, number][] =
			trackPoints && trackPoints.length > 0
				? trackPoints
				: waypoints.map((wp) => [wp.lat, wp.lng] as [number, number]);

		if (pointsToDraw.length > 0) {
			// Simplify if too many points
			let simplifiedPoints = pointsToDraw;
			if (pointsToDraw.length > 500) {
				const skip = Math.ceil(pointsToDraw.length / 500);
				simplifiedPoints = pointsToDraw.filter((_, i) => i % skip === 0);
			}

			polylineRef.current = L.polyline(simplifiedPoints, {
				color: "#2563eb",
				weight: 4,
				opacity: 0.85,
			}).addTo(map);

			for (const pt of simplifiedPoints) {
				bounds.extend(pt);
			}
		}

		// Add waypoint markers
		for (let i = 0; i < waypoints.length; i++) {
			const wp = waypoints[i];
			const color = waypointColors[wp.type] || waypointColors.waypoint;

			const marker = L.circleMarker([wp.lat, wp.lng], {
				radius: wp.type === "summit" ? 10 : 7,
				fillColor: color,
				color: "#fff",
				weight: 2,
				opacity: 1,
				fillOpacity: 0.9,
			}).addTo(map);

			const popupContent = `
        <div style="font-family: system-ui, sans-serif; font-size: 13px;">
          <strong>${wp.name || wp.type}</strong>
          ${wp.elevation ? `<br/>${wp.elevation} m` : ""}
        </div>
      `;
			marker.bindPopup(popupContent);

			if (editable && onWaypointMove) {
				marker.on("dragend", (e) => {
					const latLng = e.target.getLatLng();
					onWaypointMove(i, latLng.lat, latLng.lng);
				});
			}

			markersRef.current.push(marker);
			bounds.extend([wp.lat, wp.lng]);
		}

		if (bounds.isValid()) {
			map.fitBounds(bounds, { padding: [20, 20], maxZoom: 15 });
		}
	}, [waypoints, trackPoints, editable, onWaypointMove]);

	return (
		<div ref={mapRef} style={{ height, width: "100%", borderRadius: "8px" }} />
	);
}
