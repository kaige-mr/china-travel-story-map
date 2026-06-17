/**
 * Slices large image payloads into chunks to prevent single-key quota overflow
 */

export interface StorageChunk {
  id: string;
  index: number;
  total: number;
  data: string;
}

export const CHUNK_SIZE = 512 * 1024; // 512KB per chunk

export function sliceIntoChunks(id: string, base64Data: string): StorageChunk[] {
  const chunks: StorageChunk[] = [];
  const total = Math.ceil(base64Data.length / CHUNK_SIZE);

  for (let i = 0; i < total; i++) {
    chunks.push({
      id,
      index: i,
      total,
      data: base64Data.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
    });
  }

  return chunks;
}

export function reassembleChunks(chunks: StorageChunk[]): string {
  if (!chunks || chunks.length === 0) return '';
  const sorted = [...chunks].sort((a, b) => a.index - b.index);
  return sorted.map(c => c.data).join('');
}
