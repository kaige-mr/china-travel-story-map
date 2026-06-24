/**
 * Business validation logic for story route nodes
 */

import { StoryNode } from './types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateStoryRoute(nodes: StoryNode[]): ValidationResult {
  const errors: string[] = [];

  if (!nodes || nodes.length < 2) {
    errors.push('A valid story route must contain at least 2 distinct city nodes.');
  }

  // Check chronological order
  for (let i = 1; i < nodes.length; i++) {
    const prevDate = new Date(nodes[i - 1].date).getTime();
    const currDate = new Date(nodes[i].date).getTime();
    if (!isNaN(prevDate) && !isNaN(currDate) && currDate < prevDate) {
      errors.push(`Node ${i + 1} (${nodes[i].cityName}) date precedes previous node.`);
    }
  }

  // Validate coordinates
  nodes.forEach((node, i) => {
    if (isNaN(node.lat) || node.lat < -90 || node.lat > 90) {
      errors.push(`Node ${i + 1} contains invalid latitude: ${node.lat}`);
    }
    if (isNaN(node.lng) || node.lng < -180 || node.lng > 180) {
      errors.push(`Node ${i + 1} contains invalid longitude: ${node.lng}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}
