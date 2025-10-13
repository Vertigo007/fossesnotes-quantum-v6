// Service d'enrichissement pour les éclosions d'insectes
// Basé sur la saison, la température, et les données historiques

function inferHatches(river, dateISO) {
  try {
    const date = new Date(dateISO);
    const month = date.getMonth() + 1; // 1-12
    const day = date.getDate();
    
    // Calendrier d'éclosions basé sur la saison (Québec/Canada)
    const hatches = [];
    
    // Printemps (Avril-Mai)
    if (month >= 4 && month <= 5) {
      hatches.push({
        insect: 'Blue Winged Olive',
        fr: 'Éphémère à ailes bleues',
        intensity: month === 4 ? 'moderate' : 'heavy',
        time: 'afternoon',
        size: '16-18'
      });
      
      if (month === 5) {
        hatches.push({
          insect: 'Hendrickson',
          fr: 'Hendrickson',
          intensity: 'heavy',
          time: 'evening',
          size: '14'
        });
      }
    }
    
    // Été (Juin-Août)
    if (month >= 6 && month <= 8) {
      hatches.push({
        insect: 'Caddis',
        fr: 'Phrygane',
        intensity: 'heavy',
        time: 'evening',
        size: '14-16'
      });
      
      if (month >= 7) {
        hatches.push({
          insect: 'Trico',
          fr: 'Trico',
          intensity: 'moderate',
          time: 'morning',
          size: '20-22'
        });
      }
    }
    
    // Automne (Septembre-Octobre)
    if (month >= 9 && month <= 10) {
      hatches.push({
        insect: 'Blue Winged Olive',
        fr: 'Éphémère à ailes bleues',
        intensity: 'heavy',
        time: 'afternoon',
        size: '18-20'
      });
      
      if (month === 10) {
        hatches.push({
          insect: 'Midges',
          fr: 'Moucherons',
          intensity: 'moderate',
          time: 'all_day',
          size: '22-24'
        });
      }
    }
    
    return {
      date: dateISO,
      hatches: hatches,
      source: 'hatches-calendar',
      confidence: 'medium',
      notes_fr: hatches.length > 0 ? 
        `Éclosions prévues: ${hatches.map(h => h.fr).join(', ')}` : 
        'Aucune éclosion majeure prévue',
      notes_en: hatches.length > 0 ? 
        `Expected hatches: ${hatches.map(h => h.insect).join(', ')}` : 
        'No major hatches expected'
    };
    
  } catch (error) {
    console.error('Hatches inference error:', error.message);
    return {
      date: dateISO,
      hatches: [],
      source: 'hatches-error',
      confidence: 'low',
      error: error.message
    };
  }
}

// Pour l'historique précis
function inferHistoricalHatches(river, timestamp) {
  try {
    const date = new Date(timestamp);
    return inferHatches(river, date.toISOString().slice(0, 10));
  } catch (error) {
    console.error('Historical hatches inference error:', error.message);
    return null;
  }
}

module.exports = { inferHatches, inferHistoricalHatches };



