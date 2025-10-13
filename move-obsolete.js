const fs = require('fs');
const path = require('path');

// Liste des fichiers à déplacer (tu peux ajouter plus de fichiers ou répertoires si nécessaire)
const obsoleteFiles = [
  'client', // Répertoire complet
  'server/routes/journal.js', // Obsolète, remplacé par fishingLog.js
  'server/routes/posts.js', // Obsolète, remplacé par community.js
  'scripts/add-comprehensive-rivers.js', // Obsolète
  'scripts/import-rivers-master.js', // Erreurs dans l'import
  'tests/ui.test.js', // Supprimé
  'client/src/pages/Journal.jsx', // Remplacé par /logs
  'client/src/pages/Map.jsx', // Non fonctionnel
  'client/src/components/FishingEntryForm.jsx', // Obsolète
  'client/src/pages/Map.jsx', // Non fonctionnel
];

// Chemin du dossier 'obsolete'
const obsoleteDir = path.join(__dirname, 'obsolete');

// Fonction pour déplacer les fichiers
const moveFile = (source, destination) => {
  if (!fs.existsSync(source)) {
    console.log(`🚨 Le fichier ou répertoire n'existe pas : ${source}`);
    return;
  }

  // Créer le dossier 'obsolete' s'il n'existe pas
  if (!fs.existsSync(obsoleteDir)) {
    fs.mkdirSync(obsoleteDir);
  }

  const destinationPath = path.join(obsoleteDir, path.basename(source));

  try {
    if (fs.lstatSync(source).isDirectory()) {
      // Si c'est un répertoire, déplacer tout le répertoire
      fs.renameSync(source, destinationPath);
      console.log(`✅ Répertoire déplacé : ${source} → ${destinationPath}`);
    } else {
      // Si c'est un fichier, déplacer le fichier
      fs.renameSync(source, destinationPath);
      console.log(`✅ Fichier déplacé : ${source} → ${destinationPath}`);
    }
  } catch (err) {
    console.error(`❌ Erreur lors du déplacement de ${source} :`, err);
  }
};

// Déplacer chaque fichier obsolète
obsoleteFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  moveFile(filePath, obsoleteDir);
});

console.log('🗂️ Processus de déplacement des fichiers obsolètes terminé.');
