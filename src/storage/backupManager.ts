/**
 * Backup import/export serializer and schema validator
 */

import { TravelStory } from '../domain/types';

export function exportStoryToJson(story: TravelStory): string {
  return JSON.stringify({
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    payload: story
  }, null, 2);
}

export function importStoryFromJson(jsonString: string): TravelStory {
  const parsed = JSON.parse(jsonString);
  if (!parsed || !parsed.payload || !Array.isArray(parsed.payload.nodes)) {
    throw new Error('Invalid travel story backup format.');
  }
  return parsed.payload as TravelStory;
}
