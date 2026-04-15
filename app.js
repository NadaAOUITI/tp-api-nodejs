// app.js — définit l'application, ne démarre rien
const express = require('express');
const etudiantRoutes = require('./routes/etudiantRoutes');

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'API Gestion Étudiants v2.0 - par Alice' });
});

app.use('/api/etudiants', etudiantRoutes);

module.exports = app;
