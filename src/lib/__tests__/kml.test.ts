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
		expect(result.trackPoints).toHaveLength(0);
	});

	it("parses valid KML with LineString only (creates auto waypoints)", () => {
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
		expect(result.waypoints).toHaveLength(3);
		expect(result.waypoints[0].type).toBe("start");
		expect(result.waypoints[0].name).toBe("Inicio");
		expect(result.waypoints[1].type).toBe("summit");
		expect(result.waypoints[1].elevation).toBe(3000);
		expect(result.waypoints[1].name).toBe("Cumbre");
		expect(result.waypoints[2].type).toBe("end");
		expect(result.waypoints[2].name).toBe("Fin");
		expect(result.trackPoints).toHaveLength(3);
		expect(result.trackPoints[0]).toEqual([4.65, -74.05]);
		expect(result.trackPoints[1]).toEqual([4.66, -74.06]);
		expect(result.trackPoints[2]).toEqual([4.67, -74.07]);
	});

	it("parses KML with both explicit waypoints and LineString track", () => {
		const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>Start</name>
      <Point><coordinates>-74.05,4.65,2500</coordinates></Point>
    </Placemark>
    <Placemark>
      <name>Summit</name>
      <Point><coordinates>-74.06,4.66,3000</coordinates></Point>
    </Placemark>
    <Placemark>
      <name>End</name>
      <Point><coordinates>-74.07,4.67,2500</coordinates></Point>
    </Placemark>
    <Placemark>
      <name>Track</name>
      <LineString>
        <coordinates>-74.05,4.65,2500 -74.06,4.66,3000 -74.07,4.67,2500</coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>`;

		const result = parseKml(kml);
		// Solo los waypoints explícitos, no los del track
		expect(result.waypoints).toHaveLength(3);
		expect(result.waypoints[0].name).toBe("Start");
		expect(result.waypoints[0].type).toBe("start");
		expect(result.waypoints[1].name).toBe("Summit");
		expect(result.waypoints[1].type).toBe("summit");
		expect(result.waypoints[2].name).toBe("End");
		expect(result.waypoints[2].type).toBe("end");
		expect(result.trackPoints).toHaveLength(3);
		expect(result.trackPoints[0]).toEqual([4.65, -74.05]);
		expect(result.trackPoints[1]).toEqual([4.66, -74.06]);
		expect(result.trackPoints[2]).toEqual([4.67, -74.07]);
	});

	it("parses KML with explicit waypoints and summit detection", () => {
		const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>Start</name>
      <Point><coordinates>-74.05,4.65,2500</coordinates></Point>
    </Placemark>
    <Placemark>
      <name>Summit</name>
      <Point><coordinates>-74.06,4.66,3000</coordinates></Point>
    </Placemark>
    <Placemark>
      <name>End</name>
      <Point><coordinates>-74.07,4.67,2500</coordinates></Point>
    </Placemark>
    <Placemark>
      <name>Track</name>
      <LineString>
        <coordinates>-74.05,4.65,2500 -74.06,4.66,3000 -74.07,4.67,2500</coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>`;

		const result = parseKml(kml);
		expect(result.waypoints).toHaveLength(3);
		expect(result.waypoints[0].type).toBe("start");
		expect(result.waypoints[0].name).toBe("Start");
		expect(result.waypoints[1].type).toBe("summit");
		expect(result.waypoints[1].name).toBe("Summit");
		expect(result.waypoints[2].type).toBe("end");
		expect(result.waypoints[2].name).toBe("End");
		expect(result.trackPoints).toHaveLength(3);
	});

	it("parses KML with gx:Track from Google Earth", () => {
		const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:gx="http://www.google.com/kml/ext/2.2">
  <Document>
    <Placemark>
      <gx:Track>
        <gx:coord>-78.4386 -0.6833 4864</gx:coord>
        <gx:coord>-78.4344 -0.6767 5897</gx:coord>
        <gx:coord>-78.4382 -0.6838 5200</gx:coord>
      </gx:Track>
    </Placemark>
  </Document>
</kml>`;

		const result = parseKml(kml);
		expect(result.trackPoints).toHaveLength(3);
		expect(result.trackPoints[0]).toEqual([-0.6833, -78.4386]);
		expect(result.trackPoints[1]).toEqual([-0.6767, -78.4344]);
		expect(result.trackPoints[2]).toEqual([-0.6838, -78.4382]);
		// No hay waypoints explícitos, así que el track genera waypoints
		expect(result.waypoints).toHaveLength(3);
		expect(result.waypoints[0].type).toBe("start");
		expect(result.waypoints[1].type).toBe("summit");
		expect(result.waypoints[1].elevation).toBe(5897);
		expect(result.waypoints[2].type).toBe("end");
	});

	it("parses KML with MultiGeometry", () => {
		const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>Cumbre Cotopaxi</name>
      <MultiGeometry>
        <Point><coordinates>-78.4382,-0.6838,5897</coordinates></Point>
        <LineString>
          <coordinates>
            -78.4386,-0.6833,4864
            -78.4344,-0.6767,5200
            -78.4382,-0.6838,5897
          </coordinates>
        </LineString>
      </MultiGeometry>
    </Placemark>
  </Document>
</kml>`;

		const result = parseKml(kml);
		// Hay waypoint explícito del Point
		expect(result.waypoints).toHaveLength(1);
		expect(result.waypoints[0].name).toBe("Cumbre Cotopaxi");
		expect(result.waypoints[0].lat).toBe(-0.6838);
		expect(result.waypoints[0].lng).toBe(-78.4382);
		expect(result.waypoints[0].elevation).toBe(5897);
		expect(result.trackPoints).toHaveLength(3);
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

	it("parses KML with nested Folders", () => {
		const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Folder>
      <Folder>
        <Placemark>
          <name>Nested</name>
          <Point><coordinates>-74.05,4.65,2500</coordinates></Point>
        </Placemark>
      </Folder>
    </Folder>
  </Document>
</kml>`;

		const result = parseKml(kml);
		expect(result.waypoints).toHaveLength(1);
		expect(result.waypoints[0].name).toBe("Nested");
	});

	it("parses KML without Document element (Placemarks direct under kml)", () => {
		const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Placemark>
    <name>Direct</name>
    <Point><coordinates>-74.05,4.65,2500</coordinates></Point>
  </Placemark>
</kml>`;

		const result = parseKml(kml);
		expect(result.waypoints).toHaveLength(1);
		expect(result.waypoints[0].name).toBe("Direct");
		expect(result.waypoints[0].lat).toBe(4.65);
		expect(result.waypoints[0].lng).toBe(-74.05);
		expect(result.waypoints[0].elevation).toBe(2500);
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
			"No valid waypoints or track points found in KML file",
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

	it("handles coordinates separated by newlines", () => {
		const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
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
		expect(result.trackPoints).toHaveLength(3);
		expect(result.trackPoints[0]).toEqual([4.65, -74.05]);
		expect(result.trackPoints[1]).toEqual([4.66, -74.06]);
		expect(result.trackPoints[2]).toEqual([4.67, -74.07]);
	});

	it("handles coordinates separated by spaces without commas", () => {
		const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <LineString>
        <coordinates>
          -74.05 4.65 2500
          -74.06 4.66 3000
          -74.07 4.67 2500
        </coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>`;

		const result = parseKml(kml);
		expect(result.trackPoints).toHaveLength(3);
		expect(result.trackPoints[0]).toEqual([4.65, -74.05]);
		expect(result.trackPoints[1]).toEqual([4.66, -74.06]);
		expect(result.trackPoints[2]).toEqual([4.67, -74.07]);
	});

	it("handles mixed coordinate formats", () => {
		const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <LineString>
        <coordinates>
          -74.05,4.65,2500
          -74.06,4.66
          -74.07,4.67,2600
        </coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>`;

		const result = parseKml(kml);
		expect(result.trackPoints).toHaveLength(3);
		expect(result.trackPoints[0]).toEqual([4.65, -74.05]);
		expect(result.trackPoints[1]).toEqual([4.66, -74.06]);
		expect(result.trackPoints[2]).toEqual([4.67, -74.07]);
	});

	it("handles multiple Placemarks in a Folder", () => {
		const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Folder>
      <name>Ruta</name>
      <Placemark>
        <name>WP1</name>
        <Point><coordinates>-74.05,4.65,2500</coordinates></Point>
      </Placemark>
      <Placemark>
        <name>WP2</name>
        <Point><coordinates>-74.06,4.66,3000</coordinates></Point>
      </Placemark>
      <Placemark>
        <name>WP3</name>
        <Point><coordinates>-74.07,4.67,2500</coordinates></Point>
      </Placemark>
    </Folder>
  </Document>
</kml>`;

		const result = parseKml(kml);
		expect(result.waypoints).toHaveLength(3);
		expect(result.waypoints[0].name).toBe("WP1");
		expect(result.waypoints[0].type).toBe("start");
		expect(result.waypoints[1].name).toBe("WP2");
		expect(result.waypoints[1].type).toBe("summit");
		expect(result.waypoints[2].name).toBe("WP3");
		expect(result.waypoints[2].type).toBe("end");
	});

	it("handles KML with multiple LineStrings (concatenates track points)", () => {
		const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <LineString>
        <coordinates>-74.05,4.65,2500 -74.06,4.66,3000</coordinates>
      </LineString>
    </Placemark>
    <Placemark>
      <LineString>
        <coordinates>-74.07,4.67,2500 -74.08,4.68,2800</coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>`;

		const result = parseKml(kml);
		expect(result.trackPoints).toHaveLength(4);
		// Solo 3 waypoints automáticos del track concatenado
		expect(result.waypoints).toHaveLength(3);
		expect(result.waypoints[0].type).toBe("start");
		expect(result.waypoints[2].type).toBe("end");
	});

	it("handles KML with gx:Track inside MultiGeometry", () => {
		const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:gx="http://www.google.com/kml/ext/2.2">
  <Document>
    <Placemark>
      <name>Route</name>
      <MultiGeometry>
        <Point><coordinates>-78.4382,-0.6838,5897</coordinates></Point>
        <gx:Track>
          <gx:coord>-78.4386 -0.6833 4864</gx:coord>
          <gx:coord>-78.4344 -0.6767 5200</gx:coord>
          <gx:coord>-78.4382 -0.6838 5897</gx:coord>
        </gx:Track>
      </MultiGeometry>
    </Placemark>
  </Document>
</kml>`;

		const result = parseKml(kml);
		expect(result.waypoints).toHaveLength(1);
		expect(result.waypoints[0].name).toBe("Route");
		expect(result.trackPoints).toHaveLength(3);
	});

	it("does not create hundreds of waypoints from a long LineString", () => {
		const coords = Array.from({ length: 500 }, (_, i) =>
			`${-74.05 - i * 0.001},${4.65 + i * 0.001},${2500 + (i % 100)}`,
		).join(" ");

		const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <LineString>
        <coordinates>${coords}</coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>`;

		const result = parseKml(kml);
		// Solo 3 waypoints automáticos: inicio, cumbre, fin
		expect(result.waypoints).toHaveLength(3);
		expect(result.waypoints[0].type).toBe("start");
		expect(result.waypoints[1].type).toBe("summit");
		expect(result.waypoints[2].type).toBe("end");
		// Pero todos los track points se preservan para dibujar la línea
		expect(result.trackPoints).toHaveLength(500);
	});
});
