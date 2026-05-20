const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getListItems, createListItem, updateListItem, deleteListItem } = require('../graph/sharepoint');

const router = express.Router();
const LIST = 'Task_Log';
const CHAT_LIST = 'Task_Messaggi';

router.get('/', async (req, res) => {
  try {
    const tasks = await getListItems(req.graphToken, LIST);
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const fields = {
      ...req.body,
      id: uuidv4(),
      stato: req.body.stato || 'da_fare',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const created = await createListItem(req.graphToken, LIST, fields);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const fields = { ...req.body, updatedAt: new Date().toISOString() };
    await updateListItem(req.graphToken, LIST, req.params.id, fields);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await deleteListItem(req.graphToken, LIST, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/messaggi', async (req, res) => {
  try {
    const safeId = req.params.id.replace(/'/g, "''");
    const items = await getListItems(req.graphToken, CHAT_LIST, `fields/taskId eq '${safeId}'`);
    items.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/messaggi', async (req, res) => {
  try {
    const { testo, autore } = req.body;
    if (!testo?.trim()) return res.status(400).json({ error: 'Testo obbligatorio' });
    const fields = {
      taskId: req.params.id,
      testo: testo.trim(),
      autore: autore || 'Utente',
      createdAt: new Date().toISOString(),
    };
    const created = await createListItem(req.graphToken, CHAT_LIST, fields);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
