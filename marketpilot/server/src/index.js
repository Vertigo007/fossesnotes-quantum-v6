import path from 'node:path';
import { config, assertConfig } from './config.js';
import { Store } from './store.js';
import { ListingAI } from './ai.js';
import { createNotifier } from './notify.js';
import { createApp } from './app.js';
import { startScheduler } from './scheduler.js';

assertConfig();

const store = await new Store(path.join(config.dataDir, 'db.json')).load();
const hasAnthropicCreds = Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_PROFILE);
const ai = hasAnthropicCreds ? new ListingAI({ model: config.model }) : null;
const notifier = createNotifier({ server: config.ntfyServer, topic: config.ntfyTopic });

const app = createApp({ store, ai, notifier, config });
app.listen(config.port, () => {
  console.log(`MarketPilot en ligne sur ${config.publicUrl} (port ${config.port})`);
  console.log(`  IA : ${ai ? config.model : 'désactivée — définis ANTHROPIC_API_KEY'}`);
  console.log(`  Notifications : ${notifier.enabled ? `ntfy/${config.ntfyTopic}` : 'désactivées (NTFY_TOPIC)'}`);
  console.log(`  Approbations mobiles : ${config.publicUrl}/m/approvals`);
});

startScheduler({ store, notifier, publicUrl: config.publicUrl }, config.schedulerIntervalMin);
