#!/usr/bin/env node
/**
 * Apply Master Patch Script
 * 
 * Lit data/rivers_master.json + data/rivers_master_patch.json
 * Applique les update[] & add[] en créant un backup rivers_master.json.bak
 * 
 * Usage:
 *   node scripts/apply-master-patch.js
 * 
 * Notes:
 * - Non destructif: crée toujours un backup avant modification
 * - Bilingue: préserve les champs name_fr/name_en
 * - Validation: vérifie la cohérence avant application
 */

const fs = require('fs');
const path = require('path');

// Configuration
const MASTER_FILE = path.join(__dirname, '../data/rivers_master.json');
const PATCH_FILE = path.join(__dirname, '../data/rivers_master_patch.json');
const BACKUP_FILE = path.join(__dirname, '../data/rivers_master.json.bak');

function readJSON(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Fichier introuvable: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function writeJSON(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function validateRiver(river, context = '') {
  const required = ['id', 'name_fr', 'name_en', 'province_state', 'country', 'slug'];
  const missing = required.filter(field => !river[field]);
  
  if (missing.length > 0) {
    throw new Error(`${context} River missing required fields: ${missing.join(', ')}`);
  }
  
  // Validate bbox if present
  if (river.bbox && (!Array.isArray(river.bbox) || river.bbox.length !== 4)) {
    throw new Error(`${context} River has invalid bbox: ${JSON.stringify(river.bbox)}`);
  }
  
  return true;
}

function applyPatch() {
  try {
    console.log('🔧 Application du patch master...');
    
    // Lire les fichiers
    const master = readJSON(MASTER_FILE);
    const patch = readJSON(PATCH_FILE);
    
    console.log(`📖 Master: ${master.rivers.length} rivières`);
    console.log(`📋 Patch: ${patch.update.length} updates, ${patch.add.length} ajouts`);
    
    // Créer backup
    console.log('💾 Création du backup...');
    writeJSON(BACKUP_FILE, master);
    console.log(`✅ Backup créé: ${BACKUP_FILE}`);
    
    // Appliquer les updates
    const updatedRivers = [...master.rivers];
    const updateMap = new Map();
    
    for (const update of patch.update) {
      const riverIndex = updatedRivers.findIndex(r => r.slug === update.slug);
      if (riverIndex === -1) {
        console.warn(`⚠️  River non trouvée pour update: ${update.slug}`);
        continue;
      }
      
      const river = updatedRivers[riverIndex];
      const updatedRiver = { ...river, ...update.changes };
      
      // Validation
      validateRiver(updatedRiver, `Update ${update.slug}`);
      
      updatedRivers[riverIndex] = updatedRiver;
      updateMap.set(update.slug, true);
      
      console.log(`🔄 Updated: ${update.slug} (${Object.keys(update.changes).join(', ')})`);
    }
    
    // Appliquer les ajouts
    for (const newRiver of patch.add) {
      // Validation
      validateRiver(newRiver, `Add ${newRiver.slug}`);
      
      // Vérifier si la rivière existe déjà
      const exists = updatedRivers.some(r => r.slug === newRiver.slug);
      if (exists) {
        console.warn(`⚠️  River déjà présente, skip: ${newRiver.slug}`);
        continue;
      }
      
      updatedRivers.push(newRiver);
      console.log(`➕ Added: ${newRiver.slug} (${newRiver.name_fr})`);
    }
    
    // Mettre à jour le master
    const updatedMaster = {
      ...master,
      rivers: updatedRivers,
      metadata: {
        ...master.metadata,
        last_updated: new Date().toISOString(),
        patch_applied: patch.generated_at,
        total_rivers: updatedRivers.length
      }
    };
    
    // Écrire le fichier mis à jour
    writeJSON(MASTER_FILE, updatedMaster);
    
    console.log('\n📊 RÉSUMÉ');
    console.log('==========');
    console.log(`✅ Updates appliqués: ${updateMap.size}`);
    console.log(`✅ Ajouts appliqués: ${patch.add.length}`);
    console.log(`📈 Total rivières: ${updatedRivers.length}`);
    console.log(`💾 Backup: ${BACKUP_FILE}`);
    console.log(`📝 Master mis à jour: ${MASTER_FILE}`);
    
    console.log('\n🎉 Patch appliqué avec succès!');
    
  } catch (error) {
    console.error('❌ Erreur application patch:', error.message);
    process.exit(1);
  }
}

// Exécution
if (require.main === module) {
  applyPatch();
}

module.exports = { applyPatch };



