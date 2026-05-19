const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getListItems, createListItem, updateListItem, deleteListItem } = require('../graph/sharepoint');
const tariffario = require('../engines/lapet.json');

const router = express.Router();
const LIST = 'Attivita_Log';

function calcola(importoUnitario, quantita) {
  const netto = parseFloat(importoUnitario) * parseFloat(quantita);
  const contributo = netto * tariffario.contributoIntegrativo;
  const iva = (netto + contributo) * tariffario.iva;
  return {
    importoNetto: round(netto),
    contributoIntegrativo: round(contributo),
    iva: round(iva),
    importoTotale: round(netto + contributo + iva),
  };
}

function round(n) { return Math.round(n * 100) / 100; }

router.get('/tariffario', (_, res) => res.json(tariffario));

router.get('/attivita', async (req, res) => {
  try {
    const { clienteId, anno, fatturato } = req.query;
    let items = await getListItems(req.graphToken, LIST);
    if (clienteId) items = items.filter(a => a.clienteId === clienteId);
    if (anno) items = items.filter(a => a.data?.startsWith(String(anno)));
    if (fatturato !== undefined) items = items.filter(a => String(a.fatturato) === fatturato);
    res.json(items);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/attivita', async (req, res) => {
  try {
    const { importoUnitario, quantita } = req.body;
    const importi = calcola(importoUnitario || 0, quantita || 1);
    const fields = {
      ...req.body,
      ...importi,
      id: uuidv4(),
      fatturato: false,
      createdAt: new Date().toISOString(),
    };
    res.status(201).json(await createListItem(req.graphToken, LIST, fields));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/attivita/:id', async (req, res) => {
  try {
    const { importoUnitario, quantita } = req.body;
    const importi = calcola(importoUnitario || 0, quantita || 1);
    await updateListItem(req.graphToken, LIST, req.params.id, { ...req.body, ...importi, updatedAt: new Date().toISOString() });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/attivita/:id', async (req, res) => {
  try {
    await deleteListItem(req.graphToken, LIST, req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Segna attività come fatturate
router.post('/attivita/fattura', async (req, res) => {
  try {
    const { ids } = req.body;
    await Promise.all(ids.map(id =>
      updateListItem(req.graphToken, LIST, id, { fatturato: true, fatturatoAt: new Date().toISOString() })
    ));
    res.json({ success: true, aggiornati: ids.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Import da task completati
router.get('/task-completati', async (req, res) => {
  try {
    const [tasks, attivita] = await Promise.all([
      getListItems(req.graphToken, 'Task_Log', "fields/stato eq 'completato'"),
      getListItems(req.graphToken, LIST),
    ]);
    const taskIdImportati = new Set(attivita.map(a => a.taskId).filter(Boolean));
    const daImportare = tasks.filter(t => t.clienteId && !taskIdImportati.has(t.id));
    res.json(daImportare);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/importa-task', async (req, res) => {
  try {
    const { taskIds, voceId } = req.body;
    const tasks = await getListItems(req.graphToken, 'Task_Log');
    const voce = tariffario.voci.find(v => v.id === voceId) || tariffario.voci.find(v => v.id === 'consulenza_oraria');
    const importi = calcola(voce.importoBase, 1);

    const created = await Promise.all(
      tasks.filter(t => taskIds.includes(t.id)).map(t =>
        createListItem(req.graphToken, LIST, {
          ...importi,
          id: uuidv4(),
          clienteId: t.clienteId,
          clienteNome: t.clienteNome,
          data: (t.updatedAt || new Date().toISOString()).slice(0, 10),
          collaboratore: t.assegnato || '',
          voceId: voce.id,
          voceDescrizione: voce.descrizione,
          importoUnitario: voce.importoBase,
          quantita: 1,
          note: t.titolo,
          taskId: t.id,
          fatturato: false,
          createdAt: new Date().toISOString(),
        })
      )
    );
    res.status(201).json({ importati: created.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Dashboard aggregati
router.get('/dashboard', async (req, res) => {
  try {
    const anno = parseInt(req.query.anno) || new Date().getFullYear();
    const meseCorrente = new Date().toISOString().slice(0, 7);
    const all = await getListItems(req.graphToken, LIST);

    const annoData = all.filter(a => a.data?.startsWith(String(anno)));
    const meseData = all.filter(a => a.data?.startsWith(meseCorrente));
    const daFatturare = all.filter(a => !a.fatturato);

    const sum = arr => arr.reduce((s, a) => s + (a.importoTotale || 0), 0);
    const groupBy = (arr, key) => {
      const map = {};
      arr.forEach(a => { const k = a[key] || 'N/D'; map[k] = (map[k] || 0) + (a.importoTotale || 0); });
      return Object.entries(map).sort((a, b) => b[1] - a[1]);
    };

    res.json({
      totaleAnno: round(sum(annoData)),
      totaleMese: round(sum(meseData)),
      totaleDaFatturare: round(sum(daFatturare)),
      conteggioAttivita: annoData.length,
      perCliente: groupBy(annoData, 'clienteNome').slice(0, 10),
      perCollaboratore: groupBy(annoData, 'collaboratore'),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
