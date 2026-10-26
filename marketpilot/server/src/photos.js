// Where uploaded photos live on disk, shared by the HTTP layer and the
// background pipeline.

import fs from 'node:fs/promises';
import path from 'node:path';

export const IMAGE_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export function photoStore({ dataDir, store }) {
  const dir = (sessionId) => path.join(dataDir, 'uploads', sessionId);
  const file = (sessionId, photo) => path.join(dir(sessionId), `${photo.id}.${IMAGE_TYPES[photo.mediaType]}`);

  /** Resolves listing photo refs ({sessionId, id}) to their session records. */
  function resolve(refs) {
    return refs
      .map((ref) => {
        const photo = store.get('sessions', ref.sessionId)?.photos.find((p) => p.id === ref.id);
        return photo ? { sessionId: ref.sessionId, ...photo } : null;
      })
      .filter(Boolean);
  }

  /** Base64 images for the AI, in listing order. */
  async function readForAI(refs, max = 6) {
    return Promise.all(resolve(refs).slice(0, max).map(async (p) => ({
      mediaType: p.mediaType,
      data: (await fs.readFile(file(p.sessionId, p))).toString('base64'),
    })));
  }

  return { dir, file, resolve, readForAI };
}
