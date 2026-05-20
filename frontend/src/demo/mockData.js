export const CLIENTI = [
  { id: 'c1', ragioneSociale: 'Rossi Mario', codiceFiscale: 'RSSMRA80A01H501U', partitaIva: '12345678901', email: 'mario.rossi@email.it', telefono: '02 1234567', tipologiaCliente: 'persona_fisica', categoriaAnagrafica: 'fiscale', regimeFiscale: 'ordinario', stato: 'attivo', comune: 'Milano', provincia: 'MI', isa: true, ritenute: false, dipendenti: 0 },
  { id: 'c2', ragioneSociale: 'Bianchi SRL', codiceFiscale: '02345678901', partitaIva: '02345678901', email: 'info@bianchi.it', telefono: '06 9876543', tipologiaCliente: 'societa_capitali', categoriaAnagrafica: 'contabilità', regimeFiscale: 'ordinario', stato: 'attivo', comune: 'Roma', provincia: 'RM', isa: false, ritenute: true, dipendenti: 5 },
  { id: 'c3', ragioneSociale: 'Verdi Anna (Forfettario)', codiceFiscale: 'VRDNNA92C55F205K', partitaIva: '98765432109', email: 'anna.verdi@gmail.com', telefono: '339 1111222', tipologiaCliente: 'persona_fisica', categoriaAnagrafica: 'fiscale', regimeFiscale: 'forfettario', stato: 'attivo', comune: 'Napoli', provincia: 'NA', isa: false, ritenute: false, dipendenti: 0 },
  { id: 'c4', ragioneSociale: 'Studio Tecnico Neri', codiceFiscale: '07654321098', partitaIva: '07654321098', email: 'studio@neri.it', telefono: '011 5556666', tipologiaCliente: 'societa_persone', categoriaAnagrafica: 'aggiornamento professionale', regimeFiscale: 'ordinario', stato: 'attivo', comune: 'Torino', provincia: 'TO', isa: true, ritenute: true, dipendenti: 2 },
  { id: 'c5', ragioneSociale: 'Ferrari Giuseppe', codiceFiscale: 'FRRGPP75D10L219X', partitaIva: '55544433300', email: 'gferrari@libero.it', telefono: '051 2223333', tipologiaCliente: 'persona_fisica', categoriaAnagrafica: 'fiscale', regimeFiscale: 'ordinario', stato: 'inattivo', comune: 'Bologna', provincia: 'BO', isa: false, ritenute: false, dipendenti: 0 },
];

export const TASKS = [
  { id: 't1', titolo: 'Verifica F24 giugno', clienteId: 'c1', clienteNome: 'Rossi Mario', assegnato: 'Giorgio', priorita: 'alta', stato: 'da_fare', note: 'Scadenza 16/06', createdAt: '2025-06-01T09:00:00Z', updatedAt: '2025-06-01T09:00:00Z' },
  { id: 't2', titolo: 'Busta paga maggio Bianchi SRL', clienteId: 'c2', clienteNome: 'Bianchi SRL', assegnato: 'Laura', priorita: 'alta', stato: 'in_lavorazione', note: '', createdAt: '2025-05-25T10:00:00Z', updatedAt: '2025-06-02T11:00:00Z' },
  { id: 't3', titolo: 'Invio CU Verdi Anna', clienteId: 'c3', clienteNome: 'Verdi Anna', assegnato: 'Ylenia', priorita: 'media', stato: 'completato', note: 'Inviata via PEC', createdAt: '2025-03-01T08:00:00Z', updatedAt: '2025-03-15T14:00:00Z' },
  { id: 't4', titolo: '730 Rossi Mario — raccolta doc', clienteId: 'c1', clienteNome: 'Rossi Mario', assegnato: 'Giorgio', priorita: 'alta', stato: 'da_fare', note: '', createdAt: '2025-05-10T09:00:00Z', updatedAt: '2025-05-10T09:00:00Z' },
  { id: 't5', titolo: 'Bilancio 2024 Bianchi SRL', clienteId: 'c2', clienteNome: 'Bianchi SRL', assegnato: 'Giorgio', priorita: 'alta', stato: 'in_lavorazione', note: 'Bozza da rivedere', createdAt: '2025-04-15T09:00:00Z', updatedAt: '2025-05-20T16:00:00Z' },
  { id: 't6', titolo: 'Liquidazione IVA trim. Studio Neri', clienteId: 'c4', clienteNome: 'Studio Tecnico Neri', assegnato: 'Laura', priorita: 'media', stato: 'da_fare', note: '', createdAt: '2025-06-01T09:00:00Z', updatedAt: '2025-06-01T09:00:00Z' },
];

