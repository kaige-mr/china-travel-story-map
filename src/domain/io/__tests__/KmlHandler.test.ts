import { describe, it, expect } from 'vitest';
import { KmlHandler, KmlPlacemark } from '../KmlHandler';

describe('KmlHandler 2.2 Exporter & Parser', () => {
  const marks: KmlPlacemark[] = [
    { id: '1', name: 'West Lake', lat: 30.2592, lng: 120.1472, description: 'Scenic Hangzhou lake' },
    { id: '2', name: 'Huangshan', lat: 30.1317, lng: 118.1724, description: 'Yellow Mountain granite peaks' }
  ];

  it('exports structured KML XML with styles and LineString', () => {
    const kml = KmlHandler.exportTour(marks, {
      documentName: 'East China Nature Tour',
      lineColorHex: 'ffff0000'
    });

    expect(kml).toContain('<kml xmlns="http://www.opengis.net/kml/2.2">');
    expect(kml).toContain('<name>West Lake</name>');
    expect(kml).toContain('<LineString>');
    expect(kml).toContain('120.147200,30.259200');
  });

  it('parses coordinate tuples correctly', () => {
    const kml = KmlHandler.exportTour(marks, { documentName: 'Tour' });
    const coords = KmlHandler.parseCoordinates(kml);

    expect(coords.length).toBe(2);
    expect(coords[0].lat).toBeCloseTo(30.2592, 4);
    expect(coords[0].lng).toBeCloseTo(120.1472, 4);
  });
});
