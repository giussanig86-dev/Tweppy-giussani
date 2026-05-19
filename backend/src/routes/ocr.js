const express = require('express');
const multer = require('multer');
const { extractFromDocument } = require('../claude/claudeClient');
const { saveClientDocument } = require('../graph/files');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'application/pdf'].includes(file.mimetype);
    cb(ok ? null : new Error('Formato non supportato'), ok);
  },
});

const PROMPTS = {
  visura_camerale: `Analizza questa visura camerale italiana ed estrai i dati.
Restituisci SOLO un JSON valido con questi campi (stringa vuota se assente):
{"ragioneSociale":"","partitaIva":"","codiceFiscale":"","tipologiaCliente":"","atecoCode":"","settore":"","indirizzo":"","cap":"","comune":"","provincia":"","email":"","pec":""}
I valori possibili per tipologiaCliente: imprenditore individuale, professionista, società persone, società capitali, associazione, ente non commerciale, persona fisica, startup innovativa.`,

  carta_identita: `Analizza questa carta d'identità italiana ed estrai i dati.
Restituisci SOLO un JSON valido con questi campi (stringa vuota se assente):
{"cognome":"","nome":"","dataNascita":"YYYY-MM-DD","luogoNascita":"","indirizzo":"","comune":"","provincia":"","cap":""}`,

  tessera_sanitaria: `Analizza questa tessera sanitaria italiana ed estrai i dati.
Restituisci SOLO un JSON valido con questi campi (stringa vuota se assente):
{"codiceFiscale":"","cognome":"","nome":"","dataNascita":"YYYY-MM-DD"}`,
};

router.post('/estrai', upload.single('documento'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'File mancante' });
    const { tipoDocumento } = req.body;
    if (!PROMPTS[tipoDocumento]) return res.status(400).json({ error: 'Tipo documento non valido' });

    const base64 = req.file.buffer.toString('base64');
    const dati = await extractFromDocument(base64, req.file.mimetype, PROMPTS[tipoDocumento]);

    res.json({ dati, tipoDocumento, nomeFile: req.file.originalname });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/salva', upload.single('documento'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'File mancante' });
    const { clienteId, ragioneSociale, tipoDocumento } = req.body;
    if (!ragioneSociale) return res.status(400).json({ error: 'ragioneSociale obbligatoria' });

    const result = await saveClientDocument(req.graphToken, {
      buffer: req.file.buffer,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      clienteId,
      ragioneSociale,
      tipoDocumento,
    });

    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
