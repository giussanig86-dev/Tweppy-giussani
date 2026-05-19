const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getListItems, getListItemById, createListItem, updateListItem, deleteListItem } = require('../graph/sharepoint');
const { sendMail } = require('../graph/mail');
const { riempiTemplate } = require('../utils/templateUtils');

const router = express.Router();
const LIST_TPL = 'Email_Templates';
const LIST_LOG = 'Invii_Log';

router.get('/', async (req, res) => {
  try {
    res.json(await getListItems(req.graphToken, LIST_TPL));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const fields = { ...req.body, id: uuidv4(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    res.status(201).json(await createListItem(req.graphToken, LIST_TPL, fields));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    await updateListItem(req.graphToken, LIST_TPL, req.params.id, { ...req.body, updatedAt: new Date().toISOString() });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await deleteListItem(req.graphToken, LIST_TPL, req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Anteprima: compila template per max 5 clienti selezionati
router.post('/anteprima', async (req, res) => {
  try {
    const { templateId, clienteIds } = req.body;
    const template = await getListItemById(req.graphToken, LIST_TPL, templateId);
    const tuttiClienti = await getListItems(req.graphToken, 'Anagrafica_GDS');
    const selezionati = tuttiClienti.filter((c) => clienteIds.includes(c.id)).slice(0, 5);

    const anteprime = selezionati.map((c) => ({
      clienteId: c.id,
      clienteNome: c.ragioneSociale,
      email: c.email,
      oggetto: riempiTemplate(template.oggetto, c),
      corpo: riempiTemplate(template.corpo, c),
    }));

    res.json(anteprime);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Invio batch
router.post('/invia-batch', async (req, res) => {
  try {
    const { templateId, clienteIds } = req.body;
    const template = await getListItemById(req.graphToken, LIST_TPL, templateId);
    const tuttiClienti = await getListItems(req.graphToken, 'Anagrafica_GDS');
    const destinatari = tuttiClienti.filter((c) => clienteIds.includes(c.id) && c.email);

    const risultati = { inviati: 0, errori: [] };

    for (const cliente of destinatari) {
      const oggetto = riempiTemplate(template.oggetto, cliente);
      const corpo = riempiTemplate(template.corpo, cliente);
      try {
        await sendMail(req.graphToken, { to: cliente.email, subject: oggetto, body: corpo });
        await createListItem(req.graphToken, LIST_LOG, {
          id: uuidv4(),
          templateId,
          templateNome: template.nome,
          clienteId: cliente.id,
          clienteNome: cliente.ragioneSociale,
          email: cliente.email,
          oggetto,
          stato: 'inviato',
          inviatoAt: new Date().toISOString(),
        });
        risultati.inviati++;
      } catch (e) {
        risultati.errori.push({ clienteNome: cliente.ragioneSociale, errore: e.message });
      }
    }

    res.json(risultati);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
