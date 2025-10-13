#!/usr/bin/env node

/**
 * Simplified Import Rivers Master List Script
 * Works with existing database structure
 */

const fs = require('fs');
const path = require('path');
const sequelize = require('../server/config/database');
const Riviere = require('../server/models/Riviere')(sequelize);

// Configuration
const MASTER_FILE = path.join(__dirname, '../data/rivers_master.json');
const DELTA_FILE = path.join(__dirname, '../data/rivers_delta.json');

console.log('🌊 FOSSESNOTES - Import Rivers Master List (Simplified)');
console.log('=====================================================');
console.log(`Master file: ${MASTER_FILE}`);
console.log('');

// 1. Load and validate master data
function loadMasterData() {
  try {
    const data = JSON.parse(fs.readFileSync(MASTER_FILE, 'utf8'));
    
    if (!data.rivers || !Array.isArray(data.rivers)) {
      throw new Error('Invalid schema: rivers array missing');
    }
    
    console.log(`✅ Loaded ${data.rivers.length} rivers from master list`);
    return data.rivers;
  } catch (error) {
    console.error('❌ Error loading master data:', error.message);
    process.exit(1);
  }
}

// 2. Import rivers and compute delta
async function importRivers(masterRivers) {
  const delta = {
    added: [],
    missing_in_master: [],
    mismatched: [],
    summary: {
      total_master: masterRivers.length,
      total_db_before: 0,
      total_db_after: 0,
      added_count: 0,
      updated_count: 0,
      mismatched_count: 0
    }
  };

  try {
    // Get existing rivers
    const existingRivers = await Riviere.findAll();
    delta.summary.total_db_before = existingRivers.length;
    
    console.log(`📊 Found ${existingRivers.length} rivers in database`);
    
    // Create lookup maps
    const existingByNom = new Map(existingRivers.map(r => [r.nom, r]));
    const masterByNom = new Map(masterRivers.map(r => [r.name_fr, r]));
    
    // Process each master river
    for (const masterRiver of masterRivers) {
      const existing = existingByNom.get(masterRiver.name_fr);
      
      if (!existing) {
        // New river - add it
        const newRiver = await Riviere.create({
          nom: masterRiver.name_fr,
          nom_anglais: masterRiver.name_en,
          pays: masterRiver.country,
          province_etat: masterRiver.province_state,
          region: masterRiver.province_state, // Use province as region for now
          type: 'riviere',
          classe: 2, // Default to Standard
          latitude: (masterRiver.bbox[1] + masterRiver.bbox[3]) / 2, // Center of bbox
          longitude: (masterRiver.bbox[0] + masterRiver.bbox[2]) / 2,
          longueur_km: 50, // Default value
          statut_conditions: masterRiver.status || 'active',
          source_donnees: masterRiver.sources?.join(', ') || 'master_list'
        });
        
        delta.added.push({
          id: newRiver.id,
          nom: masterRiver.name_fr,
          nom_anglais: masterRiver.name_en
        });
        
        delta.summary.added_count++;
        console.log(`➕ Added: ${masterRiver.name_fr}`);
      } else {
        // Existing river - check for mismatches
        const mismatches = [];
        
        if (existing.nom_anglais !== masterRiver.name_en) {
          mismatches.push(`nom_anglais: "${existing.nom_anglais}" vs "${masterRiver.name_en}"`);
        }
        if (existing.province_etat !== masterRiver.province_state) {
          mismatches.push(`province: "${existing.province_etat}" vs "${masterRiver.province_state}"`);
        }
        if (existing.pays !== masterRiver.country) {
          mismatches.push(`pays: "${existing.pays}" vs "${masterRiver.country}"`);
        }
        
        if (mismatches.length > 0) {
          delta.mismatched.push({
            id: existing.id,
            nom: masterRiver.name_fr,
            mismatches
          });
          delta.summary.mismatched_count++;
          console.log(`⚠️  Mismatch: ${masterRiver.name_fr} - ${mismatches.join(', ')}`);
        }
        
        // Update with master data
        await existing.update({
          nom_anglais: masterRiver.name_en,
          province_etat: masterRiver.province_state,
          pays: masterRiver.country,
          latitude: (masterRiver.bbox[1] + masterRiver.bbox[3]) / 2,
          longitude: (masterRiver.bbox[0] + masterRiver.bbox[2]) / 2,
          statut_conditions: masterRiver.status || 'active',
          source_donnees: masterRiver.sources?.join(', ') || 'master_list'
        });
        
        delta.summary.updated_count++;
      }
    }
    
    // Find rivers in DB but not in master
    existingRivers.forEach(existing => {
      if (!masterByNom.has(existing.nom)) {
        delta.missing_in_master.push({
          id: existing.id,
          nom: existing.nom,
          nom_anglais: existing.nom_anglais
        });
      }
    });
    
    // Final count
    const finalCount = await Riviere.count();
    delta.summary.total_db_after = finalCount;
    
    return delta;
  } catch (error) {
    console.error('❌ Error importing rivers:', error.message);
    throw error;
  }
}

// 3. Save delta report
function saveDeltaReport(delta) {
  try {
    fs.writeFileSync(DELTA_FILE, JSON.stringify(delta, null, 2));
    console.log(`📄 Delta report saved to: ${DELTA_FILE}`);
  } catch (error) {
    console.error('❌ Error saving delta report:', error.message);
  }
}

// 4. Print summary
function printSummary(delta) {
  console.log('');
  console.log('📈 IMPORT SUMMARY');
  console.log('=================');
  console.log(`Master rivers: ${delta.summary.total_master}`);
  console.log(`DB before: ${delta.summary.total_db_before}`);
  console.log(`DB after: ${delta.summary.total_db_after}`);
  console.log(`Added: ${delta.summary.added_count}`);
  console.log(`Updated: ${delta.summary.updated_count}`);
  console.log(`Mismatched: ${delta.summary.mismatched_count}`);
  console.log(`Missing in master: ${delta.missing_in_master.length}`);
  
  if (delta.added.length > 0) {
    console.log('');
    console.log('➕ ADDED RIVERS:');
    delta.added.forEach(river => {
      console.log(`  - ${river.nom} (${river.nom_anglais})`);
    });
  }
  
  if (delta.missing_in_master.length > 0) {
    console.log('');
    console.log('❓ MISSING IN MASTER:');
    delta.missing_in_master.forEach(river => {
      console.log(`  - ${river.nom} (${river.nom_anglais})`);
    });
  }
  
  if (delta.mismatched.length > 0) {
    console.log('');
    console.log('⚠️  MISMATCHED RIVERS:');
    delta.mismatched.forEach(river => {
      console.log(`  - ${river.nom}: ${river.mismatches.join(', ')}`);
    });
  }
}

// Main execution
async function main() {
  try {
    // Load master data
    const masterRivers = loadMasterData();
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Import rivers
    const delta = await importRivers(masterRivers);
    
    // Save and print results
    saveDeltaReport(delta);
    printSummary(delta);
    
    console.log('');
    console.log('🎉 Import completed successfully!');
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main, loadMasterData };



