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
  let utenti = [
    { id: 'u1', email: 'admin@studio.it',         nome: 'Giorgio Demo',  ruolo: 'admin' },
    { id: 'u2', email: 'mario@studio.it',          nome: 'Mario Rossi',   ruolo: 'collaboratore' },
    { id: 'u3', email: 'anna@studio.it',           nome: 'Anna Verdi',    ruolo: 'visualizzatore' },
  ];
  let checklist = [...m.CHECKLIST];
  let adempimenti = [...m.ADEMPIMENTI];
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
      if (m2 === 'put') {
        const prev = clienti.find(c => c.id === id);
        clienti = clienti.map(c => c.id === id ? { ...c, ...body } : c);
        if (body.stato === 'cessato' && prev?.stato !== 'cessato') {
          const today = new Date().toISOString().slice(0, 10);
          checklist = checklist.filter(c => c.clienteId !== id || (c.scadenza || '') < today);
        }
        return ok({ success: true });
      }
      if (m2 === 'delete') { clienti = clienti.map(c => c.id === id ? { ...c, stato: 'eliminato' } : c); return ok({ success: true }); }
      if (m2 === 'post' && url.includes('/crea-cartelline')) {
        return ok({
          creato: ['01 - Vita societaria', '02 - Pratiche', '03 - Dichiarazioni fiscali', '04 - Contabilità', '05 - Buste paga', '06 - F24 e Versamenti'],
          esistente: ['07 - Privacy e GDPR', '08 - Corrispondenza'],
          errore: [],
        });
      }
    }

    // ── tasks ──────────────────────────────────────────────────────────────
    if (url.startsWith('/api/tasks')) {
      const parts = url.split('?')[0].split('/').filter(Boolean);
      const id = parts[2];
      const sub = parts[3]; // 'messaggi' or undefined
      if (id === 'badge') return ok({ count: tasks.filter(t => t.stato !== 'completato').length });
      if (sub === 'messaggi') {
        if (m2 === 'get') return ok([]);
        if (m2 === 'post') return ok({ id: uuid(), taskId: id, ...body, createdAt: new Date().toISOString() }, 201);
      }
      if (m2 === 'get') return ok(tasks);
      if (m2 === 'post') { const n = { id: uuid(), stato: 'da_fare', ...body }; tasks.push(n); return ok(n, 201); }
      if (m2 === 'put') { tasks = tasks.map(t => t.id === id ? { ...t, ...body } : t); return ok({ success: true }); }
      if (m2 === 'delete') { tasks = tasks.filter(t => t.id !== id); return ok({ success: true }); }
    }

    // ── checklist ──────────────────────────────────────────────────────────
    if (url.startsWith('/api/checklist')) {
      const parts = url.split('?')[0].split('/').filter(Boolean); // ['api','checklist',...]
      const seg3 = parts[2]; // primo segmento dopo 'checklist'
      const seg4 = parts[3]; // secondo segmento

      // GET /api/checklist/anno/:anno
      if (m2 === 'get' && seg3 === 'anno') {
        const anno = parseInt(seg4);
        return ok(adempimenti.filter(a => a.anno === anno).sort((a,b) => (a.scadenza||'').localeCompare(b.scadenza||'')));
      }
      // GET /api/checklist/matrice/:anno
      if (m2 === 'get' && seg3 === 'matrice') {
        const anno = parseInt(seg4);
        const params = new URLSearchParams(url.split('?')[1] || '');
        const mese = params.get('mese');
        let r = checklist.filter(c => c.clienteId && c.clienteId.trim() !== '' && c.anno === anno);
        if (mese) r = r.filter(c => c.scadenza?.startsWith(`${anno}-${mese}`));
        return ok(r);
      }
      // GET /api/checklist/:clienteId/:anno
      if (m2 === 'get' && seg3 && seg4) {
        return ok(checklist.filter(c => c.clienteId === seg3 && String(c.anno) === seg4));
      }
      // POST /api/checklist/genera-anno
      if (m2 === 'post' && seg3 === 'genera-anno') {
        const anno = parseInt(body?.anno || new Date().getFullYear());
        const generated = m.ADEMPIMENTI.filter(a => a.anno === anno).map(a => ({ ...a, id: uuid(), stato: 'da_fare' }));
        adempimenti = [...adempimenti.filter(a => a.anno !== anno), ...generated];
        return ok(generated.sort((a,b) => (a.scadenza||'').localeCompare(b.scadenza||'')));
      }
      // POST /api/checklist/genera
      if (m2 === 'post' && seg3 === 'genera') {
        const anno = parseInt(body?.anno || new Date().getFullYear());
        const template = m.CHECKLIST.map(c => ({ ...c, id: uuid(), clienteId: body?.cliente?.id || c.clienteId, anno, stato: 'da_fare' }));
        checklist = [...checklist.filter(c => c.clienteId !== body?.cliente?.id || c.anno !== anno), ...template];
        return ok(template);
      }
      // POST /api/checklist (nuovo adempimento singolo)
      if (m2 === 'post' && !seg3) {
        const n = { id: uuid(), stato: 'da_fare', anno: parseInt(body.anno), clienteId: '', clienteNome: '', ...body };
        adempimenti.push(n);
        return ok(n, 201);
      }
      // DELETE /api/checklist/cliente/:clienteId
      if (m2 === 'delete' && seg3 === 'cliente' && seg4) {
        const prev = checklist.length;
        checklist = checklist.filter(c => c.clienteId !== seg4);
        return ok({ eliminati: prev - checklist.length });
      }
      // PUT /api/checklist/:id
      if (m2 === 'put' && seg3) {
        adempimenti = adempimenti.map(a => a.id === seg3 ? { ...a, ...body } : a);
        checklist = checklist.map(c => c.id === seg3 ? { ...c, ...body } : c);
        return ok({ success: true });
      }
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
        const blob = new Blob(['[Demo] Documento generato da Velia GDS\n\nContenuto simulato per la modalità demo.'], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
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
      const parts = url.split('?')[0].split('/').filter(Boolean); // ['api','calendario',...]
      const seg = parts[2]; // 'eventi' | 'chat' | 'riepilogo'
      const id  = parts[3];

      if (seg === 'chat') {
        if (m2 === 'get') return ok([
          { id: 'cm1', eventoId: id, testo: 'Ricordati di portare i bilanci', autore: 'Giorgio Demo', autoreEmail: 'admin@studio.it', destinatario: '', createdAt: new Date(Date.now() - 3600000).toISOString() },
          { id: 'cm2', eventoId: id, testo: 'Ok, ci penso io', autore: 'Mario Rossi', autoreEmail: 'mario@studio.it', destinatario: 'Giorgio Demo', createdAt: new Date(Date.now() - 1800000).toISOString() },
        ]);
        if (m2 === 'post') return ok({ id: uuid(), eventoId: id, ...body, createdAt: new Date().toISOString() }, 201);
      }

      if (seg === 'riepilogo') {
        if (m2 === 'post') {
          const n = { id: uuid(), titolo: `Riepilogo riunione: ${body.eventoTitolo || 'appuntamento'}`, stato: 'da_fare', priorita: 'media', createdAt: new Date().toISOString() };
          tasks.push(n);
          return ok(n, 201);
        }
      }

      if (seg === 'auto-riepilogo') {
        if (m2 === 'post') {
          // Simula creazione task per eventi passati non ancora coperti
          const passati = eventi.filter(ev => {
            const fine = ev.end?.dateTime || ev.fine;
            return fine && new Date(fine) < new Date();
          });
          const nuovi = passati.filter(ev => !tasks.some(t => t.eventoId === ev.id));
          nuovi.forEach(ev => {
            tasks.push({ id: uuid(), eventoId: ev.id, titolo: `Riepilogo riunione: ${ev.subject || ev.titolo || 'appuntamento'}`, stato: 'da_fare', priorita: 'media', createdAt: new Date().toISOString() });
          });
          return ok({ creati: nuovi.length });
        }
      }

      // default: eventi CRUD
      if (m2 === 'get') return ok(eventi);
      if (m2 === 'post') { const n = { id: uuid(), ...body }; eventi.push(n); return ok(n, 201); }
      if (m2 === 'put') { eventi = eventi.map(e => e.id === id ? { ...e, ...body } : e); return ok({ success: true }); }
      if (m2 === 'delete') { eventi = eventi.filter(e => e.id !== id); return ok({ success: true }); }
    }

    // ── email / comunicazioni ──────────────────────────────────────────────
    if (url.startsWith('/api/email')) {
      const PDF_B64 = 'JVBERi0xLjQKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqCjIgMCBvYmo8PC9UeXBlL1BhZ2VzL0tpZHNbMyAwIFJdL0NvdW50IDE+PmVuZG9iagozIDAgb2JqPDwvVHlwZS9QYWdlL01lZGlhQm94WzAgMCA2MTIgNzkyXS9QYXJlbnQgMiAwIFIvUmVzb3VyY2VzPDwvRm9udDw8L0YxIDQgMCBSPj4+Pi9Db250ZW50cyA1IDAgUj4+ZW5kb2JqCjQgMCBvYmo8PC9UeXBlL0ZvbnQvU3VidHlwZS9UeXBlMS9CYXNlRm9udC9IZWx2ZXRpY2E+PmVuZG9iago1IDAgb2JqPDwvTGVuZ3RoIDQ0Pj4Kc3RyZWFtCkJUIC9GMSAxOCBUZiA1MCA3MDAgVGQgKENVIDIwMjQgLSBEZW1vKSBUaiBFVAplbmRzdHJlYW0KZW5kb2JqCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAwOSAwMDAwMCBuIAowMDAwMDAwMDU4IDAwMDAwIG4gCjAwMDAwMDAxMTUgMDAwMDAgbiAKMDAwMDAwMDI2NiAwMDAwMCBuIAowMDAwMDAwMzQ3IDAwMDAwIG4gCnRyYWlsZXI8PC9TaXplIDYvUm9vdCAxIDAgUj4+CnN0YXJ0eHJlZgo0NDcKJSVFT0Y=';
      const IMG_B64 = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k=';
      function b64toBlob(b64, type) {
        const bin = atob(b64);
        const arr = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
        return new Blob([arr], { type });
      }

      if (url.match(/\/note\/[^/?]+/)) {
        if (m2 === 'get') return ok([]);
        if (m2 === 'post') return ok({ id: uuid(), ...body, createdAt: new Date().toISOString() }, 201);
      }
      if (url.includes('/badge')) return ok({ count: 3, perCasella: { me: 2, 'info@studiogds.it': 1 } });
      if (url.includes('/caselle')) return ok(['me', 'info@studiogds.it']);
      if (url.includes('/scansiona')) return ok({ elaborati: 0, dettaglio: [] });
      if (url.includes('/task-da-mail')) {
        const n = { id: uuid(), titolo: body.titolo, clienteId: body.clienteId, clienteNome: body.clienteNome, assegnato: body.assegnato, priorita: body.priorita, stato: 'da_fare', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        tasks.push(n);
        return ok(n, 201);
      }

      // Stream endpoint — must come before /allegati/ check
      if (url.match(/\/allegati\/[^/?]+\/[^/?]+\/stream/)) {
        const urlParams = new URLSearchParams(url.split('?')[1] || '');
        const ct = urlParams.get('contentType') || 'application/pdf';
        let blob;
        if (ct.startsWith('image/')) {
          blob = b64toBlob(IMG_B64, ct);
        } else if (ct === 'application/pdf') {
          blob = b64toBlob(PDF_B64, 'application/pdf');
        } else {
          blob = new Blob(['[Demo] Contenuto file simulato'], { type: ct });
        }
        return ok(blob);
      }

      if (url.includes('/allegati/')) return ok([
        { id: 'att-1', name: 'CU_2024.pdf', contentType: 'application/pdf', size: 1243 },
        { id: 'att-2', name: 'Spese_mediche.jpg', contentType: 'image/jpeg', size: 134200 },
      ]);

      if (url.includes('/sharepoint-url/')) return ok({ url: 'https://studiogds.sharepoint.com/Shared%20Documents/01%20-%20Clienti' });

      if (url.includes('/sconosciuti')) return ok([
        { id: 's1', mittente: 'fornitore@acme.it', oggetto: 'Offerta commerciale software', preview: 'In allegato la nostra migliore offerta...', messageId: 'msg-sc-1', casella: 'me', data: new Date().toISOString() },
        { id: 's2', mittente: 'newsletter@fiscooggi.it', oggetto: 'Newsletter fiscale giugno 2025', preview: 'Le ultime novità in materia fiscale...', messageId: 'msg-sc-2', casella: 'info@studiogds.it', data: new Date(Date.now() - 3600000).toISOString() },
      ]);

      if (url.includes('/messaggio/')) return ok({
        id: 'msg-demo-1',
        subject: 'Documenti per 730',
        from: { emailAddress: { address: 'mario.rossi@email.it', name: 'Mario Rossi' } },
        receivedDateTime: new Date().toISOString(),
        body: { contentType: 'html', content: '<p>Buongiorno,</p><p>in allegato troverà la CU 2024 e le spese mediche come richiesto.</p><p>Rimango a disposizione per qualsiasi chiarimento.</p><p>Cordiali saluti,<br>Mario Rossi</p>' },
      });
      if (url.includes('/rispondi-a-tutti/')) return ok({ success: true });
      if (url.includes('/rispondi/')) return ok({ success: true });
      if (url.includes('/inoltra/')) return ok({ success: true });
      if (url.includes('/invia')) return ok({ success: true });
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
    if (url === '/api/auth/me') return ok({ email: 'admin@studio.it', nome: 'Giorgio Demo', ruolo: 'admin' });

    if (url.startsWith('/api/utenti')) {
      const id = url.split('/')[3];
      if (m2 === 'get') return ok(utenti);
      if (m2 === 'post') { const n = { id: uuid(), ...body }; utenti.push(n); return ok(n, 201); }
      if (m2 === 'put') { utenti = utenti.map(u => u.id === id ? { ...u, ...body } : u); return ok({ success: true }); }
      if (m2 === 'delete') { utenti = utenti.filter(u => u.id !== id); return ok({ success: true }); }
    }

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
