const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getEventi, createEvento, updateEvento, deleteEvento } = require('../graph/calendar');
const { getListItems, createListItem } = require('../graph/sharepoint');
const { createGraphClient } = require('../graph/graphClient');

const router = express.Router();
const CHAT_LIST = 'Appuntamento_Chat';
const TASKS_LIST = 'Task_Log';

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

// ── Chat interna appuntamento ──────────────────────────────────────────────

router.get('/chat/:eventoId', async (req, res) => {
  try {
    const all = await getListItems(req.graphToken, CHAT_LIST);
    const msgs = all
      .filter(m => m.eventoId === req.params.eventoId)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    res.json(msgs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/chat/:eventoId', async (req, res) => {
  try {
    const { testo, autore, autoreEmail, destinatario, destinatarioEmail, eventoTitolo, clienteId, clienteNome } = req.body;
    if (!testo?.trim()) return res.status(400).json({ error: 'Testo obbligatorio' });

    const msg = await createListItem(req.graphToken, CHAT_LIST, {
      id: uuidv4(),
      eventoId: req.params.eventoId,
      testo: testo.trim(),
      autore: autore || 'Utente',
      autoreEmail: autoreEmail || '',
      destinatario: destinatario || '',
      destinatarioEmail: destinatarioEmail || '',
      createdAt: new Date().toISOString(),
    });

    // Se c'è un destinatario, crea task automatica per lui
    if (destinatarioEmail && destinatarioEmail !== autoreEmail) {
      await createListItem(req.graphToken, TASKS_LIST, {
        id: uuidv4(),
        titolo: `Messaggio da ${autore}: ${eventoTitolo || 'appuntamento'}`,
        descrizione: testo.trim(),
        assegnato: destinatario || destinatarioEmail,
        clienteId: clienteId || '',
        clienteNome: clienteNome || '',
        stato: 'da_fare',
        priorita: 'bassa',
        createdAt: new Date().toISOString(),
      });
    }

    res.status(201).json(msg);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Auto-crea task riepilogo per eventi terminati (ultimi 7 giorni) ────────

router.post('/auto-riepilogo', async (req, res) => {
  try {
    const now = new Date();
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const start = weekAgo.toISOString().slice(0, 10);
    const end   = now.toISOString().slice(0, 10);

    const eventiPassati = await getEventi(req.graphToken, start, end);
    const terminati = eventiPassati.filter(ev => {
      const fine = ev.end?.dateTime || ev.fine;
      return fine && new Date(fine) < now;
    });

    if (!terminati.length) return res.json({ creati: 0 });

    // Evita duplicati: leggi tasks già create con eventoId
    const existingTasks = await getListItems(req.graphToken, TASKS_LIST);
    const idsCoperti = new Set(existingTasks.filter(t => t.eventoId).map(t => t.eventoId));

    let creati = 0;
    for (const ev of terminati) {
      if (idsCoperti.has(ev.id)) continue;
      const fine = ev.end?.dateTime || ev.fine || '';
      await createListItem(req.graphToken, TASKS_LIST, {
        id: uuidv4(),
        eventoId: ev.id,
        titolo: `Riepilogo riunione: ${ev.subject || ev.titolo || 'appuntamento'}`,
        descrizione: `Inserire il riepilogo della riunione del ${fine ? new Date(fine).toLocaleDateString('it-IT') : ''}.`,
        assegnato: '',
        clienteId: ev.clienteId || '',
        clienteNome: ev.clienteNome || '',
        stato: 'da_fare',
        priorita: 'media',
        createdAt: new Date().toISOString(),
      });
      creati++;
    }

    res.json({ creati });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
