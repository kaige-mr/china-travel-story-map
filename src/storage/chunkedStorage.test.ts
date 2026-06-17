import { describe, it, expect } from 'vitest';
import { sliceIntoChunks, reassembleChunks } from './chunkedStorage';

describe('Chunked Storage Serialization', () => {
  it('correctly slices large base64 payload and reassembles intact', () => {
    const original = 'A'.repeat(1024 * 1024 + 500); // ~1MB
    const chunks = sliceIntoChunks('test-asset', original);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].total).toBe(chunks.length);

    const reassembled = reassembleChunks(chunks);
    expect(reassembled).toBe(original);
  });

  it('handles small strings in a single chunk', () => {
    const small = 'data:image/jpeg;base64,12345';
    const chunks = sliceIntoChunks('small', small);
    expect(chunks.length).toBe(1);
    expect(reassembleChunks(chunks)).toBe(small);
  });
});
