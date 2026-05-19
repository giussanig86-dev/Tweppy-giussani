const TIPO_CARTELLA = {
  visura_camerale: '01 - Vita societaria',
  carta_identita: '07 - Privacy e GDPR',
  tessera_sanitaria: '07 - Privacy e GDPR',
};

function buildClientFolderPath(ragioneSociale, tipoDocumento) {
  const safe = ragioneSociale.replace(/[/\\?%*:|"<>]/g, '-').trim();
  const sub = TIPO_CARTELLA[tipoDocumento] || '02 - Pratiche';
  return `01 - Clienti/Cliente - ${safe}/${sub}`;
}

function sanitizeFileName(name) {
  return name.replace(/[/\\?%*:|"<>]/g, '-');
}

module.exports = { buildClientFolderPath, sanitizeFileName };
