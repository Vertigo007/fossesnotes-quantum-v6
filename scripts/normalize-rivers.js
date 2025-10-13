#!/usr/bin/env node
/**
 * Normalize & reconcile rivers (bilingue) SANS modifier la DB.
 * - Lit: data/rivers_master.json (vérité), data/rivers_delta.json (résultat import)
 * - Lit la DB en lecture seule (SQLite OU Postgres) pour obtenir l'état courant.
 * - Applique des règles de normalisation (slug, province, noms FR/EN, bbox).
 * - Produit deux sorties:
 *    • data/rivers_normalization_plan.json  → "plan" de corrections (before/after, raison)
 *    • data/rivers_master_patch.json        → patch JSON proposé pour le master (ajouts/mises à jour)
 *
 * Usage:
 *   DATABASE_URL=... node scripts/normalize-rivers.js
 *
 * Notes:
 * - Bilingue: ne supprime jamais les champs FR/EN; n'en remplace pas un par vide.
 * - Non destructif: ne fait que LIRE la DB et ÉCRIRE des fichiers JSON.
 */

const fs = require("fs");
const path = require("path");

// --------- helpers ----------
const DATA_MASTER = "data/rivers_master.json";
const DATA_DELTA  = "data/rivers_delta.json";
const OUT_PLAN    = "data/rivers_normalization_plan.json";
const OUT_PATCH   = "data/rivers_master_patch.json";

const DB_URL = process.env.DATABASE_URL || "";
if (!DB_URL) {
  console.error("❌ DATABASE_URL requis (sqlite://… ou postgresql://…)");
  process.exit(1);
}

const isSqlite = DB_URL.startsWith("sqlite:");
let pg = null, sqlite3 = null;
if (!isSqlite) { try { pg = require("pg"); } catch { /* optional until used */ } }
else          { try { sqlite3 = require("sqlite3").verbose(); } catch {} }

function readJSON(p) {
  const full = path.resolve(p);
  if (!fs.existsSync(full)) throw new Error(`Fichier introuvable: ${full}`);
  return JSON.parse(fs.readFileSync(full, "utf-8"));
}

function writeJSON(p, obj) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(obj, null, 2), "utf-8");
}

