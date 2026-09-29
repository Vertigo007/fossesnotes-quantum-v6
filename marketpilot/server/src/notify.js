// Optional phone push notifications via ntfy (free, no account needed).
// Install the ntfy app, subscribe to your NTFY_TOPIC, done.

export function createNotifier({ server, topic, fetchImpl = globalThis.fetch }) {
  if (!topic) return { enabled: false, send: async () => false };
  return {
    enabled: true,
    async send({ title, message, click, tags = [] }) {
      try {
        // JSON publishing keeps accented characters intact (HTTP headers can't carry them).
        const res = await fetchImpl(server, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic, title, message, click, tags }),
        });
        return res.ok;
      } catch (err) {
        console.warn('[notify] échec ntfy:', err.message);
        return false;
      }
    },
  };
}
