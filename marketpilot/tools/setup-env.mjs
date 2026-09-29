// First-run setup: asks for the Anthropic API key, generates the shared
// token, detects this computer's Wi-Fi address and writes server/.env.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(here, '..', 'server', '.env');

function lanAddress() {
  for (const addrs of Object.values(os.networkInterfaces())) {
    for (const a of addrs || []) {
      if (a.family === 'IPv4' && !a.internal && /^(192\.168|10\.|172\.(1[6-9]|2\d|3[01]))/.test(a.address)) return a.address;
    }
  }
  return 'localhost';
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false });
const lines = rl[Symbol.asyncIterator]();
const ask = async (q) => {
  process.stdout.write(q);
  const { value = '' } = await lines.next();
  return value.trim();
};
console.log('\n=== Configuration de MarketPilot (une seule fois) ===\n');
const apiKey = await ask('Colle ta clé API Anthropic (sk-ant-...) : ');
const ntfy = await ask('Sujet ntfy pour les notifications sur ton cell (Entrée pour passer) : ');
rl.close();

const token = crypto.randomBytes(24).toString('hex');
const ip = lanAddress();
fs.writeFileSync(envPath, [
  `MARKETPILOT_TOKEN=${token}`,
  `ANTHROPIC_API_KEY=${apiKey}`,
  `PUBLIC_URL=http://${ip}:8787`,
  'PORT=8787',
  'TZ=America/Toronto',
  `NTFY_TOPIC=${ntfy}`,
  '',
].join('\n'));
console.log(`\nConfiguration enregistrée dans ${envPath}\n`);
