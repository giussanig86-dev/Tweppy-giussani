const express = require('express');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { getInboxMessages, getMessageWithAttachments, getClientMessages } = require('../graph/messages');
const { getListItems, getListItemById, createListItem } = require('../graph/sharepoint');
const { saveClientDocument } = require('../graph/files');
const { sanitizeFileName } = require('../utils/fileUtils');

const router = express.Router();

const ALLOWED_EXTS = new Set(['.pdf', '.docx', '.xlsx', '.xls', '.jpg', '.jpeg', '.png', '.zip']);

// Scansiona inbox e processa email da clienti noti
router.get('/scansiona', async (req, res) => {
  try {
    const ore = parseInt(req.query.ore) || 24;
    const since = new Date();
    since.setHours(since.getHours() - ore);

    const [msgs, clienti] = await Promise.all([
      getInboxMessages(req.graphToken, since),
      getListItems(req.graphToken, 'Anagrafica_GDS'),
    ]);

    const risultati = [];

    for (const msg of msgs) {
      const senderEmail = msg.from?.emailAddress?.address?.toLowerCase();
      if (!senderEmail) continue;

      const cliente = clienti.find(
        (c) => c.email?.toLowerCase() === senderEmail || c.pec?.toLowerCase() === senderEmail
      );
      if (!cliente) continue;

      // Crea task
      await createListItem(req.graphToken, 'Task_Log', {
        id: uuidv4(),
        titolo: `Email: ${msg.subject}`,
        descrizione: msg.bodyPreview,
        clienteId: cliente.id,
        clienteNome: cliente.ragioneSociale,
        stato: 'da_fare',
        priorita: 'media',
        note: `Email ricevuta il ${new Date(msg.receivedDateTime).toLocaleDateString('it-IT')}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Salva allegati se presenti
      let allegatiSalvati = 0;
      if (msg.hasAttachments) {
        const fullMsg = await getMessageWithAttachments(req.graphToken, msg.id);
        for (const att of fullMsg.attachments || []) {
          if (att['@odata.type'] !== '#microsoft.graph.fileAttachment') continue;
          const ext = path.extname(att.name).toLowerCase();
          if (!ALLOWED_EXTS.has(ext)) continue;

          const date = new Date().toISOString().slice(0, 10);
          const safeSubj = sanitizeFileName(msg.subject).slice(0, 40);
          const fileName = `${date}_${safeSubj}_${sanitizeFileName(att.name)}`;

          await saveClientDocument(req.graphToken, {
            buffer: Buffer.from(att.contentBytes, 'base64'),
            originalname: fileName,
            mimetype: att.contentType,
            ragioneSociale: cliente.ragioneSociale,
            tipoDocumento: 'email_allegati',
          });
          allegatiSalvati++;
        }
      }

      risultati.push({
        cliente: cliente.ragioneSociale,
        oggetto: msg.subject,
        data: msg.receivedDateTime,
        allegati: allegatiSalvati,
      });
    }

    res.json({ elaborati: risultati.length, dettaglio: risultati });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Storico comunicazioni unificato per cliente
router.get('/storico/:clienteId', async (req, res) => {
  try {
    const { clienteId } = req.params;
    const filter = `fields/clienteId eq '${clienteId}'`;

    const [tasks, documenti, invii, cliente] = await Promise.all([
      getListItems(req.graphToken, 'Task_Log', filter),
      getListItems(req.graphToken, 'Documenti_Log', filter),
      getListItems(req.graphToken, 'Invii_Log', filter),
      getListItemById(req.graphToken, 'Anagrafica_GDS', clienteId),
    ]);

    let emailRicevute = [];
    if (cliente.email) {
      try {
        emailRicevute = await getClientMessages(req.graphToken, cliente.email);
      } catch {}
    }

    const timeline = [
      ...tasks.map((t) => ({ tipo: 'task', data: t.createdAt, titolo: t.titolo, stato: t.stato, assegnato: t.assegnato })),
      ...documenti.map((d) => ({ tipo: 'documento', data: d.generatoAt, titolo: d.templateNome })),
      ...invii.map((i) => ({ tipo: 'email_inviata', data: i.inviatoAt, titolo: i.oggetto, email: i.email })),
      ...emailRicevute.map((e) => ({ tipo: 'email_ricevuta', data: e.receivedDateTime, titolo: e.subject, preview: e.bodyPreview })),
    ].sort((a, b) => new Date(b.data) - new Date(a.data));

    res.json({ cliente: cliente.ragioneSociale, timeline });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
