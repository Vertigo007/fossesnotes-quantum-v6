// Chatbot intelligent - Importé depuis Claude.ai
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Chatbot Claude.ai - Prêt à fonctionner!');
});

app.listen(3000, () => {
  console.log('🚀 Chatbot Claude.ai démarré sur le port 3000');
});