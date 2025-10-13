#!/usr/bin/env node
/**
 * Import Rivers Master List Script
 * Imports bilingual master list of Atlantic Salmon rivers and computes delta vs current DB
 */

const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const sequelize = require('../server/config/database');
const Riviere = require('../server/models/Riviere')(sequelize);

// Configuration
const MASTER_FILE = path.join(__dirname, '../data/rivers_master.json');
const DELTA_FILE = path.join(__dirname, '../data/rivers_delta.json');

// Schema validation
function validateMasterSchema(data) {
  const requiredFields = ['metadata', 'rivers'];
  const requiredRiverFields = ['id', 'name_fr', 'name_en', 'province_state', 'country', 'slug', 'bbox', 'status', 'sources', 'last_checked'];
  
  // Check top-level structure
  for (const field of requiredFields) {
    if (!data[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  
  // Check rivers array
  if (!Array.isArray(data.rivers)) {
    throw new Error('rivers must be an array');
  }
  
  // Check each river
  for (let i = 0; i < data.rivers.length; i++) {
    const river = data.rivers[i];
    for (const field of requiredRiverFields) {
      if (!(field in river)) {
        throw new Error(`River ${i} missing required field: ${field}`);
      }
    }
    
    // Validate bbox format [minLon, minLat, maxLon, maxLat]
    if (!Array.isArray(river.bbox) || river.bbox.length !== 4) {
      throw new Error(`River ${i} invalid bbox format`);
    }
    
    // Validate sources array
    if (!Array.isArray(river.sources)) {
      throw new Error(`River ${i} sources must be an array`);
    }
  }
  
  return true;
}

// Load master data
function loadMasterData() {
  try {
    console.log('📖 Loading master data...');
    const data = JSON.parse(fs.readFileSync(MASTER_FILE, 'utf8'));
    
    if (validateMasterSchema(data)) {
      console.log(`✅ Loaded ${data.rivers.length} rivers from master file`);
      return data.rivers;
    }
  } catch (error) {
    console.error('❌ Error loading master data:', error.message);
    process.exit(1);
  }
}

// Check if database supports PostGIS
async function checkPostGISSupport() {
  try {
    const result = await sequelize.query("SELECT PostGIS_Version()", { type: sequelize.QueryTypes.SELECT });
    return result.length > 0;
  } catch (error) {
    return false; // SQLite or PostgreSQL without PostGIS
  }
}

// Add missing columns if needed
async function ensureBilingualColumns() {
  try {
    console.log('🔧 Checking for bilingual columns...');
    
    // Get table description
    const tableInfo = await sequelize.query("PRAGMA table_info(rivieres)", { type: sequelize.QueryTypes.SELECT });
    const existingColumns = tableInfo.map(col => col.name);
    
    const columnsToAdd = [];
    
    // Check for name_fr column
    if (!existingColumns.includes('name_fr')) {
      columnsToAdd.push("ADD COLUMN name_fr VARCHAR(200)");
    }
    
    // Check for name_en column
    if (!existingColumns.includes('name_en')) {
      columnsToAdd.push("ADD COLUMN name_en VARCHAR(200)");
    }
    
    // Check for slug column
    if (!existingColumns.includes('slug')) {
      columnsToAdd.push("ADD COLUMN slug VARCHAR(200)");
    }
    
    // Check for region column (province_state mapping)
    if (!existingColumns.includes('region')) {
      columnsToAdd.push("ADD COLUMN region VARCHAR(100)");
    }
    
    // Check for country column
    if (!existingColumns.includes('country')) {
      columnsToAdd.push("ADD COLUMN country VARCHAR(50)");
    }
    
    // Check for bbox column
    if (!existingColumns.includes('bbox')) {
      columnsToAdd.push("ADD COLUMN bbox TEXT");
    }
    
    // Check for status column
    if (!existingColumns.includes('status')) {
      columnsToAdd.push("ADD COLUMN status VARCHAR(50) DEFAULT 'active'");
    }
    
    // Check for sources column
    if (!existingColumns.includes('sources')) {
      columnsToAdd.push("ADD COLUMN sources TEXT");
    }
    
    // Check for last_checked column
    if (!existingColumns.includes('last_checked')) {
      columnsToAdd.push("ADD COLUMN last_checked DATE");
    }
    
    // Add columns if needed
    if (columnsToAdd.length > 0) {
      console.log(`📝 Adding ${columnsToAdd.length} missing columns...`);
      for (const columnDef of columnsToAdd) {
        await sequelize.query(`ALTER TABLE rivieres ${columnDef}`);
      }
      console.log('✅ Columns added successfully');
    } else {
      console.log('✅ All bilingual columns already exist');
    }
    
  } catch (error) {
    console.error('❌ Error adding columns:', error.message);
    throw error;
  }
}

// Import rivers with upsert logic
async function importRivers(masterRivers) {
  const delta = {
    added: [],
    missing_in_master: [],
    mismatched: [],
    total_processed: 0,
    total_added: 0,
    total_updated: 0,
    total_errors: 0
  };
  
  console.log('🔄 Starting river import...');
  
  for (const masterRiver of masterRivers) {
    try {
      delta.total_processed++;
      
      // Prepare river data for upsert
      const riverData = {
        nom: masterRiver.name_fr, // Keep existing field
        nom_anglais: masterRiver.name_en, // Keep existing field
        name_fr: masterRiver.name_fr,
        name_en: masterRiver.name_en,
        slug: masterRiver.slug,
        region: masterRiver.province_state,
        country: masterRiver.country,
        province_etat: masterRiver.province_state,
        pays: masterRiver.country,
        bbox: JSON.stringify(masterRiver.bbox),
        status: masterRiver.status,
        sources: JSON.stringify(masterRiver.sources),
        last_checked: masterRiver.last_checked,
        // Set default values for required fields
        type: 'riviere',
        classe: 2, // Standard
        latitude: (masterRiver.bbox[1] + masterRiver.bbox[3]) / 2, // Center of bbox
        longitude: (masterRiver.bbox[0] + masterRiver.bbox[2]) / 2,
        longueur_km: 0, // Will need to be updated with real data
        donnees_verifiees: false
      };
      
             // Try to find existing river by slug or name
       let existingRiver = await Riviere.findOne({
         where: {
           [Op.or]: [
             { slug: masterRiver.slug },
             { nom: masterRiver.name_fr },
             { nom_anglais: masterRiver.name_en }
           ]
         }
       });
      
      if (existingRiver) {
        // Check for mismatches
        const mismatches = [];
        if (existingRiver.nom !== masterRiver.name_fr) {
          mismatches.push(`name_fr: "${existingRiver.nom}" vs "${masterRiver.name_fr}"`);
        }
        if (existingRiver.nom_anglais !== masterRiver.name_en) {
          mismatches.push(`name_en: "${existingRiver.nom_anglais}" vs "${masterRiver.name_en}"`);
        }
        if (existingRiver.province_etat !== masterRiver.province_state) {
          mismatches.push(`province: "${existingRiver.province_etat}" vs "${masterRiver.province_state}"`);
        }
        
        if (mismatches.length > 0) {
          delta.mismatched.push({
            id: masterRiver.id,
            slug: masterRiver.slug,
            name_fr: masterRiver.name_fr,
            name_en: masterRiver.name_en,
            mismatches
          });
        }
        
        // Update existing river
        await existingRiver.update(riverData);
        delta.total_updated++;
        console.log(`🔄 Updated: ${masterRiver.name_fr}`);
      } else {
        // Create new river
        await Riviere.create(riverData);
        delta.added.push({
          id: masterRiver.id,
          slug: masterRiver.slug,
          name_fr: masterRiver.name_fr,
          name_en: masterRiver.name_en,
          province_state: masterRiver.province_state,
          country: masterRiver.country
        });
        delta.total_added++;
        console.log(`➕ Added: ${masterRiver.name_fr}`);
      }
      
         } catch (error) {
       delta.total_errors++;
       console.error(`❌ Error processing ${masterRiver.name_fr}:`, error.message);
       if (error.name === 'SequelizeValidationError') {
         console.error(`   Validation details:`, error.errors.map(e => `${e.path}: ${e.message}`).join(', '));
       }
     }
  }
  
  // Find rivers in DB that are not in master
  const dbRivers = await Riviere.findAll({
    attributes: ['id', 'nom', 'nom_anglais', 'slug', 'province_etat', 'pays']
  });
  
  const masterSlugs = new Set(masterRivers.map(r => r.slug));
  const masterNames = new Set([
    ...masterRivers.map(r => r.name_fr),
    ...masterRivers.map(r => r.name_en)
  ]);
  
  for (const dbRiver of dbRivers) {
    const inMaster = masterSlugs.has(dbRiver.slug) || 
                    masterNames.has(dbRiver.nom) || 
                    masterNames.has(dbRiver.nom_anglais);
    
    if (!inMaster) {
      delta.missing_in_master.push({
        id: dbRiver.id,
        nom: dbRiver.nom,
        nom_anglais: dbRiver.nom_anglais,
        slug: dbRiver.slug,
        province_etat: dbRiver.province_etat,
        pays: dbRiver.pays
      });
    }
  }
  
  return delta;
}

// Save delta report
function saveDeltaReport(delta) {
  try {
    const report = {
      generated_at: new Date().toISOString(),
      summary: {
        total_processed: delta.total_processed,
        total_added: delta.total_added,
        total_updated: delta.total_updated,
        total_errors: delta.total_errors,
        missing_in_master: delta.missing_in_master.length,
        mismatched: delta.mismatched.length
      },
      added: delta.added,
      missing_in_master: delta.missing_in_master,
      mismatched: delta.mismatched
    };
    
    fs.writeFileSync(DELTA_FILE, JSON.stringify(report, null, 2));
    console.log(`📊 Delta report saved to: ${DELTA_FILE}`);
  } catch (error) {
    console.error('❌ Error saving delta report:', error.message);
  }
}

// Print summary
function printSummary(delta) {
  console.log('\n📈 IMPORT SUMMARY');
  console.log('================');
  console.log(`Total processed: ${delta.total_processed}`);
  console.log(`Added: ${delta.total_added}`);
  console.log(`Updated: ${delta.total_updated}`);
  console.log(`Errors: ${delta.total_errors}`);
  console.log(`Missing in master: ${delta.missing_in_master.length}`);
  console.log(`Mismatched: ${delta.mismatched.length}`);
  
  if (delta.added.length > 0) {
    console.log('\n➕ ADDED RIVERS:');
    delta.added.forEach(river => {
      console.log(`  - ${river.name_fr} (${river.province_state}, ${river.country})`);
    });
  }
  
  if (delta.missing_in_master.length > 0) {
    console.log('\n❓ MISSING IN MASTER:');
    delta.missing_in_master.forEach(river => {
      console.log(`  - ${river.nom} (${river.province_etat}, ${river.pays})`);
    });
  }
  
  if (delta.mismatched.length > 0) {
    console.log('\n⚠️  MISMATCHED RIVERS:');
    delta.mismatched.forEach(river => {
      console.log(`  - ${river.name_fr}: ${river.mismatches.join(', ')}`);
    });
  }
}

// Main function
async function main() {
  try {
    console.log('🚀 Starting Rivers Master Import');
    console.log('================================');
    
    // Load master data
    const masterRivers = loadMasterData();
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Check PostGIS support
    const hasPostGIS = await checkPostGISSupport();
    console.log(`🗺️  PostGIS support: ${hasPostGIS ? 'Yes' : 'No'}`);
    
    // Ensure bilingual columns exist
    await ensureBilingualColumns();
    
    // Import rivers
    const delta = await importRivers(masterRivers);
    
    // Save and print results
    saveDeltaReport(delta);
    printSummary(delta);
    
    console.log('\n🎉 Import completed successfully!');
    
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
