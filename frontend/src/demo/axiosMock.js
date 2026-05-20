/**
 * Demo mode: intercept every axios request and return mock data.
 * Uses config.adapter override — no changes needed in any API module.
 */
import axios from 'axios';
import { v4 as uuid } from 'uuid';
import * as m from './mockData';

if (import.meta.env.VITE_DEMO_MODE === 'true') {
  // mutable state
  let clienti = [...m.CLIENTI];
  let tasks = [...m.TASKS];
  let checklist = [...m.CHECKLIST];
  let attivita = [...m.ATTIVITA];
  let emailTemplates = [...m.EMAIL_TEMPLATES];
  let workflows = [...m.WORKFLOW_TEMPLATES];
  let eventi = [...m.EVENTI];

  function ok(data, status = 200) {
    return Promise.resolve({ data, status, statusText: 'OK', headers: {}, config: {}, request: {} });
  }

  function route(method, url, body) {
    const m2 = method.toLowerCase();

    // ── anagrafica ─────────────────────────────────────────────────────────
    if (url.startsWith('/api/anagrafica')) {
      const id = url.split('/')[3];
      if (m2 === 'get' && !id) return ok(clienti.filter(c => c.stato !== 'eliminato'));
      if (m2 === 'get' && id) return ok(clienti.find(c => c.id === id));
      if (m2 === 'post') { const n = { id: uuid(), stato: 'attivo', ...body }; clienti.push(n); return ok(n, 201); }
      if (m2 === 'put') { clienti = clienti.map(c => c.id === id ? { ...c, ...body } : c); return ok({ success: true }); }
      if (m2 === 'delete') { clienti = clienti.map(c => c.id === id ? { ...c, stato: 'eliminato' } : c); return ok({ success: true }); }
    }

    // ── tasks ──────────────────────────────────────────────────────────────
    if (url.startsWith('/api/tasks')) {
      const id = url.split('/')[3];
      if (m2 === 'get') return ok(tasks);
      if (m2 === 'post') { const n = { id: uuid(), stato: 'da_fare', ...body }; tasks.push(n); return ok(n, 201); }
      if (m2 === 'put') { tasks = tasks.map(t => t.id === id ? { ...t, ...body } : t); return ok({ success: true }); }
      if (m2 === 'delete') { tasks = tasks.filter(t => t.id !== id); return ok({ success: true }); }
    }

    // ── checklist ──────────────────────────────────────────────────────────
    if (url.startsWith('/api/checklist')) {
      const id = url.split('/')[3];
      if (m2 === 'get') {
        const params = new URLSearchParams(url.split('?')[1] || '');
        let r = [...checklist];
        if (params.get('clienteId')) r = r.filter(c => c.clienteId === params.get('clienteId'));
        if (params.get('anno')) r = r.filter(c => String(c.anno) === params.get('anno'));
        return ok(r);
      }
      if (m2 === 'post' && url.includes('/genera')) {
        const items = m.CHECKLIST.map(c => ({ ...c, id: uuid(), stato: 'aperto' }));
        checklist = [...checklist.filter(c => c.clienteId !== body?.clienteId), ...items];
        return ok({ generati: items.length });
      }
      if (m2 === 'put') { checklist = checklist.map(c => c.id === id ? { ...c, ...body } : c); return ok({ success: true }); }
    }

    // ── documenti ──────────────────────────────────────────────────────────
    if (url.startsWith('/api/documenti')) {
      if (m2 === 'get' && url.includes('/templates')) {
        return ok([
          { id: 'mandato', nome: 'Mandato Professionale', descrizione: 'Contratto di mandato tra studio e cliente' },
          { id: 'privacy', nome: 'Informativa Privacy GDPR', descrizione: 'Informativa ex art. 13 GDPR' },
          { id: 'benvenuto', nome: 'Lettera di Benvenuto', descrizione: 'Lettera di presentazione dello studio' },
          { id: 'richiesta_documenti', nome: 'Richiesta Documenti', descrizione: 'Richiesta periodica documenti al cliente' },
        ]);
      }
      if (m2 === 'post' && url.includes('/genera')) {
        // Simulate .docx download with a simple text blob
        const blob = new Blob(['[Demo] Documento generato da GDS Studio\n\nContenuto simulato per la modalità demo.'], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${body?.templateId || 'documento'}_demo.docx`;
        link.click();
        return ok({ success: true });
      }
    }

    // ── templates (email) ──────────────────────────────────────────────────
    if (url.startsWith('/api/templates')) {
      const id = url.split('/')[3];
      if (m2 === 'get') return ok(emailTemplates);
      if (m2 === 'post' && !id) { const n = { id: uuid(), ...body }; emailTemplates.push(n); return ok(n, 201); }
      if (m2 === 'put') { emailTemplates = emailTemplates.map(t => t.id === id ? { ...t, ...body } : t); return ok({ success: true }); }
      if (m2 === 'delete') { emailTemplates = emailTemplates.filter(t => t.id !== id); return ok({ success: true }); }
      if (m2 === 'post' && url.includes('/anteprima')) return ok({ anteprime: clienti.slice(0, 3).map(c => ({ cliente: c.ragioneSociale, oggetto: body.oggetto, corpo: body.corpo })) });
      if (m2 === 'post' && url.includes('/invia-batch')) return ok({ inviati: clienti.length, errori: 0 });
    }

    // ── calendario ─────────────────────────────────────────────────────────
    if (url.startsWith('/api/calendario')) {
      const id = url.split('/')[3];
      if (m2 === 'get') return ok(eventi);
      if (m2 === 'post') { const n = { id: uuid(), ...body }; eventi.push(n); return ok(n, 201); }
      if (m2 === 'put') { eventi = eventi.map(e => e.id === id ? { ...e, ...body } : e); return ok({ success: true }); }
      if (m2 === 'delete') { eventi = eventi.filter(e => e.id !== id); return ok({ success: true }); }
    }

    // ── email / comunicazioni ──────────────────────────────────────────────
    if (url.startsWith('/api/email')) {
      if (url.includes('/caselle')) return ok(['me', 'info@studiogds.it']);
      if (url.includes('/scansiona')) return ok({ elaborati: 0, dettaglio: [] });
      if (url.includes('/task-da-mail')) {
        const n = { id: uuid(), titolo: body.titolo, clienteId: body.clienteId, clienteNome: body.clienteNome, assegnato: body.assegnato, priorita: body.priorita, stato: 'da_fare', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        tasks.push(n);
        return ok(n, 201);
      }
      if (url.includes('/messaggio/')) return ok({
        id: 'msg-demo-1',
        subject: 'Documenti per 730',
        from: { emailAddress: { address: 'mario.rossi@email.it', name: 'Mario Rossi' } },
        receivedDateTime: new Date().toISOString(),
        body: { contentType: 'html', content: '<p>Buongiorno,</p><p>in allegato troverà la CU 2024 e le spese mediche come richiesto.</p><p>Rimango a disposizione per qualsiasi chiarimento.</p><p>Cordiali saluti,<br>Mario Rossi</p>' },
      });
      if (url.includes('/rispondi/')) return ok({ success: true });
      const clienteId = url.split('/storico/')[1]?.split('?')[0];
      if (clienteId) {
        const cliente = clienti.find(c => c.id === clienteId);
        const items = m.COMUNICAZIONI.filter(c => c.clienteId === clienteId);
        const timeline = [
          ...items.map(i => i.tipo === 'task'
            ? { tipo: 'task', data: i.data, titolo: i.titolo, stato: 'da_fare', assegnato: '' }
            : i.tipo === 'email_in'
              ? { tipo: 'email_ricevuta', data: i.data, titolo: i.oggetto, preview: 'In allegato i documenti richiesti per la dichiarazione dei redditi.', messageId: 'msg-demo-1', casella: 'me' }
              : { tipo: 'email_inviata', data: i.data, titolo: i.oggetto, casella: 'me' }
          ),
        ].sort((a, b) => new Date(b.data) - new Date(a.data));
        return ok({ cliente: cliente?.ragioneSociale || '', clienteEmail: cliente?.email || '', timeline });
      }
      return ok({ cliente: '', timeline: [] });
    }

    // ── workflow ───────────────────────────────────────────────────────────
    if (url.startsWith('/api/workflow')) {
      const parts = url.split('/');
      const id = parts[3];
      if (m2 === 'get') return ok(workflows);
      if (m2 === 'post' && !id) { const n = { id: uuid(), predefinito: false, ...body }; workflows.push(n); return ok(n, 201); }
      if (m2 === 'put') { workflows = workflows.map(w => w.id === id ? { ...w, ...body } : w); return ok({ success: true }); }
      if (m2 === 'delete') { workflows = workflows.filter(w => w.id !== id); return ok({ success: true }); }
      if (m2 === 'post' && url.includes('/esegui')) {
        return ok({
          workflowNome: workflows.find(w => w.id === id)?.nome || 'Workflow',
          risultati: (workflows.find(w => w.id === id)?.steps || []).map(s => ({
            stepId: s.id, tipo: s.tipo, stato: 'ok',
            dettaglio: s.tipo === 'task' ? `Task creato: ${s.titolo}` : s.tipo === 'documento' ? `Documento salvato: ${s.templateId}` : `Email inviata: ${s.emailTemplateNome}`,
          })),
        });
      }
    }

    // ── parcellazione ──────────────────────────────────────────────────────
    if (url.startsWith('/api/parcellazione')) {
      if (url.includes('/tariffario')) return ok(m.TARIFFARIO);
      if (url.includes('/dashboard')) return ok(m.DASHBOARD_PARC);
      if (url.includes('/task-completati')) return ok(tasks.filter(t => t.stato === 'completato'));
      if (url.includes('/importa-task')) {
        const imported = tasks.filter(t => (body?.taskIds || []).includes(t.id)).map(t => ({
          id: uuid(), clienteId: t.clienteId, clienteNome: t.clienteNome,
          data: new Date().toISOString().slice(0, 10), voceId: body.voceId || 'consulenza_oraria',
          voceDescrizione: 'Consulenza professionale', importoUnitario: 120, quantita: 1,
          importoNetto: 120, contributoIntegrativo: 4.8, iva: 27.46, importoTotale: 152.26,
          fatturato: false, createdAt: new Date().toISOString(),
        }));
        attivita = [...attivita, ...imported];
        return ok({ importati: imported.length });
      }
      if (url.includes('/fattura')) {
        const ids = body?.ids || [];
        attivita = attivita.map(a => ids.includes(a.id) ? { ...a, fatturato: true, fatturatoAt: new Date().toISOString() } : a);
        return ok({ success: true, aggiornati: ids.length });
      }

      const attId = url.split('/')[4];
      if (m2 === 'get') {
        const params = new URLSearchParams(url.split('?')[1] || '');
        let r = [...attivita];
        if (params.get('clienteId')) r = r.filter(a => a.clienteId === params.get('clienteId'));
        if (params.get('anno')) r = r.filter(a => a.data?.startsWith(params.get('anno')));
        if (params.get('fatturato') !== null && params.get('fatturato') !== '') r = r.filter(a => String(a.fatturato) === params.get('fatturato'));
        return ok(r);
      }
      if (m2 === 'post') { const n = { id: uuid(), fatturato: false, createdAt: new Date().toISOString(), ...body }; attivita.push(n); return ok(n, 201); }
      if (m2 === 'put') { attivita = attivita.map(a => a.id === attId ? { ...a, ...body } : a); return ok({ success: true }); }
      if (m2 === 'delete') { attivita = attivita.filter(a => a.id !== attId); return ok({ success: true }); }
    }

    // ── OCR ────────────────────────────────────────────────────────────────
    if (url.startsWith('/api/ocr')) {
      if (url.includes('/estrai')) return ok({ ragioneSociale: 'Demo SpA', codiceFiscale: 'DMOSPA00A00H501Z', tipo: 'visura_camerale', note: 'Documento analizzato in modalità demo' });
      if (url.includes('/salva')) return ok({ success: true });
    }

    console.warn('[DemoMock] unhandled:', m2.toUpperCase(), url);
    return ok({});
  }

  axios.interceptors.request.use(config => {
    const url = config.url || '';
    if (!url.startsWith('/api/')) return config;
    let body = {};
    try { body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data || {}; } catch {}
    config.adapter = () => route(config.method, url, body);
    return config;
  });
}
