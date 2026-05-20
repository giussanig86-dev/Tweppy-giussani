const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { generateChecklist, generateAdempimentiAnno } = require('../engines/checklistEngine');
const { getListItems, createListItem, updateListItem, deleteListItem } = require('../graph/sharepoint');
const { createEvento } = require('../graph/calendar');

const router = express.Router();
const LIST = 'Checklist_Adempimenti';

// Tutti gli adempimenti per anno (senza filtro cliente)
router.get('/anno/:anno', async (req, res) => {
  try {
    const { anno } = req.params;
    const filter = `fields/anno eq ${anno} and fields/clienteId eq ''`;
    const items = await getListItems(req.graphToken, LIST, filter);
    res.json(items.sort((a, b) => (a.scadenza || '').localeCompare(b.scadenza || '')));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Matrice riepilogo: tutti gli adempimenti per-cliente di un anno, filtro mese opzionale
router.get('/matrice/:anno', async (req, res) => {
  try {
    const anno = parseInt(req.params.anno);
    const mese = req.query.mese ? String(req.query.mese).padStart(2, '0') : null;
    const filter = `fields/anno eq ${anno}`;
    let items = await getListItems(req.graphToken, LIST, filter);
    items = items.filter(i => i.clienteId && i.clienteId.trim() !== '');
    if (mese) {
      items = items.filter(i => i.scadenza?.startsWith(`${anno}-${mese}`));
    }
    res.json(items);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Elimina tutti gli adempimenti di un cliente
router.delete('/cliente/:clienteId', async (req, res) => {
  try {
    const safeId = req.params.clienteId.replace(/'/g, "''");
    const filter = `fields/clienteId eq '${safeId}'`;
    const items = await getListItems(req.graphToken, LIST, filter);
    await Promise.all(items.map(i => deleteListItem(req.graphToken, LIST, i.id)));
    res.json({ eliminati: items.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Adempimenti per singolo cliente + anno
router.get('/:clienteId/:anno', async (req, res) => {
  try {
    const { clienteId, anno } = req.params;
    const filter = `fields/clienteId eq '${clienteId}' and fields/anno eq ${anno}`;
    const items = await getListItems(req.graphToken, LIST, filter);
    res.json(items);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Genera scadenzario standard per l'anno (non per cliente) + eventi calendario
router.post('/genera-anno', async (req, res) => {
  try {
    const { anno } = req.body;
    if (!anno) return res.status(400).json({ error: 'anno obbligatorio' });

    const filter = `fields/anno eq ${anno} and fields/clienteId eq ''`;
    const existing = await getListItems(req.graphToken, LIST, filter);
    await Promise.all(existing.map(i => deleteListItem(req.graphToken, LIST, i.id)));

    const adempimenti = generateAdempimentiAnno(parseInt(anno));
    const created = await Promise.all(
      adempimenti.map(a =>
        createListItem(req.graphToken, LIST, {
          ...a,
          id: uuidv4(),
          clienteId: '',
          clienteNome: '',
          anno: parseInt(anno),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      )
    );

    // Crea eventi calendario per ogni adempimento (errori non bloccanti)
    await Promise.allSettled(
      created.map(a =>
        createEvento(req.graphToken, {
          titolo: a.adempimento,
          tipo: 'scadenza',
          start: `${a.scadenza}T09:00:00`,
          end: `${a.scadenza}T10:00:00`,
          note: a.note || '',
          clienteId: '',
          clienteNome: '',
        })
      )
    );

    res.status(201).json(created);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Genera checklist per singolo cliente + anno
router.post('/genera', async (req, res) => {
  try {
    const { cliente, anno } = req.body;
    if (!cliente || !anno) return res.status(400).json({ error: 'cliente e anno obbligatori' });

    const filter = `fields/clienteId eq '${cliente.id}' and fields/anno eq ${anno}`;
    const existing = await getListItems(req.graphToken, LIST, filter);
    await Promise.all(existing.map(i => deleteListItem(req.graphToken, LIST, i.id)));

    const adempimenti = generateChecklist(cliente, parseInt(anno));
    const created = await Promise.all(
      adempimenti.map(a =>
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
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Crea singolo adempimento manuale + evento calendario opzionale
router.post('/', async (req, res) => {
  try {
    const { adempimento, categoria, scadenza, note, anno, aggiungiCalendario } = req.body;
    if (!adempimento || !scadenza || !anno) {
      return res.status(400).json({ error: 'adempimento, scadenza e anno sono obbligatori' });
    }

    const item = await createListItem(req.graphToken, LIST, {
      id: uuidv4(),
      adempimento,
      categoria: categoria || 'Altro',
      scadenza,
      note: note || '',
      stato: 'da_fare',
      clienteId: '',
      clienteNome: '',
      anno: parseInt(anno),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (aggiungiCalendario !== false) {
      try {
        await createEvento(req.graphToken, {
          titolo: adempimento,
          tipo: 'scadenza',
          start: `${scadenza}T09:00:00`,
          end: `${scadenza}T10:00:00`,
          note: note || '',
          clienteId: '',
          clienteNome: '',
        });
      } catch { /* non blocca se il calendario fallisce */ }
    }

    res.status(201).json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Aggiorna stato di un adempimento
router.put('/:id', async (req, res) => {
  try {
    await updateListItem(req.graphToken, LIST, req.params.id, {
      stato: req.body.stato,
      note: req.body.note,
      updatedAt: new Date().toISOString(),
    });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
