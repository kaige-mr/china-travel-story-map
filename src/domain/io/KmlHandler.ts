/**
 * KML (Keyhole Markup Language 2.2) Exporter & Parser
 * Converts travel trajectories into KML placemarks and 3D paths for Google Earth.
 */

export interface KmlPlacemark {
  id: string;
  name: string;
  description?: string;
  lat: number;
  lng: number;
  altitude?: number;
  styleUrl?: string;
}

export interface KmlTourOptions {
  documentName: string;
  lineColorHex?: string;  // AABBGGRR format
  lineWidth?: number;
  extrude?: boolean;
}

export class KmlHandler {
  public static exportTour(placemarks: KmlPlacemark[], options: KmlTourOptions): string {
    const esc = (s?: string) =>
      s ? s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') : '';

    const lineColor = options.lineColorHex ?? '7f00ffff';
    const lineWidth = options.lineWidth ?? 4;

    const coordsStr = placemarks
      .map(p => `${p.lng.toFixed(6)},${p.lat.toFixed(6)},${p.altitude ?? 0}`)
      .join(' ');

    const lines: string[] = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<kml xmlns="http://www.opengis.net/kml/2.2">',
      '  <Document>',
      `    <name>${esc(options.documentName)}</name>`,
      '    <Style id="routeStyle">',
      '      <LineStyle>',
      `        <color>${lineColor}</color>`,
      `        <width>${lineWidth}</width>`,
      '      </LineStyle>',
      '      <PolyStyle>',
      '        <color>4000aaff</color>',
      '      </PolyStyle>',
      '    </Style>'
    ];

    // Placemarks
    for (const pm of placemarks) {
      lines.push('    <Placemark>');
      lines.push(`      <name>${esc(pm.name)}</name>`);
      if (pm.description) {
        lines.push(`      <description><![CDATA[${pm.description}]]></description>`);
      }
      lines.push('      <Point>');
      lines.push(`        <coordinates>${pm.lng.toFixed(6)},${pm.lat.toFixed(6)},${pm.altitude ?? 0}</coordinates>`);
      lines.push('      </Point>');
      lines.push('    </Placemark>');
    }

    // LineString
    if (placemarks.length >= 2) {
      lines.push('    <Placemark>');
      lines.push(`      <name>${esc(options.documentName)} Route</name>`);
      lines.push('      <styleUrl>#routeStyle</styleUrl>');
      lines.push('      <LineString>');
      lines.push(`        <extrude>${options.extrude ? 1 : 0}</extrude>`);
      lines.push('        <tessellate>1</tessellate>');
      lines.push('        <altitudeMode>clampToGround</altitudeMode>');
      lines.push(`        <coordinates>${coordsStr}</coordinates>`);
      lines.push('      </LineString>');
      lines.push('    </Placemark>');
    }

    lines.push('  </Document>');
    lines.push('</kml>');

    return lines.join('\n');
  }

  public static parseCoordinates(kmlContent: string): Array<{ lat: number; lng: number; alt: number }> {
    const result: Array<{ lat: number; lng: number; alt: number }> = [];
    const coordBlock = kmlContent.match(/<coordinates>([\s\S]*?)<\/coordinates>/);
    if (!coordBlock) return result;

    const tokens = coordBlock[1].trim().split(/\s+/);
    for (const t of tokens) {
      const parts = t.split(',');
      if (parts.length >= 2) {
        result.push({
          lng: parseFloat(parts[0]),
          lat: parseFloat(parts[1]),
          alt: parts.length > 2 ? parseFloat(parts[2]) : 0
        });
      }
    }
    return result;
  }
}
