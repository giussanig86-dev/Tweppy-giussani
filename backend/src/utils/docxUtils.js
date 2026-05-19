const { Document, Paragraph, TextRun, Packer } = require('docx');

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

module.exports = { creaDocx };
