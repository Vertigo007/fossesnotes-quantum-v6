import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

// Strategy windows (evenings / weekend mornings) are computed in local time.
process.env.TZ = process.env.TZ || 'America/Toronto';

export const config = {
  port: Number(process.env.PORT) || 8787,
  // Public URL your phone can reach (LAN IP, ngrok, Render, etc.). Used in QR codes.
  publicUrl: (process.env.PUBLIC_URL || `http://localhost:${Number(process.env.PORT) || 8787}`).replace(/\/$/, ''),
  // Shared secret between the server, the extension and your phone.
  apiToken: process.env.MARKETPILOT_TOKEN || '',
  dataDir: path.resolve(process.env.DATA_DIR || path.join(here, '..', 'data')),
  model: process.env.MARKETPILOT_MODEL || 'claude-opus-5-5',
  // Optional push notifications through ntfy (https://ntfy.sh) — pick a long random topic.
  ntfyTopic: process.env.NTFY_TOPIC || '',
  ntfyServer: (process.env.NTFY_SERVER || 'https://ntfy.sh').replace(/\/$/, ''),
  schedulerIntervalMin: Number(process.env.SCHEDULER_INTERVAL_MIN) || 30,
  maxPhotosPerSession: 10,
};

export function assertConfig() {
  if (!config.apiToken || config.apiToken.length < 16) {
    throw new Error('MARKETPILOT_TOKEN doit être défini (16 caractères minimum). Ex.: openssl rand -hex 24');
  }
}
