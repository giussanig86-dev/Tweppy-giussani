import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../auth/useAuth';
import { emailApi } from '../../api/email';
import Button from '../../components/ui/Button';

function formatBytes(b) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function fmt(d) {
  if (!d) return '';
  return new Date(d).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

const TOOLBAR = [
  { cmd: 'bold',              label: <b>G</b>,  title: 'Grassetto (Ctrl+B)' },
  { cmd: 'italic',            label: <i>C</i>,  title: 'Corsivo (Ctrl+I)' },
  { cmd: 'underline',         label: <u>S</u>,  title: 'Sottolineato (Ctrl+U)' },
  { cmd: 'strikeThrough',     label: <s>T</s>,  title: 'Barrato' },
  { sep: true },
  { cmd: 'insertUnorderedList', label: '≡', title: 'Elenco puntato' },
  { cmd: 'insertOrderedList',   label: '1.', title: 'Elenco numerato' },
  { sep: true },
  { cmd: 'justifyLeft',   label: '⬅', title: 'Allinea sinistra' },
  { cmd: 'justifyCenter', label: '⬜', title: 'Centra' },
  { cmd: 'justifyRight',  label: '➡', title: 'Allinea destra' },
  { sep: true },
  { cmd: 'removeFormat', label: '✕A', title: 'Rimuovi formattazione' },
];

function ToolbarBtn({ item, onFormat }) {
  if (item.sep) return <span className="w-px h-5 bg-gray-200 mx-0.5 inline-block" />;
  return (
    <button
      type="button"
      title={item.title}
      onMouseDown={e => { e.preventDefault(); onFormat(item.cmd); }}
      className="px-2 py-1 rounded text-sm text-gray-600 hover:bg-gray-200 transition leading-none"
    >
      {item.label}
    </button>
  );
}

export default function ComposeModal({ mode = 'new', replyTo, defaultTo, caselle = ['me'], clienteId, onClose, onSent }) {
  const { getToken } = useAuth();
  const editorRef = useRef(null);

  const [a, setA] = useState(() => {
    if (mode === 'reply') return replyTo?.fromEmail || defaultTo || '';
    if (mode === 'replyAll') return '';
    return defaultTo || '';
  });
  const [cc, setCc] = useState('');
  const [ccn, setCcn] = useState('');
  const [oggetto, setOggetto] = useState(() => {
    if (mode === 'reply' || mode === 'replyAll') return `Re: ${replyTo?.subject || ''}`;
    if (mode === 'forward') return `I: ${replyTo?.subject || ''}`;
    return '';
  });
  const [files, setFiles] = useState([]);
  const [showCc, setShowCc] = useState(false);
  const [showCcn, setShowCcn] = useState(false);
  const [casella, setCasella] = useState(caselle[0] || 'me');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);
  const [fontSize, setFontSize] = useState('3');

  useEffect(() => {
    if (!editorRef.current) return;
    editorRef.current.innerHTML = buildInitialHtml();
    // Place cursor at top
    try {
      const sel = window.getSelection();
      const range = document.createRange();
      const firstChild = editorRef.current.firstChild || editorRef.current;
      range.setStart(firstChild, 0);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    } catch {}
    editorRef.current.focus();
  }, []); // eslint-disable-line

  function buildInitialHtml() {
    if (mode === 'reply' || mode === 'replyAll') {
      const from = replyTo?.fromEmail ? `<b>Da:</b> ${replyTo.fromEmail}<br>` : '';
      const date = replyTo?.date ? `<b>Data:</b> ${fmt(replyTo.date)}<br>` : '';
      const body = replyTo?.body
        ? replyTo.body
        : replyTo?.bodyPreview ? `<p>${replyTo.bodyPreview}</p>` : '';
      const quote = body
        ? `<blockquote style="border-left:3px solid #d1d5db;margin:8px 0;padding:0 0 0 12px;color:#374151">${body}</blockquote>`
        : '';
      return `<p><br></p><p><br></p><div style="font-size:12px;color:#9ca3af">——— Messaggio originale ———</div><div style="font-size:12px;color:#6b7280">${from}${date}</div>${quote}`;
    }
    if (mode === 'forward') {
      const from = replyTo?.fromEmail ? `<b>Da:</b> ${replyTo.fromEmail}<br>` : '';
      const date = replyTo?.date ? `<b>Data:</b> ${fmt(replyTo.date)}<br>` : '';
      const subj = replyTo?.subject ? `<b>Oggetto:</b> ${replyTo.subject}<br>` : '';
      const body = replyTo?.body
        ? replyTo.body
        : replyTo?.bodyPreview ? `<p>${replyTo.bodyPreview}</p>` : '';
      return `<p><br></p><p><br></p><hr style="border:none;border-top:1px solid #e5e7eb;margin:8px 0"><div style="font-size:12px;color:#6b7280">---------- Messaggio inoltrato ----------<br>${from}${date}${subj}</div><br>${body}`;
    }
    return '<p><br></p>';
  }

  function format(cmd) {
    editorRef.current?.focus();
    document.execCommand(cmd, false, null);
  }

  function setSize(val) {
    setFontSize(val);
    editorRef.current?.focus();
    document.execCommand('fontSize', false, val);
  }

  async function handleInvia() {
    const html = editorRef.current?.innerHTML || '';
    if (mode !== 'replyAll' && !a.trim()) return;
    if (!oggetto.trim()) return;
    setSending(true); setError(null);
    try {
      const token = await getToken();
      if (mode === 'reply') {
        await emailApi.rispondi(token, replyTo.messageId, { html, cc, ccn, mailbox: casella, files });
      } else if (mode === 'replyAll') {
        await emailApi.rispondiATutti(token, replyTo.messageId, { html, cc, ccn, mailbox: casella, files });
      } else if (mode === 'forward') {
        await emailApi.inoltra(token, replyTo.messageId, { a, html, cc, ccn, mailbox: casella, files });
      } else {
        await emailApi.invia(token, { a, cc, ccn, oggetto, html, mailbox: casella, clienteId, files });
      }
      onSent?.({ tipo: 'email_inviata', data: new Date().toISOString(), titolo: oggetto, casella });
      onClose();
    } catch (e) { setError(e.message); } finally { setSending(false); }
  }

  function addFiles(fileList) {
    setFiles(prev => [...prev, ...Array.from(fileList)]);
  }

  const modeLabel = {
    reply:    '↩ Risposta',
    replyAll: '↩↩ Risposta a tutti',
    forward:  '→ Inoltra',
    new:      '✉ Nuova Email',
  }[mode] || '✉ Nuova Email';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
      <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full max-w-2xl mx-0 sm:mx-4 flex flex-col max-h-[95vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b bg-gray-50 rounded-t-2xl sm:rounded-t-xl shrink-0">
          <h2 className="text-sm font-semibold text-gray-800 truncate">{modeLabel}{replyTo?.subject ? `: "${replyTo.subject}"` : ''}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none ml-3 shrink-0">&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">
          {/* Intestazioni */}
          <div className="divide-y divide-gray-100 text-sm border-b shrink-0">

            {/* Da */}
            <div className="flex items-center px-4 py-2 gap-3">
              <span className="w-14 text-right text-xs font-medium text-gray-400 shrink-0">Da</span>
              {caselle.length > 1 ? (
                <select value={casella} onChange={e => setCasella(e.target.value)}
                  className="flex-1 bg-transparent focus:outline-none text-sm text-gray-700 cursor-pointer">
                  {caselle.map(c => <option key={c} value={c}>{c === 'me' ? 'Casella principale' : c}</option>)}
                </select>
              ) : (
                <span className="text-gray-500 text-xs flex-1">{caselle[0] === 'me' ? 'Casella principale' : caselle[0]}</span>
              )}
            </div>

            {/* A */}
            <div className="flex items-center px-4 py-2 gap-3">
              <span className="w-14 text-right text-xs font-medium text-gray-400 shrink-0">A</span>
              {mode === 'replyAll' ? (
                <span className="flex-1 text-sm text-gray-400 italic">Tutti i destinatari del messaggio originale</span>
              ) : (
                <input
                  type="text"
                  value={a}
                  onChange={e => setA(e.target.value)}
                  placeholder="destinatario@email.it"
                  className="flex-1 bg-transparent focus:outline-none text-sm text-gray-800 min-w-0"
                />
              )}
              <div className="flex gap-1 shrink-0">
                {!showCc && <button type="button" onClick={() => setShowCc(true)} className="text-[11px] text-brand-600 hover:text-brand-800 border border-brand-200 hover:bg-brand-50 rounded px-1.5 py-0.5 font-medium transition">+CC</button>}
                {!showCcn && <button type="button" onClick={() => setShowCcn(true)} className="text-[11px] text-gray-500 hover:text-gray-700 border border-gray-200 hover:bg-gray-50 rounded px-1.5 py-0.5 font-medium transition">+CCN</button>}
              </div>
            </div>

            {showCc && (
              <div className="flex items-center px-4 py-2 gap-3">
                <span className="w-14 text-right text-xs font-medium text-gray-400 shrink-0">CC</span>
                <input type="text" value={cc} onChange={e => setCc(e.target.value)} placeholder="cc@email.it" autoFocus
                  className="flex-1 bg-transparent focus:outline-none text-sm text-gray-800 min-w-0" />
                <button type="button" onClick={() => { setShowCc(false); setCc(''); }} className="text-gray-300 hover:text-gray-500 text-sm shrink-0">✕</button>
              </div>
            )}

            {showCcn && (
              <div className="flex items-center px-4 py-2 gap-3">
                <span className="w-14 text-right text-xs font-medium text-gray-400 shrink-0">CCN</span>
                <input type="text" value={ccn} onChange={e => setCcn(e.target.value)} placeholder="ccn@email.it" autoFocus={!showCc}
                  className="flex-1 bg-transparent focus:outline-none text-sm text-gray-800 min-w-0" />
                <button type="button" onClick={() => { setShowCcn(false); setCcn(''); }} className="text-gray-300 hover:text-gray-500 text-sm shrink-0">✕</button>
              </div>
            )}

            {/* Oggetto */}
            <div className="flex items-center px-4 py-2 gap-3">
              <span className="w-14 text-right text-xs font-medium text-gray-400 shrink-0">Oggetto</span>
              <input type="text" value={oggetto} onChange={e => setOggetto(e.target.value)} placeholder="Oggetto del messaggio"
                className="flex-1 bg-transparent focus:outline-none text-sm font-medium text-gray-800 min-w-0" />
            </div>
          </div>

          {/* Toolbar formattazione */}
          <div className="flex items-center gap-0.5 px-3 py-1.5 border-b bg-gray-50 shrink-0 flex-wrap">
            {TOOLBAR.map((item, i) => <ToolbarBtn key={i} item={item} onFormat={format} />)}
            <span className="w-px h-5 bg-gray-200 mx-0.5 inline-block" />
            <select
              value={fontSize}
              onChange={e => setSize(e.target.value)}
              className="text-xs border border-gray-200 rounded px-1 py-0.5 bg-white text-gray-600 focus:outline-none"
            >
              <option value="1">Piccolo</option>
              <option value="3">Normale</option>
              <option value="5">Grande</option>
              <option value="7">Molto grande</option>
            </select>
          </div>

          {/* Editor area */}
          <div className="flex-1 min-h-[180px] relative">
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              className="w-full h-full min-h-[180px] px-5 py-3 focus:outline-none text-sm text-gray-800 leading-relaxed overflow-y-auto"
              style={{ maxHeight: '340px' }}
            />
          </div>

          {/* Allegati */}
          <div className="px-5 pb-3 shrink-0">
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
              className={`border-2 border-dashed rounded-xl px-4 py-2.5 text-xs text-center transition cursor-default
                ${dragOver ? 'border-brand-400 bg-brand-50 text-brand-600' : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}
            >
              📎 Trascina allegati oppure{' '}
              <button type="button" onClick={() => fileRef.current?.click()} className="text-brand-600 hover:underline font-medium">sfoglia</button>
              <input type="file" multiple ref={fileRef} className="hidden" onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />
            </div>
            {files.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {files.map((f, i) => (
                  <span key={i} className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-full">
                    📄 {f.name} <span className="text-blue-400">({formatBytes(f.size)})</span>
                    <button type="button" onClick={() => setFiles(p => p.filter((_, j) => j !== i))} className="text-blue-400 hover:text-blue-700 font-bold ml-0.5">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t flex items-center justify-between bg-gray-50 rounded-b-xl shrink-0">
          <p className="text-xs">
            {error ? <span className="text-red-500">{error}</span> : files.length > 0 ? <span className="text-gray-400">{files.length} allegato/i</span> : ''}
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={onClose} disabled={sending}>Annulla</Button>
            <Button size="sm" onClick={handleInvia} disabled={(mode !== 'replyAll' && !a.trim()) || !oggetto.trim() || sending}>
              {sending ? 'Invio in corso...' : '✉ Invia'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
