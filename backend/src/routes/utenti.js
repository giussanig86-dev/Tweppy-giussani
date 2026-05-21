const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getListItems, createListItem, updateListItem, deleteListItem } = require('../graph/sharepoint');

const router = express.Router();
const LIST = 'Ruoli_Utenti';

router.get('/', async (req, res) => {
  try {
    res.json(await getListItems(req.graphToken, LIST));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { email, ruolo, nome } = req.body;
    if (!email || !ruolo) return res.status(400).json({ error: 'email e ruolo obbligatori' });
    const item = await createListItem(req.graphToken, LIST, { id: uuidv4(), email: email.toLowerCase(), ruolo, nome: nome || email });
    res.status(201).json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    await updateListItem(req.graphToken, LIST, req.params.id, req.body);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await deleteListItem(req.graphToken, LIST, req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
