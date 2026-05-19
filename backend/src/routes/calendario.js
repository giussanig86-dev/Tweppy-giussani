const express = require('express');
const { getEventi, createEvento, updateEvento, deleteEvento } = require('../graph/calendar');

const router = express.Router();

router.get('/eventi', async (req, res) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) return res.status(400).json({ error: 'start e end obbligatori' });
    res.json(await getEventi(req.graphToken, start, end));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/eventi', async (req, res) => {
  try {
    const evento = await createEvento(req.graphToken, req.body);
    res.status(201).json(evento);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/eventi/:id', async (req, res) => {
  try {
    await updateEvento(req.graphToken, req.params.id, req.body);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/eventi/:id', async (req, res) => {
  try {
    await deleteEvento(req.graphToken, req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