export const CHECKLIST = [
  { id: 'ch1', clienteId: 'c1', clienteNome: 'Rossi Mario', anno: 2025, categoria: 'Dichiarazioni', adempimento: 'Modello 730', scadenza: '2025-09-30', stato: 'da_fare' },
  { id: 'ch2', clienteId: 'c1', clienteNome: 'Rossi Mario', anno: 2025, categoria: 'IVA', adempimento: 'Liquidazione IVA Q1', scadenza: '2025-05-16', stato: 'completato' },
  { id: 'ch3', clienteId: 'c1', clienteNome: 'Rossi Mario', anno: 2025, categoria: 'Dichiarazioni', adempimento: 'Compilazione ISA', scadenza: '2025-07-31', stato: 'da_fare' },
  { id: 'ch4', clienteId: 'c2', clienteNome: 'Bianchi SRL', anno: 2025, categoria: 'Societario', adempimento: 'Deposito bilancio CCIAA', scadenza: '2025-07-31', stato: 'da_fare' },
  { id: 'ch5', clienteId: 'c2', clienteNome: 'Bianchi SRL', anno: 2025, categoria: 'Ritenute', adempimento: 'F24 Ritenute — Giugno', scadenza: '2025-07-16', stato: 'da_fare' },
];

export const ADEMPIMENTI = [
  { id: 'ad1',  adempimento: 'Liquidazione IVA mensile — Gennaio',            categoria: 'IVA',           scadenza: '2026-02-16', note: 'Contribuenti IVA mensili',              stato: 'completato', anno: 2026 },
  { id: 'ad2',  adempimento: 'Certificazione Unica (CU) — trasmissione AE',   categoria: 'Dipendenti',    scadenza: '2026-03-31', note: "Anno d'imposta 2025",                   stato: 'completato', anno: 2026 },
  { id: 'ad3',  adempimento: 'Liquidazione IVA mensile — Febbraio',           categoria: 'IVA',           scadenza: '2026-03-16', note: 'Contribuenti IVA mensili',              stato: 'completato', anno: 2026 },
  { id: 'ad4',  adempimento: 'Liquidazione IVA mensile — Marzo',              categoria: 'IVA',           scadenza: '2026-04-16', note: 'Contribuenti IVA mensili',              stato: 'completato', anno: 2026 },
  { id: 'ad5',  adempimento: 'Dichiarazione IVA annuale',                     categoria: 'IVA',           scadenza: '2026-04-30', note: "Anno d'imposta 2025",                   stato: 'completato', anno: 2026 },
  { id: 'ad6',  adempimento: 'Approvazione bilancio — assemblea soci',        categoria: 'Societario',    scadenza: '2026-04-30', note: 'Entro 120 gg dalla chiusura esercizio', stato: 'in_lavorazione', anno: 2026 },
  { id: 'ad7',  adempimento: 'Liquidazione IVA mensile — Aprile',             categoria: 'IVA',           scadenza: '2026-05-16', note: 'Contribuenti IVA mensili',              stato: 'completato', anno: 2026 },
  { id: 'ad8',  adempimento: 'F24 Ritenute — Aprile',                        categoria: 'Ritenute',      scadenza: '2026-05-16', note: "Sostituti d'imposta",                   stato: 'completato', anno: 2026 },
  { id: 'ad9',  adempimento: 'Deposito bilancio CCIAA',                       categoria: 'Societario',    scadenza: '2026-05-30', note: "Entro 30 gg dall'approvazione",         stato: 'da_fare',    anno: 2026 },
  { id: 'ad10', adempimento: 'Liquidazione IVA — I trim. (gen-mar)',          categoria: 'IVA',           scadenza: '2026-05-30', note: 'Con maggiorazione 1%',                  stato: 'da_fare',    anno: 2026 },
  { id: 'ad11', adempimento: 'Liquidazione IVA mensile — Maggio',             categoria: 'IVA',           scadenza: '2026-06-16', note: 'Contribuenti IVA mensili',              stato: 'da_fare',    anno: 2026 },
  { id: 'ad12', adempimento: 'F24 Ritenute — Maggio',                        categoria: 'Ritenute',      scadenza: '2026-06-16', note: "Sostituti d'imposta",                   stato: 'da_fare',    anno: 2026 },
  { id: 'ad13', adempimento: 'Acconto imposte — I rata',                      categoria: 'Acconti',       scadenza: '2026-06-30', note: 'Proroga 30 luglio con +0,40%',          stato: 'da_fare',    anno: 2026 },
  { id: 'ad14', adempimento: 'Liquidazione IVA mensile — Giugno',             categoria: 'IVA',           scadenza: '2026-07-16', note: 'Contribuenti IVA mensili',              stato: 'da_fare',    anno: 2026 },
  { id: 'ad15', adempimento: 'F24 Ritenute — Giugno',                        categoria: 'Ritenute',      scadenza: '2026-07-16', note: "Sostituti d'imposta",                   stato: 'da_fare',    anno: 2026 },
  { id: 'ad16', adempimento: 'Liquidazione IVA — II trim. (apr-giu)',         categoria: 'IVA',           scadenza: '2026-08-20', note: 'Con maggiorazione 1%',                  stato: 'da_fare',    anno: 2026 },
  { id: 'ad17', adempimento: 'Modello 730',                                   categoria: 'Dichiarazioni', scadenza: '2026-09-30', note: "Anno d'imposta 2025",                   stato: 'da_fare',    anno: 2026 },
  { id: 'ad18', adempimento: 'Redditi PF / SP',                               categoria: 'Dichiarazioni', scadenza: '2026-09-30', note: "Anno d'imposta 2025",                   stato: 'da_fare',    anno: 2026 },
  { id: 'ad19', adempimento: 'Dichiarazione IRAP',                            categoria: 'Dichiarazioni', scadenza: '2026-09-30', note: "Anno d'imposta 2025",                   stato: 'da_fare',    anno: 2026 },
  { id: 'ad20', adempimento: 'Compilazione ISA',                              categoria: 'Dichiarazioni', scadenza: '2026-09-30', note: 'Soggetti ISA',                          stato: 'da_fare',    anno: 2026 },
  { id: 'ad21', adempimento: 'Modello 770',                                   categoria: 'Dipendenti',    scadenza: '2026-10-31', note: "Anno d'imposta 2025",                   stato: 'da_fare',    anno: 2026 },
  { id: 'ad22', adempimento: 'Acconto imposte — II rata',                     categoria: 'Acconti',       scadenza: '2026-11-30', note: '',                                      stato: 'da_fare',    anno: 2026 },
  { id: 'ad23', adempimento: 'Redditi SC — IRES',                             categoria: 'Dichiarazioni', scadenza: '2026-11-30', note: "Anno d'imposta 2025 — esercizio solare", stato: 'da_fare',   anno: 2026 },
  { id: 'ad24', adempimento: 'Liquidazione IVA — III trim. (lug-set)',        categoria: 'IVA',           scadenza: '2026-11-16', note: '',                                      stato: 'da_fare',    anno: 2026 },
];

