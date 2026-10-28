import path from 'node:path';
import { config, assertConfig } from './config.js';
import { Store } from './store.js';
import { ListingAI } from './ai.js';
import { createNotifier } from './notify.js';
import { createApp } from './app.js';
import { startScheduler } from './scheduler.js';
import QRCode from 'qrcode';

assertConfig();

const store = await new Store(path.join(config.dataDir, 'db.json')).load();
const hasAnthropicCreds = Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_PROFILE);
const ai = hasAnthropicCreds ? new ListingAI({ model: config.model }) : null;
const notifier = createNotifier({ server: config.ntfyServer, topic: config.ntfyTopic });

const app = createApp({ store, ai, notifier, config });
app.locals.pipeline.resume();
app.listen(config.port, async () => {
  const phoneUrl = `${config.publicUrl}/m/lot#k=${config.apiToken}`;
  const reachable = !/localhost|127\.0\.0\.1/.test(config.publicUrl);
  console.log('');
  console.log('  ✅ MarketPilot est démarré.');
  console.log(`     IA : ${ai ? 'active' : 'INACTIVE — clé API manquante (supprime server/.env et relance pour la saisir)'}`);
  if (notifier.enabled) console.log(`     Notifications sur le cell : ntfy/${config.ntfyTopic}`);
  console.log('');
  console.log('  🧩 Extension Chrome : elle se connecte toute seule. Ouvre-la avec son icône.');
  console.log('');
  if (reachable) {
    console.log('  📱 Sur ton cellulaire (même Wi-Fi), scanne ce code avec l’appareil photo :');
    console.log((await QRCode.toString(phoneUrl, { type: 'terminal', small: true })).replace(/^/gm, '     '));
    console.log('     puis « Ajouter à l’écran d’accueil ». Ce code contient ta clé privée : ne le partage pas.');
    console.log(`     Code illisible ? Ouvre http://localhost:${config.port}/m/qr dans Chrome sur ce PC.`);
  } else {
    console.log('  📱 Wi-Fi introuvable : branche l’ordinateur au même Wi-Fi que ton cell et relance.');
  }
  console.log('');
  console.log('  Laisse cette fenêtre ouverte pendant que tu vends. Pour arrêter : ferme-la.');
});

startScheduler({ store, notifier, publicUrl: config.publicUrl }, config.schedulerIntervalMin);
