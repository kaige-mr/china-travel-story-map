/**
 * GPX (GPS Exchange Format 1.1) Serializer & Parser
 * Handles conversion between internal travel story models and standard GPX track XML files.
 */

export interface GpxTrackPoint {
  lat: number;
  lng: number;
  ele?: number;
  time?: string;
  name?: string;
  desc?: string;
}

export interface GpxMetadata {
  name: string;
  desc?: string;
  author?: string;
  time?: string;
}

export class GpxHandler {
  public static serialize(trackPoints: GpxTrackPoint[], metadata: GpxMetadata): string {
    const esc = (str?: string) =>
      str ? str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') : '';

    const lines: string[] = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<gpx version="1.1" creator="China Travel Story Map Engine"',
      '  xmlns="http://www.topografix.com/GPX/1/1"',
      '  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"',
      '  xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">',
      '  <metadata>',
      `    <name>${esc(metadata.name)}</name>`,
      metadata.desc ? `    <desc>${esc(metadata.desc)}</desc>` : '',
      metadata.author ? `    <author><name>${esc(metadata.author)}</name></author>` : '',
      metadata.time ? `    <time>${metadata.time}</time>` : `    <time>${new Date().toISOString()}</time>`,
      '  </metadata>'
    ].filter(Boolean);

    // Add waypoints
    for (const pt of trackPoints) {
      if (pt.name || pt.desc) {
        lines.push(`  <wpt lat="${pt.lat.toFixed(6)}" lon="${pt.lng.toFixed(6)}">`);
        if (pt.name) lines.push(`    <name>${esc(pt.name)}</name>`);
        if (pt.desc) lines.push(`    <desc>${esc(pt.desc)}</desc>`);
        if (pt.ele !== undefined) lines.push(`    <ele>${pt.ele.toFixed(1)}</ele>`);
        if (pt.time) lines.push(`    <time>${pt.time}</time>`);
        lines.push('  </wpt>');
      }
    }

    // Add track and segment
    lines.push('  <trk>');
    lines.push(`    <name>${esc(metadata.name)}</name>`);
    lines.push('    <trkseg>');
    for (const pt of trackPoints) {
      lines.push(`      <trkpt lat="${pt.lat.toFixed(6)}" lon="${pt.lng.toFixed(6)}">`);
      if (pt.ele !== undefined) lines.push(`        <ele>${pt.ele.toFixed(1)}</ele>`);
      if (pt.time) lines.push(`        <time>${pt.time}</time>`);
      lines.push('      </trkpt>');
    }
    lines.push('    </trkseg>');
    lines.push('  </trk>');
    lines.push('</gpx>');

    return lines.join('\n');
  }

  public static parse(xmlContent: string): { metadata: Partial<GpxMetadata>; points: GpxTrackPoint[] } {
    const points: GpxTrackPoint[] = [];
    const metadata: Partial<GpxMetadata> = {};

    const nameMatch = xmlContent.match(/<metadata>[\s\S]*?<name>([\s\S]*?)<\/name>/);
    if (nameMatch) metadata.name = nameMatch[1].trim();

    const descMatch = xmlContent.match(/<metadata>[\s\S]*?<desc>([\s\S]*?)<\/desc>/);
    if (descMatch) metadata.desc = descMatch[1].trim();

    // Match trackpoints
    const trkptRegex = /<trkpt\s+lat="([^"]+)"\s+lon="([^"]+)"[\s\S]*?>([\s\S]*?)<\/trkpt>/g;
    let match: RegExpExecArray | null;

    while ((match = trkptRegex.exec(xmlContent)) !== null) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      const inner = match[3];

      const eleMatch = inner.match(/<ele>([^<]+)<\/ele>/);
      const timeMatch = inner.match(/<time>([^<]+)<\/time>/);

      points.push({
        lat,
        lng,
        ele: eleMatch ? parseFloat(eleMatch[1]) : undefined,
        time: timeMatch ? timeMatch[1].trim() : undefined
      });
    }

    return { metadata, points };
  }
}