export const ATTIVITA = [
  { id: 'a1', clienteId: 'c1', clienteNome: 'Rossi Mario', data: '2025-05-10', voceId: 'mod_730_semplice', voceDescrizione: 'Modello 730 semplice', collaboratore: 'Giorgio', importoUnitario: 150, quantita: 1, importoNetto: 150, contributoIntegrativo: 6, iva: 34.32, importoTotale: 190.32, fatturato: false, createdAt: '2025-05-10T09:00:00Z' },
  { id: 'a2', clienteId: 'c2', clienteNome: 'Bianchi SRL', data: '2025-04-20', voceId: 'bilancio_ordinario', voceDescrizione: 'Redazione bilancio d\'esercizio', collaboratore: 'Giorgio', importoUnitario: 900, quantita: 1, importoNetto: 900, contributoIntegrativo: 36, iva: 206.52, importoTotale: 1142.52, fatturato: true, createdAt: '2025-04-20T10:00:00Z' },
  { id: 'a3', clienteId: 'c2', clienteNome: 'Bianchi SRL', data: '2025-05-05', voceId: 'busta_paga', voceDescrizione: 'Elaborazione busta paga (per dipendente)', collaboratore: 'Laura', importoUnitario: 28, quantita: 5, importoNetto: 140, contributoIntegrativo: 5.6, iva: 32.03, importoTotale: 177.63, fatturato: false, createdAt: '2025-05-05T11:00:00Z' },
  { id: 'a4', clienteId: 'c3', clienteNome: 'Verdi Anna (Forfettario)', data: '2025-03-15', voceId: 'contabilita_forfettario', voceDescrizione: 'Tenuta contabilità — regime forfettario', collaboratore: 'Laura', importoUnitario: 600, quantita: 1, importoNetto: 600, contributoIntegrativo: 24, iva: 137.28, importoTotale: 761.28, fatturato: true, createdAt: '2025-03-15T08:00:00Z' },
  { id: 'a5', clienteId: 'c4', clienteNome: 'Studio Tecnico Neri', data: '2025-06-01', voceId: 'consulenza_oraria', voceDescrizione: 'Consulenza professionale (tariffa oraria)', collaboratore: 'Giorgio', importoUnitario: 120, quantita: 2, importoNetto: 240, contributoIntegrativo: 9.6, iva: 54.91, importoTotale: 304.51, fatturato: false, createdAt: '2025-06-01T09:00:00Z' },
];

