const express = require('express');
const { Document, Paragraph, TextRun, Packer, HeadingLevel } = require('docx');
const { TEMPLATES } = require('../engines/documentiTemplates');
const { askClaude } = require('../claude/claudeClient');
const { getListItems, createListItem } = require('../graph/sharepoint');
const { saveClientDocument } = require('../graph/files');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
const LIST = 'Documenti_Log';

router.get('/templates', (_, res) => {
  res.json(TEMPLATES.map(({ id, nome, descrizione }) => ({ id, nome, descrizione })));
});

router.post('/genera', async (req, res) => {
  try {
    const { clienteId, templateId, salvaSharePoint } = req.body;

    const clienti = await getListItems(req.graphToken, 'Anagrafica_GDS');
    const cliente = clienti.find((c) => c.id === clienteId);
    if (!cliente) return res.status(404).json({ error: 'Cliente non trovato' });

    const template = TEMPLATES.find((t) => t.id === templateId);
    if (!template) return res.status(404).json({ error: 'Template non trovato' });

    const dataOggi = new Date().toLocaleDateString('it-IT');
    const userMessage = `Dati cliente:\n${JSON.stringify(cliente, null, 2)}\n\nData odierna: ${dataOggi}\n\nTemplate da compilare:\n${template.corpo}`;

    const testo = await askClaude(template.systemPrompt, userMessage);
    const buffer = await creaDocx(template.nome, testo);

    if (salvaSharePoint) {
      await saveClientDocument(req.graphToken, {
        buffer,
        originalname: `${template.id}.docx`,
        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ragioneSociale: cliente.ragioneSociale,
        tipoDocumento: 'documenti_generati',
      });

      await createListItem(req.graphToken, LIST, {
        id: uuidv4(),
        clienteId,
        clienteNome: cliente.ragioneSociale,
        templateId,
        templateNome: template.nome,
        generatoAt: new Date().toISOString(),
        salvatoSharePoint: true,
      });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${template.id}_${cliente.ragioneSociale}.docx"`);
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function creaDocx(titolo, corpo) {
  const righe = corpo.split('\n');
  const children = righe.map((riga) => {
    const isTitle = riga === riga.toUpperCase() && riga.trim().length > 3 && !/^\d/.test(riga);
    return new Paragraph({
      children: [new TextRun({ text: riga || ' ', bold: isTitle, size: isTitle ? 26 : 24 })],
      spacing: { after: riga.trim() === '' ? 100 : 160 },
    });
  });

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}

module.exports = router;
