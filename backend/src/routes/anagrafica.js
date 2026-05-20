const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getListItems, createListItem, updateListItem, deleteListItem } = require('../graph/sharepoint');
const { validateCodiceFiscale, validatePartitaIva } = require('../utils/validators');

const router = express.Router();
const LIST_NAME = 'Anagrafica_GDS';

router.get('/', async (req, res) => {
  try {
    const items = await getListItems(req.graphToken, LIST_NAME);
    const attivi = items.filter((c) => c.stato !== 'eliminato');
    res.json(attivi);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const items = await getListItems(req.graphToken, LIST_NAME);
    const cliente = items.find((c) => c.id === req.params.id);
    if (!cliente) return res.status(404).json({ error: 'Cliente non trovato' });
    res.json(cliente);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = req.body;

    if (data.codiceFiscale && !validateCodiceFiscale(data.codiceFiscale)) {
      return res.status(400).json({ error: 'Codice fiscale non valido' });
    }
    if (data.partitaIva && !validatePartitaIva(data.partitaIva)) {
      return res.status(400).json({ error: 'Partita IVA non valida' });
    }

    const fields = {
      ...data,
      id: uuidv4(),
      stato: 'attivo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const created = await createListItem(req.graphToken, LIST_NAME, fields);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const data = req.body;

    if (data.codiceFiscale && !validateCodiceFiscale(data.codiceFiscale)) {
      return res.status(400).json({ error: 'Codice fiscale non valido' });
    }
    if (data.partitaIva && !validatePartitaIva(data.partitaIva)) {
      return res.status(400).json({ error: 'Partita IVA non valida' });
    }

    const fields = { ...data, updatedAt: new Date().toISOString() };
    await updateListItem(req.graphToken, LIST_NAME, req.params.id, fields);
    if (data.stato === 'cessato') {
      const today = new Date().toISOString().slice(0, 10);
      const safeId = req.params.id.replace(/'/g, "''");
      const filter = `fields/clienteId eq '${safeId}'`;
      const clItems = await getListItems(req.graphToken, 'Checklist_Adempimenti', filter);
      const futuri = clItems.filter(i => (i.scadenza || '') >= today);
      await Promise.all(futuri.map(i => deleteListItem(req.graphToken, 'Checklist_Adempimenti', i.id)));
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Soft delete — il cliente rimane nel sistema con stato "eliminato"
router.delete('/:id', async (req, res) => {
  try {
    await updateListItem(req.graphToken, LIST_NAME, req.params.id, {
      stato: 'eliminato',
      updatedAt: new Date().toISOString(),
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
