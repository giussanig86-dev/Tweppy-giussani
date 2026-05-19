require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authMiddleware = require('./auth/middleware');
const anagraficaRoutes = require('./routes/anagrafica');

const app = express();

app.use(cors({ origin: process.env.REDIRECT_URI }));
app.use(express.json({ limit: '10mb' }));

app.get('/health', (_, res) => res.json({ status: 'ok' }));

app.use('/api/anagrafica', authMiddleware, anagraficaRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend in ascolto su porta ${PORT}`));

module.exports = app;
