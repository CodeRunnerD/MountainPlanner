import { describe, it, expect } from "vitest";
import { parseGpx } from "../gpx";

describe("parseGpx", () => {
	it("parses valid GPX with waypoints only", () => {
		const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1">
  <wpt lat="4.65" lon="-74.05">
    <ele>2500</ele>
    <name>Start Point</name>
  </wpt>
  <wpt lat="4.66" lon="-74.06">
    <ele>3000</ele>
    <name>Summit</name>
  </wpt>
  <wpt lat="4.67" lon="-74.07">
    <ele>2500</ele>
    <name>End Point</name>
  </wpt>
</gpx>`;

		const result = parseGpx(gpx);
		expect(result.waypoints).toHaveLength(3);
		expect(result.waypoints[0].lat).toBe(4.65);
		expect(result.waypoints[0].lng).toBe(-74.05);
		expect(result.waypoints[0].elevation).toBe(2500);
		expect(result.waypoints[0].name).toBe("Start Point");
		expect(result.waypoints[0].type).toBe("start");

		expect(result.waypoints[1].type).toBe("summit");
		expect(result.waypoints[2].type).toBe("end");
		expect(result.trackPoints).toHaveLength(0);
	});

	it("parses valid GPX with track points only (creates auto waypoints)", () => {
		const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1">
  <trk>
    <trkseg>
      <trkpt lat="4.65" lon="-74.05">
        <ele>2500</ele>
      </trkpt>
      <trkpt lat="4.66" lon="-74.06">
        <ele>3000</ele>
      </trkpt>
      <trkpt lat="4.67" lon="-74.07">
        <ele>2500</ele>
      </trkpt>
    </trkseg>
  </trk>
</gpx>`;

		const result = parseGpx(gpx);
		expect(result.waypoints).toHaveLength(3);
		expect(result.waypoints[0].type).toBe("start");
		expect(result.waypoints[0].name).toBe("Inicio");
		expect(result.waypoints[1].type).toBe("summit");
		expect(result.waypoints[1].name).toBe("Cumbre");
		expect(result.waypoints[2].type).toBe("end");
		expect(result.waypoints[2].name).toBe("Fin");

		expect(result.trackPoints).toHaveLength(3);
		expect(result.trackPoints[0]).toEqual([4.65, -74.05]);
		expect(result.trackPoints[1]).toEqual([4.66, -74.06]);
		expect(result.trackPoints[2]).toEqual([4.67, -74.07]);
	});

	it("parses valid GPX with waypoints and track points", () => {
		const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1">
  <wpt lat="4.65" lon="-74.05">
    <ele>2500</ele>
    <name>Start Point</name>
  </wpt>
  <wpt lat="4.67" lon="-74.07">
    <ele>2500</ele>
    <name>End Point</name>
  </wpt>
  <trk>
    <trkseg>
      <trkpt lat="4.65" lon="-74.05">
        <ele>2500</ele>
      </trkpt>
      <trkpt lat="4.66" lon="-74.06">
        <ele>3000</ele>
      </trkpt>
      <trkpt lat="4.67" lon="-74.07">
        <ele>2500</ele>
      </trkpt>
    </trkseg>
  </trk>
</gpx>`;

		const result = parseGpx(gpx);
		// Waypoints vienen solo de <wpt>, no del track
		expect(result.waypoints).toHaveLength(2);
		expect(result.waypoints[0].name).toBe("Start Point");
		expect(result.waypoints[0].type).toBe("start");
		expect(result.waypoints[1].name).toBe("End Point");
		expect(result.waypoints[1].type).toBe("end");

		// Track points vienen solo del track
		expect(result.trackPoints).toHaveLength(3);
		expect(result.trackPoints[0]).toEqual([4.65, -74.05]);
		expect(result.trackPoints[1]).toEqual([4.66, -74.06]);
		expect(result.trackPoints[2]).toEqual([4.67, -74.07]);
	});

	it("parses valid GPX with route points (treated as track)", () => {
		const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1">
  <rte>
    <rtept lat="4.65" lon="-74.05">
      <ele>2500</ele>
      <name>Start</name>
    </rtept>
    <rtept lat="4.66" lon="-74.06">
      <ele>3000</ele>
      <name>Middle</name>
    </rtept>
    <rtept lat="4.67" lon="-74.07">
      <ele>2500</ele>
      <name>End</name>
    </rtept>
  </rte>
</gpx>`;

		const result = parseGpx(gpx);
		// <rtept> se trata como track points, no como waypoints
		expect(result.waypoints).toHaveLength(3);
		expect(result.waypoints[0].type).toBe("start");
		expect(result.waypoints[0].name).toBe("Inicio");
		expect(result.waypoints[1].type).toBe("summit");
		expect(result.waypoints[1].name).toBe("Cumbre");
		expect(result.waypoints[2].type).toBe("end");
		expect(result.waypoints[2].name).toBe("Fin");

		expect(result.trackPoints).toHaveLength(3);
	});

	it("throws on invalid XML", () => {
		expect(() => parseGpx("not xml at all")).toThrow();
	});

	it("throws on empty GPX", () => {
		const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1"></gpx>`;
		expect(() => parseGpx(gpx)).toThrow("No valid waypoints found");
	});

	it("throws on missing gpx root", () => {
		const xml = `<?xml version="1.0" encoding="UTF-8"?>
<other></other>`;
		expect(() => parseGpx(xml)).toThrow("missing <gpx> root element");
	});

	it("uses middle point as summit when no elevation data in track-only", () => {
		const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1">
  <trk>
    <trkseg>
      <trkpt lat="4.65" lon="-74.05"></trkpt>
      <trkpt lat="4.66" lon="-74.06"></trkpt>
      <trkpt lat="4.67" lon="-74.07"></trkpt>
      <trkpt lat="4.68" lon="-74.08"></trkpt>
      <trkpt lat="4.69" lon="-74.09"></trkpt>
    </trkseg>
  </trk>
</gpx>`;

		const result = parseGpx(gpx);
		expect(result.waypoints).toHaveLength(3);
		expect(result.waypoints[0].type).toBe("start");
		expect(result.waypoints[0].name).toBe("Inicio");
		expect(result.waypoints[1].type).toBe("summit");
		expect(result.waypoints[1].name).toBe("Cumbre");
		expect(result.waypoints[2].type).toBe("end");
		expect(result.waypoints[2].name).toBe("Fin");
		expect(result.trackPoints).toHaveLength(5);
	});

	it("handles single waypoint as start and end", () => {
		const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1">
  <wpt lat="4.65" lon="-74.05"><name>Only</name></wpt>
</gpx>`;

		const result = parseGpx(gpx);
		expect(result.waypoints).toHaveLength(1);
		expect(result.waypoints[0].type).toBe("start");
		expect(result.trackPoints).toHaveLength(0);
	});

	it("does not create hundreds of waypoints from a long track", () => {
		const trkpts = Array.from({ length: 500 }, (_, i) =>
			`    <trkpt lat="${4.65 + i * 0.001}" lon="${-74.05 - i * 0.001}"><ele>${2500 + (i % 100)}</ele></trkpt>`,
		).join("\n");

		const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1">
  <trk>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>`;

		const result = parseGpx(gpx);
		// Solo 3 waypoints automáticos: inicio, cumbre, fin
		expect(result.waypoints).toHaveLength(3);
		expect(result.waypoints[0].type).toBe("start");
		expect(result.waypoints[1].type).toBe("summit");
		expect(result.waypoints[2].type).toBe("end");
		// Pero todos los track points se preservan para dibujar la línea
		expect(result.trackPoints).toHaveLength(500);
	});
});
