const { v4: uuidv4 } = require('uuid');
const { getListItems, getListItemById, createListItem } = require('../graph/sharepoint');
const { saveClientDocument } = require('../graph/files');
const { askClaude } = require('./claudeClient');
const { sendMail } = require('../graph/mail');
const { TEMPLATES } = require('./documentiTemplates');
const { creaDocx } = require('../utils/docxUtils');
const { riempiTemplate } = require('../utils/templateUtils');

// Fix circular: require claudeClient directly
const Anthropic = require('@anthropic-ai/sdk');
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const WORKFLOWS_PREDEFINITI = [
  {
    id: 'predefinito_onboarding',
    nome: 'Onboarding Nuovo Cliente',
    descrizione: 'Privacy, mandato, task iniziali e email di benvenuto per un nuovo cliente',
    predefinito: true,
    steps: [
      { id: 1, tipo: 'task',      titolo: 'Compila anagrafica completa',         assegnato: 'Laura',  priorita: 'alta' },
      { id: 2, tipo: 'documento', templateId: 'privacy',  descrizione: 'Genera Informativa Privacy GDPR' },
      { id: 3, tipo: 'documento', templateId: 'mandato',  descrizione: 'Genera Mandato Professionale' },
      { id: 4, tipo: 'task',      titolo: 'Invia mandato al cliente per firma',   assegnato: 'Ylenia', priorita: 'alta' },
      { id: 5, tipo: 'task',      titolo: 'Archivia mandato firmato',             assegnato: 'Ylenia', priorita: 'media' },
      { id: 6, tipo: 'task',      titolo: 'Inserisci cliente in contabilità',     assegnato: 'Giorgio',priorita: 'media' },
      { id: 7, tipo: 'email',     emailTemplateNome: 'Lettera di Benvenuto',      descrizione: 'Email di benvenuto' },
    ],
  },
  {
    id: 'predefinito_cessazione',
    nome: 'Cessazione Cliente',
    descrizione: 'Chiusura ordinata del rapporto professionale',
    predefinito: true,
    steps: [
      { id: 1, tipo: 'task', titolo: 'Verifica adempimenti fiscali aperti',         priorita: 'alta' },
      { id: 2, tipo: 'task', titolo: 'Emetti nota parcella finale',  assegnato: 'Giorgio', priorita: 'alta' },
      { id: 3, tipo: 'task', titolo: 'Archivia tutta la documentazione cliente',    priorita: 'media' },
      { id: 4, tipo: 'task', titolo: 'Imposta cliente come inattivo in anagrafica', priorita: 'media' },
      { id: 5, tipo: 'task', titolo: 'Comunicazione conclusione rapporto',          priorita: 'alta' },
    ],
  },
  {
    id: 'predefinito_dichiarazione',
    nome: 'Dichiarazione Redditi',
    descrizione: 'Dalla richiesta documenti alla trasmissione telematica',
    predefinito: true,
    steps: [
      { id: 1, tipo: 'email', emailTemplateNome: 'Richiesta Documenti Periodica', descrizione: 'Richiesta documenti al cliente' },
      { id: 2, tipo: 'task',  titolo: 'Raccolta e verifica documentazione',     priorita: 'alta' },
      { id: 3, tipo: 'task',  titolo: 'Compilazione dichiarazione dei redditi', priorita: 'alta' },
      { id: 4, tipo: 'task',  titolo: 'Invio bozza al cliente per approvazione', assegnato: 'Ylenia', priorita: 'alta' },
      { id: 5, tipo: 'task',  titolo: 'Trasmissione telematica',                priorita: 'alta' },
      { id: 6, tipo: 'task',  titolo: 'Invio ricevuta al cliente',              assegnato: 'Ylenia', priorita: 'media' },
    ],
  },
];

async function eseguiWorkflow(graphToken, workflowId, cliente) {
  let workflow = WORKFLOWS_PREDEFINITI.find((w) => w.id === workflowId);
  if (!workflow) {
    workflow = await getListItemById(graphToken, 'Workflow_Templates', workflowId);
    workflow.steps = typeof workflow.steps === 'string' ? JSON.parse(workflow.steps) : workflow.steps;
  }

  const steps = workflow.steps;
  const risultati = [];

  for (const step of steps) {
    try {
      let dettaglio = '';

      if (step.tipo === 'task') {
        await createListItem(graphToken, 'Task_Log', {
          id: uuidv4(),
          titolo: step.titolo,
          clienteId: cliente.id,
          clienteNome: cliente.ragioneSociale,
          assegnato: step.assegnato || '',
          priorita: step.priorita || 'media',
          stato: 'da_fare',
          note: `Workflow: ${workflow.nome}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        dettaglio = `Task creato: ${step.titolo}`;

      } else if (step.tipo === 'documento') {
        const template = TEMPLATES.find((t) => t.id === step.templateId);
        if (!template) throw new Error(`Template documento "${step.templateId}" non trovato`);
        const dataOggi = new Date().toLocaleDateString('it-IT');
        const msg = await client.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 2048,
          system: template.systemPrompt,
          messages: [{ role: 'user', content: `Dati cliente:\n${JSON.stringify(cliente, null, 2)}\nData: ${dataOggi}\n\nTemplate:\n${template.corpo}` }],
        });
        const testo = msg.content[0].text;
        const buffer = await creaDocx(template.nome, testo);
        await saveClientDocument(graphToken, {
          buffer,
          originalname: `${step.templateId}.docx`,
          mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          ragioneSociale: cliente.ragioneSociale,
          tipoDocumento: 'documenti_generati',
        });
        dettaglio = `Documento salvato: ${template.nome}`;

      } else if (step.tipo === 'email') {
        if (!cliente.email) throw new Error('Cliente senza indirizzo email');
        const emailTemplates = await getListItems(graphToken, 'Email_Templates');
        const tpl = emailTemplates.find(
          (t) => t.nome?.toLowerCase() === step.emailTemplateNome?.toLowerCase()
        );
        if (!tpl) throw new Error(`Template email "${step.emailTemplateNome}" non trovato — crearlo in Template Manager`);
        const oggetto = riempiTemplate(tpl.oggetto, cliente);
        const corpo = riempiTemplate(tpl.corpo, cliente);
        await sendMail(graphToken, { to: cliente.email, subject: oggetto, body: corpo });
        dettaglio = `Email inviata: ${oggetto}`;
      }

      risultati.push({ stepId: step.id, tipo: step.tipo, stato: 'ok', dettaglio });
    } catch (err) {
      risultati.push({ stepId: step.id, tipo: step.tipo, stato: 'errore', errore: err.message });
    }
  }

  return { workflowNome: workflow.nome, risultati };
}

module.exports = { WORKFLOWS_PREDEFINITI, eseguiWorkflow };
