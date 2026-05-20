const express = require('express');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const {
  getInboxMessages, getMessageWithAttachments, getClientMessages,
  getMessage, replyToMessage,
} = require('../graph/messages');
const { getListItems, getListItemById, createListItem } = require('../graph/sharepoint');
const { saveClientDocument } = require('../graph/files');
const { sanitizeFileName } = require('../utils/fileUtils');

const router = express.Router();

const ALLOWED_EXTS = new Set(['.pdf', '.docx', '.xlsx', '.xls', '.jpg', '.jpeg', '.png', '.zip']);

// Lista caselle configurate
router.get('/caselle', (req, res) => {
  const raw = process.env.MAILBOXES || 'me';
  const caselle = raw.split(',').map(s => s.trim()).filter(Boolean);
  res.json(caselle);
});

// Corpo completo di un messaggio
router.get('/messaggio/:messageId', async (req, res) => {
  try {
    const mailbox = req.query.mailbox || 'me';
    const msg = await getMessage(req.graphToken, req.params.messageId, mailbox);
    res.json({
      id: msg.id,
      subject: msg.subject,
      from: msg.from,
      toRecipients: msg.toRecipients,
      receivedDateTime: msg.receivedDateTime,
      body: msg.body,
      conversationId: msg.conversationId,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Allegati di un messaggio (con contenuto inline per immagini < 1MB)
router.get('/allegati/:messageId', async (req, res) => {
  try {
    const mailbox = req.query.mailbox || 'me';
    const fullMsg = await getMessageWithAttachments(req.graphToken, req.params.messageId, mailbox);
    const allegati = (fullMsg.attachments || [])
      .filter(a => a['@odata.type'] === '#microsoft.graph.fileAttachment')
      .map(a => {
        const isImage = a.contentType?.startsWith('image/');
        const sizeOk = (a.size || 0) < 1024 * 1024; // < 1MB
        return {
          name: a.name,
          contentType: a.contentType,
          size: a.size,
          // Inline solo per immagini piccole
          contentBytes: (isImage && sizeOk) ? a.contentBytes : null,
          // Per tutti gli altri: base64 per download client-side
          downloadBytes: (!isImage && sizeOk) ? a.contentBytes : null,
        };
      });
    res.json(allegati);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Rispondi a un messaggio
router.post('/rispondi/:messageId', async (req, res) => {
  try {
    const { testo, mailbox = 'me' } = req.body;
    const { messageId } = req.params;

    // Recupera il messaggio per ottenere subject e clienteId dai dati passati
    const msg = await getMessage(req.graphToken, messageId, mailbox);
    await replyToMessage(req.graphToken, messageId, testo, mailbox);

    // Registra in Invii_Log
    const clienteId = req.body.clienteId || '';
    await createListItem(req.graphToken, 'Invii_Log', {
      id: uuidv4(),
      clienteId,
      oggetto: `Re: ${msg.subject}`,
      email: msg.from?.emailAddress?.address || '',
      corpo: testo,
      inviatoAt: new Date().toISOString(),
      esito: 'ok',
      casella: mailbox,
    });

    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Crea task da una email
router.post('/task-da-mail', async (req, res) => {
  try {
    const { messageId, mailbox = 'me', clienteId, clienteNome, titolo, assegnato = '', priorita = 'media' } = req.body;
    const item = await createListItem(req.graphToken, 'Task_Log', {
      id: uuidv4(),
      titolo,
      clienteId,
      clienteNome,
      assegnato,
      priorita,
      stato: 'da_fare',
      note: `Da email (messageId: ${messageId}, casella: ${mailbox})`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    res.status(201).json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Scansiona inbox — supporta multi-casella
router.get('/scansiona', async (req, res) => {
  try {
    const ore = parseInt(req.query.ore) || 24;
    const since = new Date();
    since.setHours(since.getHours() - ore);

    const caselle = (process.env.MAILBOXES || 'me').split(',').map(s => s.trim()).filter(Boolean);
    const clienti = await getListItems(req.graphToken, 'Anagrafica_GDS');
    const risultati = [];

    for (const casella of caselle) {
      let msgs = [];
      try { msgs = await getInboxMessages(req.graphToken, since, casella); } catch { continue; }

      for (const msg of msgs) {
        const senderEmail = msg.from?.emailAddress?.address?.toLowerCase();
        if (!senderEmail) continue;

        const cliente = clienti.find(
          (c) => c.email?.toLowerCase() === senderEmail || c.pec?.toLowerCase() === senderEmail
        );
        if (!cliente) continue;

        await createListItem(req.graphToken, 'Task_Log', {
          id: uuidv4(),
          titolo: `Email: ${msg.subject}`,
          descrizione: msg.bodyPreview,
          clienteId: cliente.id,
          clienteNome: cliente.ragioneSociale,
          stato: 'da_fare',
          priorita: 'media',
          note: `Email ricevuta il ${new Date(msg.receivedDateTime).toLocaleDateString('it-IT')} su ${casella}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        let allegatiSalvati = 0;
        if (msg.hasAttachments) {
          const fullMsg = await getMessageWithAttachments(req.graphToken, msg.id, casella);
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
          casella,
          cliente: cliente.ragioneSociale,
          oggetto: msg.subject,
          data: msg.receivedDateTime,
          allegati: allegatiSalvati,
        });
      }
    }

    res.json({ elaborati: risultati.length, dettaglio: risultati });
  } catch (err) { res.status(500).json({ error: err.message }); }
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

    const caselle = (process.env.MAILBOXES || 'me').split(',').map(s => s.trim()).filter(Boolean);
    let emailRicevute = [];
    if (cliente.email) {
      const results = await Promise.allSettled(
        caselle.map(casella => getClientMessages(req.graphToken, cliente.email, 20, casella)
          .then(msgs => msgs.map(m => ({ ...m, _casella: casella })))
        )
      );
      emailRicevute = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
    }

    const timeline = [
      ...tasks.map((t) => ({ tipo: 'task', data: t.createdAt, titolo: t.titolo, stato: t.stato, assegnato: t.assegnato })),
      ...documenti.map((d) => ({ tipo: 'documento', data: d.generatoAt, titolo: d.templateNome })),
      ...invii.map((i) => ({ tipo: 'email_inviata', data: i.inviatoAt, titolo: i.oggetto, email: i.email, casella: i.casella })),
      ...emailRicevute.map((e) => ({
        tipo: 'email_ricevuta',
        data: e.receivedDateTime,
        titolo: e.subject,
        preview: e.bodyPreview,
        messageId: e.id,
        casella: e._casella,
      })),
    ].sort((a, b) => new Date(b.data) - new Date(a.data));

    res.json({ cliente: cliente.ragioneSociale, clienteEmail: cliente.email, timeline });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
