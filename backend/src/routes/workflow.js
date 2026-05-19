const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { WORKFLOWS_PREDEFINITI, eseguiWorkflow } = require('../engines/workflowEngine');
const { getListItems, getListItemById, createListItem, updateListItem, deleteListItem } = require('../graph/sharepoint');

const router = express.Router();
const LIST = 'Workflow_Templates';

router.get('/', async (req, res) => {
  try {
    const custom = await getListItems(req.graphToken, LIST);
    const customParsed = custom.map((w) => ({
      ...w,
      steps: typeof w.steps === 'string' ? JSON.parse(w.steps) : (w.steps || []),
      predefinito: false,
    }));
    res.json([...WORKFLOWS_PREDEFINITI, ...customParsed]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const fields = {
      ...req.body,
      id: uuidv4(),
      steps: JSON.stringify(req.body.steps || []),
      predefinito: false,
      createdAt: new Date().toISOString(),
    };
    res.status(201).json(await createListItem(req.graphToken, LIST, fields));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const fields = { ...req.body, steps: JSON.stringify(req.body.steps || []), updatedAt: new Date().toISOString() };
    await updateListItem(req.graphToken, LIST, req.params.id, fields);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await deleteListItem(req.graphToken, LIST, req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/esegui', async (req, res) => {
  try {
    const { cliente } = req.body;
    if (!cliente) return res.status(400).json({ error: 'cliente obbligatorio' });
    const risultato = await eseguiWorkflow(req.graphToken, req.params.id, cliente);
    res.json(risultato);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
