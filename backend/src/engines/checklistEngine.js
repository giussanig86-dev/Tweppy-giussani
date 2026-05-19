// Motore checklist adempimenti fiscali italiani — logica pura, nessuna dipendenza esterna

const MESI = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno',
               'Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];

function d(anno, mese, giorno) {
  return `${anno}-${String(mese).padStart(2,'0')}-${String(giorno).padStart(2,'0')}`;
}

function generateChecklist(cliente, anno) {
  const {
    regimeFiscale, tipologiaCliente, ivaPeriodicita,
    soggettoISA, soggettoRitenute, dipendenti, partitaIva,
  } = cliente;

  const adempimenti = [];
  const forfettario   = regimeFiscale === 'forfettario';
  const haPiva        = !!partitaIva;
  const nDip          = parseInt(dipendenti) || 0;
  const isPF          = ['persona fisica','professionista','imprenditore individuale'].includes(tipologiaCliente);
  const isSC          = ['società capitali','startup innovativa'].includes(tipologiaCliente);
  const isSP          = tipologiaCliente === 'società persone';

  function add(adempimento, categoria, scadenza, note) {
    adempimenti.push({ adempimento, categoria, scadenza, note: note || '', stato: 'da_fare' });
  }

  // ─── IVA ─────────────────────────────────────────────────────────────────
  if (haPiva && !forfettario && ivaPeriodicita && ivaPeriodicita !== 'esonerato') {
    add('Dichiarazione IVA annuale', 'IVA', d(anno,4,30), `Anno d'imposta ${anno-1}`);

    if (ivaPeriodicita === 'mensile') {
      for (let m = 1; m <= 12; m++) {
        const ms = m === 12 ? 1 : m + 1;
        const as = m === 12 ? anno + 1 : anno;
        add(`Liquidazione IVA — ${MESI[m-1]}`, 'IVA', d(as,ms,16));
      }
    } else if (ivaPeriodicita === 'trimestrale') {
      add('Liquidazione IVA — I trimestre (gen-mar)',  'IVA', d(anno,5,30), 'Maggiorazione 1%');
      add('Liquidazione IVA — II trimestre (apr-giu)', 'IVA', d(anno,8,20), 'Maggiorazione 1%');
      add('Liquidazione IVA — III trimestre (lug-set)','IVA', d(anno,11,16));
      add('Liquidazione IVA — IV trimestre (ott-dic)', 'IVA', d(anno+1,2,16));
    }
  }

  // ─── Dichiarazioni redditi ────────────────────────────────────────────────
  if (haPiva || isPF) {
    if (forfettario || isPF || isSP) {
      const label = forfettario ? 'Redditi PF — regime forfettario' : isSP ? 'Redditi SP' : 'Redditi PF';
      add(label, 'Dichiarazioni', d(anno,9,30), `Anno d'imposta ${anno-1}`);
    }
    if (isSC) {
      add('Redditi SC (IRES)', 'Dichiarazioni', d(anno,11,30), `Anno d'imposta ${anno-1} — esercizio solare`);
    }
  }

  // IRAP
  if (haPiva && !forfettario && (isSC || isSP || nDip > 0)) {
    add('Dichiarazione IRAP', 'Dichiarazioni', isSC ? d(anno,11,30) : d(anno,9,30), `Anno d'imposta ${anno-1}`);
  }

  // ISA
  if (soggettoISA && haPiva && !forfettario) {
    add('Compilazione ISA', 'Dichiarazioni', isSC ? d(anno,11,30) : d(anno,9,30), 'Allegata alla dichiarazione redditi');
  }

  // ─── Acconti ─────────────────────────────────────────────────────────────
  if (haPiva || isPF) {
    const tipo = forfettario ? 'Imposta sostitutiva' : isSC ? 'IRES/IRAP' : 'IRPEF/IRAP';
    add(`Acconto ${tipo} — I rata`,  'Acconti', d(anno,6,30), 'Proroga 30 luglio con +0,40%');
    add(`Acconto ${tipo} — II rata`, 'Acconti', d(anno,11,30));
  }

  // ─── Ritenute mensili ────────────────────────────────────────────────────
  if (soggettoRitenute || nDip > 0) {
    for (let m = 1; m <= 12; m++) {
      const ms = m === 12 ? 1 : m + 1;
      const as = m === 12 ? anno + 1 : anno;
      add(`F24 Ritenute — ${MESI[m-1]}`, 'Ritenute', d(as,ms,16));
    }
  }

  // ─── Dipendenti ──────────────────────────────────────────────────────────
  if (nDip > 0) {
    add('CU — Certificazione Unica (trasmissione AE)', 'Dipendenti', d(anno,3,31), `${nDip} dipendente/i — anno ${anno-1}`);
    add('Modello 770', 'Dipendenti', d(anno,10,31), `Anno d'imposta ${anno-1}`);
  }

  // ─── Societario ──────────────────────────────────────────────────────────
  if (isSC) {
    add('Approvazione bilancio — assemblea soci', 'Societario', d(anno,4,30), 'Entro 120 gg dalla chiusura esercizio');
    add('Deposito bilancio CCIAA', 'Societario', d(anno,5,30), 'Entro 30 gg dall\'approvazione');
  }

  return adempimenti.sort((a,b) => a.scadenza.localeCompare(b.scadenza));
}

module.exports = { generateChecklist };
