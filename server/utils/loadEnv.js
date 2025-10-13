const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const candidates = ['.env', '.env.local', '.env.development'];

for (const name of candidates) {
  const p1 = path.resolve(process.cwd(), name);           // racine du repo
  const p2 = path.resolve(__dirname, '..', '..', name);   // fallback
  for (const p of [p1, p2]) {
    if (fs.existsSync(p)) {
      console.log(`[ENV] Loading ${p}`);
      dotenv.config({ path: p, override: false });
    }
  }
}

// Validation des variables critiques
['JWT_SECRET','DW_SALT'].forEach(k=>{
  if (!process.env[k]) {
    console.warn(`[WARN] Missing env ${k}. Define it in .env`);
  } else {
    console.log(`[ENV] ✓ ${k} loaded`);
  }
});

module.exports = process.env;
