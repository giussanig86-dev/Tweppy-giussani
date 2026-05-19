const TEMPLATES = [
  {
    id: 'mandato',
    nome: 'Mandato Professionale',
    descrizione: 'Lettera di incarico professionale per nuovi clienti',
    systemPrompt: `Sei un commercialista italiano. Compila il seguente mandato professionale sostituendo tutti i segnaposto {{}} con i dati reali del cliente forniti. Per le sezioni che richiedono testo descrittivo (servizi, compenso), genera un testo professionale appropriato basandoti sul tipo di cliente e regime fiscale. Restituisci SOLO il testo del documento, nessuna spiegazione.`,
    corpo: `MANDATO PROFESSIONALE

Spettabile
{{ragioneSociale}}
{{indirizzo}}, {{cap}} {{comune}} ({{provincia}})
C.F. {{codiceFiscale}} — P.IVA {{partitaIva}}

Data: {{dataOggi}}

Oggetto: Conferimento incarico professionale

Con la presente lo Studio GDS conferma l'accettazione dell'incarico professionale affidatoci.

1. OGGETTO DELL'INCARICO
{{descrizioneServizi}}

2. COMPENSO PROFESSIONALE
{{descrizioneCompenso}}

3. DURATA
Il presente mandato decorre dalla data di sottoscrizione e si rinnova tacitamente di anno in anno, salvo disdetta scritta con preavviso di 30 giorni.

4. OBBLIGHI DEL CLIENTE
Il cliente si impegna a fornire tempestivamente tutta la documentazione necessaria all'espletamento dell'incarico.

5. TRATTAMENTO DEI DATI PERSONALI
I dati personali saranno trattati nel rispetto del Regolamento UE 2016/679 (GDPR) come da informativa allegata.

Per accettazione:
{{ragioneSociale}}
_______________________

Studio GDS
_______________________`,
  },
  {
    id: 'privacy',
    nome: 'Informativa Privacy GDPR',
    descrizione: 'Informativa ex art. 13 GDPR per il trattamento dei dati personali',
    systemPrompt: `Sei un esperto di privacy e GDPR. Compila l'informativa privacy sostituendo tutti i segnaposto {{}} con i dati reali del cliente. Mantieni il linguaggio formale e conforme al GDPR. Restituisci SOLO il testo del documento.`,
    corpo: `INFORMATIVA SUL TRATTAMENTO DEI DATI PERSONALI
(ai sensi dell'art. 13 del Regolamento UE 2016/679 - GDPR)

Gentile {{ragioneSociale}},

in qualità di Titolare del trattamento, lo Studio GDS La informa che i dati personali da Lei forniti saranno trattati nel rispetto della normativa vigente.

TITOLARE DEL TRATTAMENTO
Studio GDS — [indirizzo studio]

FINALITÀ E BASE GIURIDICA DEL TRATTAMENTO
I Suoi dati vengono trattati per le seguenti finalità:
{{finalitaTrattamento}}

DATI TRATTATI
{{tipologiaDati}}

CONSERVAZIONE
I dati saranno conservati per il tempo necessario all'espletamento delle finalità indicate e comunque nel rispetto degli obblighi di legge (10 anni per la documentazione fiscale e contabile).

DIRITTI DELL'INTERESSATO
Lei ha il diritto di accedere ai propri dati, richiederne la rettifica, la cancellazione, la limitazione del trattamento e la portabilità, nonché di proporre reclamo al Garante per la Protezione dei Dati Personali.

Per l'esercizio dei Suoi diritti può contattare: [email studio]

Data: {{dataOggi}}

Per presa visione e accettazione:
{{ragioneSociale}}
_______________________`,
  },
  {
    id: 'benvenuto',
    nome: 'Lettera di Benvenuto',
    descrizione: 'Email/lettera di benvenuto per nuovi clienti con richiesta documenti iniziali',
    systemPrompt: `Sei un commercialista italiano. Scrivi una lettera di benvenuto professionale e cordiale per il nuovo cliente, personalizzata in base al suo tipo (${''}) e regime fiscale. Includi una lista dei documenti iniziali necessari appropriata per la sua situazione. Sostituisci i segnaposto {{}}. Restituisci SOLO il testo.`,
    corpo: `Spettabile {{ragioneSociale}},

siamo lieti di darLe il benvenuto tra i clienti dello Studio GDS.

A partire da oggi ci occuperemo di tutti gli adempimenti fiscali e contabili relativi alla Sua attività.

{{testoPersonalizzato}}

Per avviare la collaborazione, La preghiamo di fornirci i seguenti documenti:

{{listaDocumenti}}

Rimaniamo a Sua completa disposizione per qualsiasi chiarimento.

Cordiali saluti,
Studio GDS`,
  },
  {
    id: 'richiesta_documenti',
    nome: 'Richiesta Documenti Periodica',
    descrizione: 'Richiesta documenti contabili/fiscali periodica al cliente',
    systemPrompt: `Sei un commercialista. Scrivi una lettera professionale di richiesta documenti per il cliente. Personalizza la lista dei documenti richiesti in base al tipo di cliente e regime fiscale. Sostituisci i segnaposto {{}}. Restituisci SOLO il testo.`,
    corpo: `Spettabile {{ragioneSociale}},

in vista della scadenza del {{prossima Scadenza}}, La contattamo per richiedere la documentazione necessaria.

{{testoIntroduzione}}

Documenti necessari:

{{listaDocumenti}}

La preghiamo di trasmettere la documentazione entro il {{scadenzaInvio}}.

Resto a disposizione per qualsiasi chiarimento.

Cordiali saluti,
Studio GDS`,
  },
];

module.exports = { TEMPLATES };