export const WORKFLOW_TEMPLATES = [
  {
    id: 'predefinito_onboarding', nome: 'Onboarding Nuovo Cliente', predefinito: true,
    descrizione: 'Privacy, mandato, task iniziali e email di benvenuto',
    steps: [
      { id: 1, tipo: 'task', titolo: 'Compila anagrafica completa', assegnato: 'Laura', priorita: 'alta' },
      { id: 2, tipo: 'documento', templateId: 'privacy', descrizione: 'Genera Informativa Privacy GDPR' },
      { id: 3, tipo: 'documento', templateId: 'mandato', descrizione: 'Genera Mandato Professionale' },
      { id: 4, tipo: 'task', titolo: 'Invia mandato al cliente per firma', assegnato: 'Ylenia', priorita: 'alta' },
      { id: 7, tipo: 'email', emailTemplateNome: 'Lettera di Benvenuto', descrizione: 'Email di benvenuto' },
    ],
  },
  {
    id: 'predefinito_dichiarazione', nome: 'Dichiarazione Redditi', predefinito: true,
    descrizione: 'Dalla richiesta documenti alla trasmissione telematica',
    steps: [
      { id: 1, tipo: 'email', emailTemplateNome: 'Richiesta Documenti Periodica', descrizione: 'Richiesta documenti al cliente' },
      { id: 2, tipo: 'task', titolo: 'Raccolta e verifica documentazione', priorita: 'alta' },
      { id: 3, tipo: 'task', titolo: 'Compilazione dichiarazione dei redditi', priorita: 'alta' },
      { id: 5, tipo: 'task', titolo: 'Trasmissione telematica', priorita: 'alta' },
    ],
  },
];

export const EMAIL_TEMPLATES = [
  { id: 'et1', nome: 'Lettera di Benvenuto', categoria: 'Onboarding', oggetto: 'Benvenuto in Studio GDS — {{ragioneSociale}}', corpo: 'Gentile {{ragioneSociale}},\n\nsiamo lieti di darLe il benvenuto nel nostro studio.\n\nCordiali saluti,\nStudio GDS' },
  { id: 'et2', nome: 'Richiesta Documenti Periodica', categoria: 'Dichiarazioni', oggetto: 'Richiesta documenti — anno {{anno}}', corpo: 'Gentile {{ragioneSociale}},\n\nla invitiamo a inviarci i documenti necessari per la dichiarazione dei redditi.' },
];

export const EVENTI = [
  { id: 'ev1', titolo: 'Scadenza F24 Rossi', start: '2025-06-16T09:00:00', end: '2025-06-16T10:00:00', clienteId: 'c1', clienteNome: 'Rossi Mario', tipo: 'scadenza', isOnlineMeeting: false },
  { id: 'ev2', titolo: 'Riunione bilancio Bianchi SRL', start: '2025-06-20T14:00:00', end: '2025-06-20T15:30:00', clienteId: 'c2', clienteNome: 'Bianchi SRL', tipo: 'appuntamento', isOnlineMeeting: true },
  { id: 'ev3', titolo: 'Termine 730 Verdi', start: '2025-09-30T09:00:00', end: '2025-09-30T09:30:00', clienteId: 'c3', clienteNome: 'Verdi Anna', tipo: 'scadenza', isOnlineMeeting: false },
];

