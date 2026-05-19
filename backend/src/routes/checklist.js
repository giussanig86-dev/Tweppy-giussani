const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { generateChecklist } = require('../engines/checklistEngine');
const { getListItems, createListItem, updateListItem, deleteListItem } = require('../graph/sharepoint');

const router = express.Router();
const LIST = 'Checklist_Adempimenti';

router.get('/:clienteId/:anno', async (req, res) => {
  try {
    const { clienteId, anno } = req.params;
    const filter = `fields/clienteId eq '${clienteId}' and fields/anno eq ${anno}`;
    const items = await getListItems(req.graphToken, LIST, filter);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/genera', async (req, res) => {
  try {
    const { cliente, anno } = req.body;
    if (!cliente || !anno) return res.status(400).json({ error: 'cliente e anno obbligatori' });

    // Elimina checklist esistente per questo cliente/anno
    const filter = `fields/clienteId eq '${cliente.id}' and fields/anno eq ${anno}`;
    const existing = await getListItems(req.graphToken, LIST, filter);
    await Promise.all(existing.map((item) => deleteListItem(req.graphToken, LIST, item.id)));

    // Genera nuova checklist
    const adempimenti = generateChecklist(cliente, parseInt(anno));

    const created = await Promise.all(
      adempimenti.map((a) =>
        createListItem(req.graphToken, LIST, {
          ...a,
          id: uuidv4(),
          clienteId: cliente.id,
          clienteNome: cliente.ragioneSociale,
          anno: parseInt(anno),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      )
    );

    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    await updateListItem(req.graphToken, LIST, req.params.id, {
      stato: req.body.stato,
      note: req.body.note,
      updatedAt: new Date().toISOString(),
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
