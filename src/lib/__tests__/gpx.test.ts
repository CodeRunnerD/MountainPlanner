import { describe, it, expect } from "vitest";
import { parseGpx } from "../gpx";

describe("parseGpx", () => {
	it("parses valid GPX with waypoints", () => {
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
		expect(result).toHaveLength(3);
		expect(result[0].lat).toBe(4.65);
		expect(result[0].lng).toBe(-74.05);
		expect(result[0].elevation).toBe(2500);
		expect(result[0].name).toBe("Start Point");
		expect(result[0].type).toBe("start");

		expect(result[1].type).toBe("summit");
		expect(result[2].type).toBe("end");
	});

	it("parses valid GPX with track points", () => {
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
		expect(result).toHaveLength(3);
		expect(result[0].type).toBe("start");
		expect(result[1].type).toBe("summit");
		expect(result[2].type).toBe("end");
	});

	it("parses valid GPX with route points", () => {
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
		expect(result).toHaveLength(3);
		expect(result[0].type).toBe("start");
		expect(result[1].type).toBe("summit");
		expect(result[2].type).toBe("end");
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

	it("uses middle point as summit when no elevation data", () => {
		const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1">
  <wpt lat="4.65" lon="-74.05"><name>A</name></wpt>
  <wpt lat="4.66" lon="-74.06"><name>B</name></wpt>
  <wpt lat="4.67" lon="-74.07"><name>C</name></wpt>
  <wpt lat="4.68" lon="-74.08"><name>D</name></wpt>
  <wpt lat="4.69" lon="-74.09"><name>E</name></wpt>
</gpx>`;

		const result = parseGpx(gpx);
		expect(result[0].type).toBe("start");
		expect(result[2].type).toBe("summit");
		expect(result[4].type).toBe("end");
	});

	it("handles single waypoint as start and end", () => {
		const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1">
  <wpt lat="4.65" lon="-74.05"><name>Only</name></wpt>
</gpx>`;

		const result = parseGpx(gpx);
		expect(result).toHaveLength(1);
		expect(result[0].type).toBe("start");
	});
});
