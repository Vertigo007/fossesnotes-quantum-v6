// Settings + authenticated calls to the MarketPilot server. Shared by the
// side panel and the background service worker.

export const DEFAULT_SETTINGS = {
  serverUrl: 'http://localhost:8787',
  token: '',
  citySlug: '', // e.g. "montreal", "quebec", "laval" — as in facebook.com/marketplace/<slug>/
  autoExecute: true, // run approved actions automatically when Chrome is open
  autoSubmit: false, // click Publish / Update for you (off = you review and click)
  lang: 'fr',
  tone: 'friendly',
  pickupArea: '',
};

export async function getSettings() {
  const stored = await chrome.storage.local.get('settings');
  return { ...DEFAULT_SETTINGS, ...(stored.settings || {}) };
}

export async function saveSettings(patch) {
  const next = { ...(await getSettings()), ...patch };
  next.serverUrl = String(next.serverUrl || '').replace(/\/+$/, '');
  await chrome.storage.local.set({ settings: next });
  return next;
}

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export async function api(path, { method = 'GET', body, raw = false } = {}) {
  const { serverUrl, token } = await getSettings();
  if (!token) throw new ApiError(0, 'Configure le serveur et le jeton dans Réglages.');
  let res;
  try {
    res = await fetch(`${serverUrl}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, `Serveur injoignable (${serverUrl}). Est-il démarré ?`);
  }
  if (raw) {
    if (!res.ok) throw new ApiError(res.status, res.statusText);
    return res;
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error || res.statusText);
  return data;
}

/** Downloads a photo from the server as a data URL (for the Facebook form). */
export async function photoDataUrl(sessionId, photoId) {
  const res = await api(`/api/sessions/${sessionId}/photos/${photoId}`, { raw: true });
  const blob = await res.blob();
  const buf = new Uint8Array(await blob.arrayBuffer());
  let bin = '';
  for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return `data:${blob.type || 'image/jpeg'};base64,${btoa(bin)}`;
}
