import { describe, it, expect } from "vitest";
import { parseKml } from "../kml";

describe("parseKml", () => {
	it("parses valid KML with Point placemarks", () => {
		const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>Start</name>
      <Point>
        <coordinates>-74.05,4.65,2500</coordinates>
      </Point>
    </Placemark>
    <Placemark>
      <name>Summit</name>
      <Point>
        <coordinates>-74.06,4.66,3000</coordinates>
      </Point>
    </Placemark>
    <Placemark>
      <name>End</name>
      <Point>
        <coordinates>-74.07,4.67,2500</coordinates>
      </Point>
    </Placemark>
  </Document>
</kml>`;

		const result = parseKml(kml);
		expect(result.waypoints).toHaveLength(3);
		expect(result.waypoints[0].lat).toBe(4.65);
		expect(result.waypoints[0].lng).toBe(-74.05);
		expect(result.waypoints[0].elevation).toBe(2500);
		expect(result.waypoints[0].name).toBe("Start");
		expect(result.waypoints[0].type).toBe("start");
		expect(result.waypoints[1].type).toBe("summit");
		expect(result.waypoints[2].type).toBe("end");
	});

	it("parses valid KML with LineString", () => {
		const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>Track</name>
      <LineString>
        <coordinates>
          -74.05,4.65,2500
          -74.06,4.66,3000
          -74.07,4.67,2500
        </coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>`;

		const result = parseKml(kml);
		expect(result.waypoints.length).toBeGreaterThanOrEqual(2);
		expect(result.track).toBeDefined();
		expect(result.track!.points).toHaveLength(3);
		expect(result.track!.points[0]).toEqual([4.65, -74.05, 2500]);
	});

	it("throws on invalid XML", () => {
		expect(() => parseKml("not xml at all")).toThrow();
	});

	it("throws on missing kml root", () => {
		const xml = `<?xml version="1.0" encoding="UTF-8"?>
<other></other>`;
		expect(() => parseKml(xml)).toThrow("missing <kml> root element");
	});

	it("throws on empty KML", () => {
		const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document></Document>
</kml>`;
		expect(() => parseKml(kml)).toThrow(
			"Invalid KML file: missing <Document> element",
		);
	});

	it("handles KML with no elevation in coordinates", () => {
		const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>Point</name>
      <Point>
        <coordinates>-74.05,4.65</coordinates>
      </Point>
    </Placemark>
  </Document>
</kml>`;

		const result = parseKml(kml);
		expect(result.waypoints).toHaveLength(1);
		expect(result.waypoints[0].lat).toBe(4.65);
		expect(result.waypoints[0].lng).toBe(-74.05);
		expect(result.waypoints[0].elevation).toBeUndefined();
	});

	it("parses KML with Folder structure", () => {
		const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Folder>
      <Placemark>
        <name>In Folder</name>
        <Point>
          <coordinates>-74.05,4.65,2500</coordinates>
        </Point>
      </Placemark>
    </Folder>
  </Document>
</kml>`;

		const result = parseKml(kml);
		expect(result.waypoints).toHaveLength(1);
		expect(result.waypoints[0].name).toBe("In Folder");
	});
});
