require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authMiddleware = require('./auth/middleware');
const anagraficaRoutes = require('./routes/anagrafica');
const tasksRoutes = require('./routes/tasks');
const ocrRoutes = require('./routes/ocr');
const checklistRoutes = require('./routes/checklist');
const documentiRoutes = require('./routes/documenti');
const templatesRoutes = require('./routes/templates');
const calendarioRoutes = require('./routes/calendario');

const app = express();

app.use(cors({ origin: process.env.REDIRECT_URI }));
app.use(express.json({ limit: '10mb' }));

app.get('/health', (_, res) => res.json({ status: 'ok' }));

app.use('/api/anagrafica', authMiddleware, anagraficaRoutes);
app.use('/api/tasks', authMiddleware, tasksRoutes);
app.use('/api/ocr', authMiddleware, ocrRoutes);
app.use('/api/checklist', authMiddleware, checklistRoutes);
app.use('/api/documenti', authMiddleware, documentiRoutes);
app.use('/api/templates', authMiddleware, templatesRoutes);
app.use('/api/calendario', authMiddleware, calendarioRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend in ascolto su porta ${PORT}`));

module.exports = app;
