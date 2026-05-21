const TIPO_CARTELLA = {
  visura_camerale:    '01 - Vita societaria',
  email_allegati:     '02 - Pratiche',
  documenti_generati: '02 - Pratiche',
  dichiarazioni:      '03 - Dichiarazioni fiscali',
  contabilita:        '04 - Contabilità',
  buste_paga:         '05 - Buste paga',
  f24:                '06 - F24 e Versamenti',
  carta_identita:     '07 - Privacy e GDPR',
  tessera_sanitaria:  '07 - Privacy e GDPR',
  corrispondenza:     '08 - Corrispondenza',
};

const SCHEMA_CARTELLE = [
  '01 - Vita societaria',
  '02 - Pratiche',
  '03 - Dichiarazioni fiscali',
  '04 - Contabilità',
  '05 - Buste paga',
  '06 - F24 e Versamenti',
  '07 - Privacy e GDPR',
  '08 - Corrispondenza',
];

function buildClientFolderPath(ragioneSociale, tipoDocumento) {
  const safe = ragioneSociale.replace(/[/\\?%*:|"<>]/g, '-').trim();
  const sub = TIPO_CARTELLA[tipoDocumento] || '02 - Pratiche';
  return `01 - Clienti/Cliente - ${safe}/${sub}`;
}

function sanitizeFileName(name) {
  return name.replace(/[/\\?%*:|"<>]/g, '-');
}

module.exports = { buildClientFolderPath, sanitizeFileName, SCHEMA_CARTELLE };