function stripDiacritics(s) {
  return s.normalize("NFD").replace(/\p{Diacritic}+/gu, "");
}
function slugify(s) {
  return stripDiacritics(String(s || ""))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

const PROV_MAP = new Map([
  ["qc", "QC"], ["quebec", "QC"], ["québec", "QC"],
  ["nb", "NB"], ["new brunswick", "NB"],
  ["ns", "NS"], ["nova scotia", "NS"],
  ["nl", "NL"], ["newfoundland and labrador", "NL"], ["newfoundland", "NL"],
  ["me", "ME"], ["maine", "ME"]
]);

function normalizeProvince(p) {
  if (!p) return p;
  const k = stripDiacritics(String(p)).trim().toLowerCase();
  return PROV_MAP.get(k) || p;
}

function validBBox(b) {
  return Array.isArray(b) && b.length === 4 &&
    typeof b[0]==="number" && typeof b[1]==="number" &&
    typeof b[2]==="number" && typeof b[3]==="number" &&
    b[0] < b[2] && b[1] < b[3];
}

function normalizeBBox(b) {
  if (!validBBox(b)) return null;
  const [minLon, minLat, maxLon, maxLat] = b;
  return [Number(minLon), Number(minLat), Number(maxLon), Number(maxLat)];
}

function shallowEq(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

// -------------- DB READ (read-only) --------------
async function fetchRiversFromDb() {
  if (isSqlite) {
    if (!sqlite3) throw new Error("sqlite3 non disponible. `npm i sqlite3`");
    const p = DB_URL.replace("sqlite://", "");
    const db = new sqlite3.Database(p);
         const rows = await new Promise((resolve, reject) => {
       db.all(`SELECT slug, name_fr, name_en, province_etat as province_state, country, status, sources, bbox
               FROM rivieres`, [], (err, rows)=> err?reject(err):resolve(rows || []));
     });
    db.close();
    return rows.map(r => ({
      slug: r.slug,
      name_fr: r.name_fr,
      name_en: r.name_en,
      province_state: r.province_state,
      country: r.country,
      status: r.status,
      sources: r.sources ? JSON.parse(r.sources) : [],
      bbox: r.bbox ? JSON.parse(r.bbox) : null
    }));
  } else {
    if (!pg) throw new Error("pg non disponible. `npm i pg`");
    const client = new pg.Client({ connectionString: DB_URL });
    await client.connect();
         const { rows } = await client.query(
       `SELECT slug, name_fr, name_en, province_etat as province_state, country, status, sources, bbox FROM rivieres`
     );
    await client.end();
    return (rows || []).map(r => ({
      slug: r.slug,
      name_fr: r.name_fr,
      name_en: r.name_en,
      province_state: r.province_state,
      country: r.country,
      status: r.status,
      sources: r.sources || [],
      bbox: r.bbox || null
    }));
  }
}

// -------------- MAIN --------------
(async () => {
  try {
    const master = readJSON(DATA_MASTER);               // vérité
    const delta  = fs.existsSync(DATA_DELTA) ? readJSON(DATA_DELTA) : null;
    const dbRows = await fetchRiversFromDb();           // état DB

    const bySlugMaster = new Map(master.rivers.map(r => [r.slug, r]));
    const bySlugDb     = new Map(dbRows.map(r => [r.slug, r]));

    const plan = {
      generated_at: new Date().toISOString(),
      rules: {
        province_map: Array.from(PROV_MAP.entries()),
        slugify: "lowercase, diacritics stripped, non-alnum -> '-'",
        bbox: "must be [minLon,minLat,maxLon,maxLat] with min<max",
        bilingual: "never drop name_fr/name_en; prefer master if conflict"
      },
      actions: [] // {slug, field, before, after, reason}
    };

    const masterPatch = {
      generated_at: new Date().toISOString(),
      add: [],     // rivers to add into master
      update: []   // {slug, changes:{field:after}}
    };

    // 1) Normaliser chaque entrée master (proposition de corrections internes au master)
    for (const r of master.rivers) {
      const proposed = {};
      // slug
      const idealSlug = slugify(r.slug || r.name_en || r.name_fr);
      if (idealSlug && r.slug !== idealSlug) {
        proposed.slug = idealSlug;
        plan.actions.push({
          slug: r.slug || idealSlug,
          field: "slug",
          before: r.slug,
          after: idealSlug,
          reason: "Slug normalisé (diacritiques/espaces/casse)."
        });
      }
      // province
      const normProv = normalizeProvince(r.province_state);
      if (normProv && r.province_state !== normProv) {
        proposed.province_state = normProv;
        plan.actions.push({
          slug: proposed.slug || r.slug || idealSlug,
          field: "province_state",
          before: r.province_state,
          after: normProv,
          reason: "Code province normalisé (QC/NB/NS/NL/ME)."
        });
      }
      // bbox
      if (r.bbox) {
        const nb = normalizeBBox(r.bbox);
        if (!nb) {
          plan.actions.push({
            slug: proposed.slug || r.slug || idealSlug,
            field: "bbox",
            before: r.bbox,
            after: null,
            reason: "BBox invalide; à revoir manuellement."
          });
        } else if (!shallowEq(nb, r.bbox)) {
          proposed.bbox = nb;
          plan.actions.push({
            slug: proposed.slug || r.slug || idealSlug,
            field: "bbox",
            before: r.bbox,
            after: nb,
            reason: "BBox normalisée (nombres, ordre min<max)."
          });
        }
      }
      if (Object.keys(proposed).length) {
        masterPatch.update.push({ slug: r.slug || idealSlug, changes: proposed });
      }
    }

    // 2) Traiter les "missing_in_master" présents en DB mais pas dans master
    if (delta && Array.isArray(delta.missing_in_master)) {
      for (const missing of delta.missing_in_master) {
        const dbRiver = bySlugDb.get(missing.slug);
        if (!dbRiver) continue;
        // proposer ajout au master avec placeholders minimaux
        const candidate = {
          id: `${(dbRiver.country || "NA").toLowerCase()}-${missing.slug}`,
          name_fr: dbRiver.name_fr || dbRiver.name_en || missing.slug,
          name_en: dbRiver.name_en || dbRiver.name_fr || missing.slug,
          province_state: normalizeProvince(dbRiver.province_state || ""),
          country: dbRiver.country || "",
          slug: slugify(missing.slug),
          bbox: validBBox(dbRiver.bbox) ? dbRiver.bbox : null,
          status: "pending_pdf",
          sources: [],
          last_checked: null
        };
        masterPatch.add.push(candidate);
        plan.actions.push({
          slug: missing.slug,
          field: "master_add",
          before: null,
          after: candidate,
          reason: "Présent en DB mais manquant dans le master → proposition d'ajout."
        });
      }
    }

    // 3) Traiter les "mismatched" (différences entre master et DB)
    if (delta && Array.isArray(delta.mismatched)) {
      for (const mm of delta.mismatched) {
        const slug = mm.slug;
        const mismatches = mm.mismatches || [];
        const rM = bySlugMaster.get(slug);
        const rD = bySlugDb.get(slug);
        if (!rM || !rD) continue;
        
        for (const mismatch of mismatches) {
          // Parse mismatch string like "name_fr: \"Miramichi River\" vs \"Rivière Miramichi\""
          const match = mismatch.match(/(\w+):\s*"([^"]+)"\s+vs\s+"([^"]+)"/);
          if (match) {
            const [, field, dbValue, masterValue] = match;
            plan.actions.push({
              slug,
              field,
              before: dbValue,
              after: masterValue,
              reason: "Conflit DB vs master: on aligne sur le master (source de vérité)."
            });
          }
        }
      }
    }

    // 4) Sorties
    writeJSON(OUT_PLAN, plan);
    writeJSON(OUT_PATCH, masterPatch);

    console.log("✅ Normalisation prête.");
    console.log(`→ Plan       : ${OUT_PLAN}`);
    console.log(`→ Master patch: ${OUT_PATCH}`);
    process.exit(0);
  } catch (e) {
    console.error("❌ Erreur normalisation:", e.message);
    process.exit(1);
  }
})();
