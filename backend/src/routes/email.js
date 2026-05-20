const express = require('express');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const {
  getInboxMessages, getMessageWithAttachments, getClientMessages, getSentToClient,
  getMessage, replyToMessage, streamAttachment,
  createReplyDraft, addAttachmentToDraft, sendDraft,
} = require('../graph/messages');
const { getListItems, getListItemById, createListItem } = require('../graph/sharepoint');
const { saveClientDocument } = require('../graph/files');
const { sanitizeFileName } = require('../utils/fileUtils');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

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

// Lista allegati di un messaggio (con id per lo streaming)
router.get('/allegati/:messageId', async (req, res) => {
  try {
    const mailbox = req.query.mailbox || 'me';
    const fullMsg = await getMessageWithAttachments(req.graphToken, req.params.messageId, mailbox);
    const allegati = (fullMsg.attachments || [])
      .filter(a => a['@odata.type'] === '#microsoft.graph.fileAttachment')
      .map(a => ({
        id: a.id,
        name: a.name,
        contentType: a.contentType,
        size: a.size,
      }));
    res.json(allegati);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Stream di un singolo allegato (qualunque dimensione)
router.get('/allegati/:messageId/:attachmentId/stream', async (req, res) => {
  try {
    const { messageId, attachmentId } = req.params;
    const mailbox = req.query.mailbox || 'me';
    const name = req.query.name || 'allegato';
    const contentType = req.query.contentType || 'application/octet-stream';
    const response = await streamAttachment(req.graphToken, messageId, attachmentId, mailbox);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(name)}"`);
    response.data.pipe(res);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// URL cartella SharePoint del cliente
router.get('/sharepoint-url/:clienteId', async (req, res) => {
  try {
    const { clienteId } = req.params;
    const cliente = await getListItemById(req.graphToken, 'Anagrafica_GDS', clienteId);
    const siteUrl = (process.env.SHAREPOINT_SITE_URL || '').replace(/\/$/, '');
    if (!siteUrl) return res.json({ url: null });
    const folder = encodeURIComponent(cliente.ragioneSociale);
    res.json({ url: `${siteUrl}/Shared%20Documents/01%20-%20Clienti/${folder}` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Rispondi a un messaggio (con allegati opzionali via multipart)
router.post('/rispondi/:messageId', upload.array('files'), async (req, res) => {
  try {
    const testo = req.body.testo || '';
    const mailbox = req.body.mailbox || 'me';
    const { messageId } = req.params;

    const msg = await getMessage(req.graphToken, messageId, mailbox);

    if (req.files?.length > 0) {
      const draft = await createReplyDraft(req.graphToken, messageId, testo, mailbox);
      for (const file of req.files) {
        await addAttachmentToDraft(req.graphToken, draft.id, {
          name: file.originalname,
          contentType: file.mimetype,
          contentBytes: file.buffer.toString('base64'),
        }, mailbox);
      }
      await sendDraft(req.graphToken, draft.id, mailbox);
    } else {
      await replyToMessage(req.graphToken, messageId, testo, mailbox);
    }

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

        if (!cliente) {
          await createListItem(req.graphToken, 'Email_Sconosciute_Log', {
            id: uuidv4(),
            casella,
            mittente: senderEmail,
            oggetto: msg.subject,
            preview: msg.bodyPreview,
            messageId: msg.id,
            data: msg.receivedDateTime,
            createdAt: new Date().toISOString(),
          });
          continue;
        }

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

// Email da mittenti non riconosciuti
router.get('/sconosciuti', async (req, res) => {
  try {
    const ore = parseInt(req.query.ore) || 168;
    const since = new Date();
    since.setHours(since.getHours() - ore);
    const all = await getListItems(req.graphToken, 'Email_Sconosciute_Log');
    const filtered = all
      .filter(e => e.createdAt && new Date(e.createdAt) >= since)
      .sort((a, b) => new Date(b.data || b.createdAt) - new Date(a.data || a.createdAt));
    res.json(filtered);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

function normalizeSubject(s) {
  return (s || '').replace(/^(re:\s*)+/i, '').toLowerCase().trim();
}

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
    let emailInviateOutlook = [];

    if (cliente.email) {
      const [ricevuteRaw, inviatRaw] = await Promise.all([
        Promise.allSettled(
          caselle.map((casella, i) =>
            getClientMessages(req.graphToken, cliente.email, 20, casella)
              .then(msgs => msgs.map(m => ({ ...m, _casella: casella })))
          )
        ),
        Promise.allSettled(
          caselle.map((casella, i) =>
            getSentToClient(req.graphToken, cliente.email, 20, casella)
              .then(msgs => msgs.map(m => ({ ...m, _casella: casella })))
          )
        ),
      ]);

      emailRicevute = ricevuteRaw.flatMap(r => r.status === 'fulfilled' ? r.value : []);

      const sentItems = inviatRaw.flatMap(r => r.status === 'fulfilled' ? r.value : []);
      emailInviateOutlook = sentItems
        .filter(e => {
          const normSent = normalizeSubject(e.subject);
          const sentTime = new Date(e.sentDateTime).getTime();
          return !invii.some(i => {
            const normInvio = normalizeSubject(i.oggetto);
            const invioTime = new Date(i.inviatoAt).getTime();
            return normSent === normInvio && Math.abs(sentTime - invioTime) < 60000;
          });
        })
        .map(e => ({
          tipo: 'email_inviata',
          data: e.sentDateTime,
          titolo: e.subject,
          email: cliente.email,
          casella: e._casella,
          fonte: 'outlook',
        }));
    }

    const timeline = [
      ...tasks.map((t) => ({ tipo: 'task', data: t.createdAt, titolo: t.titolo, stato: t.stato, assegnato: t.assegnato })),
      ...documenti.map((d) => ({ tipo: 'documento', data: d.generatoAt, titolo: d.templateNome })),
      ...invii.map((i) => ({ tipo: 'email_inviata', data: i.inviatoAt, titolo: i.oggetto, email: i.email, casella: i.casella })),
      ...emailInviateOutlook,
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

// Note interne su una email specifica
router.get('/note/:messageId', async (req, res) => {
  try {
    const safeId = req.params.messageId.replace(/'/g, "''");
    const items = await getListItems(req.graphToken, 'Email_Note', `fields/messageId eq '${safeId}'`);
    items.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    res.json(items);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/note/:messageId', async (req, res) => {
  try {
    const { testo, autore } = req.body;
    if (!testo?.trim()) return res.status(400).json({ error: 'Testo obbligatorio' });
    const created = await createListItem(req.graphToken, 'Email_Note', {
      messageId: req.params.messageId,
      testo: testo.trim(),
      autore: autore || 'Utente',
      createdAt: new Date().toISOString(),
    });
    res.status(201).json(created);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