export const COMUNICAZIONI = [
  { id: 'com1', tipo: 'email_in', oggetto: 'Documenti per 730', mittente: 'mario.rossi@email.it', clienteId: 'c1', clienteNome: 'Rossi Mario', data: '2025-06-01T10:30:00Z', allegati: ['CU_2024.pdf'] },
  { id: 'com2', tipo: 'email_out', oggetto: 'Benvenuto in Studio GDS', destinatario: 'anna.verdi@gmail.com', clienteId: 'c3', clienteNome: 'Verdi Anna', data: '2025-05-15T09:00:00Z', allegati: [] },
  { id: 'com3', tipo: 'task', titolo: 'Verifica F24', clienteId: 'c1', clienteNome: 'Rossi Mario', data: '2025-06-01T09:00:00Z' },
];

export const TARIFFARIO = {
  anno: 2025,
  contributoIntegrativo: 0.04,
  iva: 0.22,
  voci: [
    { id: 'mod_730_semplice', categoria: 'Dichiarazioni', descrizione: 'Modello 730 semplice', importoBase: 150 },
    { id: 'redditi_pf', categoria: 'Dichiarazioni', descrizione: 'Redditi PF con attività d\'impresa', importoBase: 350 },
    { id: 'redditi_pf_forfettario', categoria: 'Dichiarazioni', descrizione: 'Redditi PF regime forfettario', importoBase: 250 },
    { id: 'redditi_sp', categoria: 'Dichiarazioni', descrizione: 'Redditi società di persone (SP)', importoBase: 600 },
    { id: 'redditi_sc', categoria: 'Dichiarazioni', descrizione: 'Redditi società di capitali (IRES)', importoBase: 900 },
    { id: 'dichiarazione_iva', categoria: 'IVA', descrizione: 'Dichiarazione IVA annuale', importoBase: 200 },
    { id: 'liquidazione_iva_mensile', categoria: 'IVA', descrizione: 'Liquidazione IVA mensile', importoBase: 80 },
    { id: 'liquidazione_iva_trim', categoria: 'IVA', descrizione: 'Liquidazione IVA trimestrale', importoBase: 120 },
    { id: 'contabilita_forfettario', categoria: 'Contabilità', descrizione: 'Tenuta contabilità forfettario (canone annuale)', importoBase: 600 },
    { id: 'contabilita_semplificata', categoria: 'Contabilità', descrizione: 'Tenuta contabilità semplificata (canone mensile)', importoBase: 150 },
    { id: 'contabilita_ordinaria', categoria: 'Contabilità', descrizione: 'Tenuta contabilità ordinaria (canone mensile)', importoBase: 300 },
    { id: 'busta_paga', categoria: 'Paghe', descrizione: 'Elaborazione busta paga (per dipendente)', importoBase: 28 },
    { id: 'bilancio_ordinario', categoria: 'Societario', descrizione: 'Redazione bilancio d\'esercizio', importoBase: 900 },
    { id: 'deposito_bilancio_cciaa', categoria: 'Societario', descrizione: 'Deposito bilancio CCIAA', importoBase: 180 },
    { id: 'consulenza_oraria', categoria: 'Consulenza', descrizione: 'Consulenza professionale (tariffa oraria)', importoBase: 120 },
    { id: 'consulenza_straordinaria', categoria: 'Consulenza', descrizione: 'Consulenza straordinaria / contenzioso', importoBase: 200 },
  ],
};

export const DASHBOARD_PARC = {
  totaleAnno: 2376.43,
  totaleMese: 671.83,
  totaleDaFatturare: 672.46,
  conteggioAttivita: 5,
  perCliente: [
    ['Bianchi SRL', 1320.15],
    ['Verdi Anna (Forfettario)', 761.28],
    ['Studio Tecnico Neri', 304.51],
    ['Rossi Mario', 190.32],
  ],
  perCollaboratore: [
    ['Giorgio', 1637.35],
    ['Laura', 938.91],
  ],
};
