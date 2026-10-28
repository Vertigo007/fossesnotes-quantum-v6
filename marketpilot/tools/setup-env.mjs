// First-run setup, launched by DEMARRER-Windows.bat / DEMARRER-Mac.command
// when server/.env doesn't exist yet:
//   1. opens the Anthropic key page and checks the pasted key really works;
//   2. writes server/.env with a freshly generated private token;
//   3. Windows: creates a "MarketPilot" desktop shortcut; then opens
//      chrome://extensions with the extension folder path in the clipboard.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import readline from 'node:readline';
import { spawnSync, spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const serverDir = path.join(root, 'server');
const envPath = path.join(serverDir, '.env');
const extensionDir = path.join(root, 'extension');
const KEY_PAGE = 'https://platform.claude.com/settings/keys';
const win = process.platform === 'win32';
const mac = process.platform === 'darwin';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false });
const lines = rl[Symbol.asyncIterator]();
async function ask(question) {
  process.stdout.write(question);
  const { value = '' } = await lines.next();
  return value.trim();
}

function openUrl(url, app) {
  // Best effort: a missing browser must never stop the installation.
  const launch = (cmd, args, opts = {}) => {
    const child = spawn(cmd, args, { detached: true, stdio: 'ignore', ...opts });
    child.on('error', () => {});
    child.unref();
  };
  try {
    // `start "" <app> <url>` — the empty "" is the window title start expects.
    if (win) launch(`start "" ${app ? `${app} ` : ''}"${url}"`, [], { shell: true });
    else if (mac) launch('open', [...(app ? ['-a', app] : []), url]);
    else launch('xdg-open', [url]);
  } catch { /* ignore */ }
}

function copyToClipboard(text) {
  const cmd = win ? ['clip', []] : mac ? ['pbcopy', []] : null;
  if (!cmd) return false;
  const r = spawnSync(cmd[0], cmd[1], { input: text });
  return !r.error && r.status === 0;
}

/** Returns 'ok', 'invalid' or 'unknown' (no network: can't tell). */
async function checkKey(apiKey) {
  try {
    const require = createRequire(path.join(serverDir, 'package.json'));
    const Anthropic = require('@anthropic-ai/sdk');
    const Client = Anthropic.default || Anthropic;
    const client = new Client({ apiKey, maxRetries: 1, timeout: 15000 });
    await client.models.list({ limit: 1 });
    return 'ok';
  } catch (err) {
    if (err?.status === 401 || err?.status === 403) return 'invalid';
    return 'unknown';
  }
}

function desktopShortcut() {
  if (!win) return false;
  const target = path.join(root, 'DEMARRER-Windows.bat');
  const icon = path.join(here, 'marketpilot.ico');
  const ps = `
$d = [Environment]::GetFolderPath('Desktop');
$s = (New-Object -ComObject WScript.Shell).CreateShortcut((Join-Path $d 'MarketPilot.lnk'));
$s.TargetPath = '${target.replace(/'/g, "''")}';
$s.WorkingDirectory = '${root.replace(/'/g, "''")}';
${fs.existsSync(icon) ? `$s.IconLocation = '${icon.replace(/'/g, "''")}';` : ''}
$s.Description = 'Démarrer MarketPilot';
$s.Save();`;
  const r = spawnSync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', ps], { stdio: 'ignore' });
  return r.status === 0;
}

// ------------------------------------------------------------------ run
console.log('\n  ==============================================');
console.log('    MarketPilot — installation (une seule fois)');
console.log('  ==============================================\n');
console.log('  ÉTAPE 1/2 — Ta clé API Anthropic (c’est elle qui fait travailler l’IA).');
console.log(`  J’ouvre la page dans ton navigateur : ${KEY_PAGE}`);
console.log('  Clique « Create Key », copie la clé (elle commence par sk-ant-) et colle-la ici.');
console.log('  Ajoute aussi 5 à 10 $ de crédit dans « Billing » : environ 0,10 $ par annonce.\n');
openUrl(KEY_PAGE);

let apiKey = '';
for (let attempt = 1; attempt <= 3; attempt++) {
  apiKey = await ask('  Colle ta clé ici puis Entrée : ');
  if (!apiKey.startsWith('sk-ant-')) {
    console.log('  ✗ Ça ne ressemble pas à une clé Anthropic (elle commence par sk-ant-). Réessaie.\n');
    continue;
  }
  process.stdout.write('  Vérification de la clé… ');
  const status = await checkKey(apiKey);
  if (status === 'ok') { console.log('✓ elle fonctionne.\n'); break; }
  if (status === 'unknown') { console.log('impossible de vérifier (pas d’Internet ?). Je la garde.\n'); break; }
  console.log('✗ clé refusée. Copie-la de nouveau (sans espace) ou crée-en une autre.\n');
  apiKey = '';
}
rl.close();
if (!apiKey.startsWith('sk-ant-')) {
  console.log('  Installation interrompue : relance MarketPilot quand tu auras ta clé.');
  process.exit(1);
}

fs.writeFileSync(envPath, [
  '# Créé par l’installation. Supprime ce fichier pour tout reconfigurer.',
  `MARKETPILOT_TOKEN=${crypto.randomBytes(24).toString('hex')}`,
  `ANTHROPIC_API_KEY=${apiKey}`,
  'PORT=8787',
  'TZ=America/Toronto',
  '# Notifications sur le cell (app ntfy) : mets un sujet secret, ex. marketpilot-tonnom-8h3k2p',
  'NTFY_TOPIC=',
  '',
].join('\n'));

console.log('  ÉTAPE 2/2 — L’extension Chrome.');
const copied = copyToClipboard(extensionDir);
openUrl('chrome://extensions', win ? 'chrome' : mac ? 'Google Chrome' : undefined);
console.log('  J’ouvre la page des extensions de Chrome. Là-dedans :');
console.log('    a) active « Mode développeur » (en haut à droite) ;');
console.log('    b) clique « Charger l’extension non empaquetée » ;');
console.log(copied
  ? '    c) dans la fenêtre qui s’ouvre, colle (Ctrl+V) dans la barre d’adresse en haut, Entrée, puis « Sélectionner un dossier ».'
  : `    c) choisis le dossier : ${extensionDir}`);
console.log('    d) clique la pièce de casse-tête 🧩 et épingle MarketPilot.');
console.log('  (Si Chrome ne s’est pas ouvert : tape chrome://extensions dans la barre d’adresse.)\n');
if (desktopShortcut()) console.log('  ✓ Raccourci « MarketPilot » créé sur ton bureau : la prochaine fois, double-clique-le.\n');
console.log('  Démarrage du serveur…\n');
