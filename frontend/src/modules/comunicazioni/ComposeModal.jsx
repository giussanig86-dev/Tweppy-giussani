import { useState, useRef } from 'react';
import { useAuth } from '../../auth/useAuth';
import { emailApi } from '../../api/email';
import Button from '../../components/ui/Button';

function formatBytes(b) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ComposeModal({ mode = 'new', replyTo, defaultTo, caselle = ['me'], clienteId, onClose, onSent }) {
  const { getToken } = useAuth();
  const [a, setA] = useState(mode === 'reply' ? (replyTo?.fromEmail || '') : (defaultTo || ''));
  const [cc, setCc] = useState('');
  const [ccn, setCcn] = useState('');
  const [oggetto, setOggetto] = useState(mode === 'reply' ? `Re: ${replyTo?.subject || ''}` : '');
  const [testo, setTesto] = useState('');
  const [files, setFiles] = useState([]);
  const [showCc, setShowCc] = useState(false);
  const [showCcn, setShowCcn] = useState(false);
  const [casella, setCasella] = useState(caselle[0] || 'me');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  async function handleInvia() {
    if (!a.trim() || !oggetto.trim()) return;
    setSending(true); setError(null);
    try {
      const token = await getToken();
      if (mode === 'reply' && replyTo?.messageId) {
        await emailApi.rispondi(token, replyTo.messageId, { testo, cc, ccn, mailbox: casella, files });
      } else {
        await emailApi.invia(token, { a, cc, ccn, oggetto, testo, mailbox: casella, clienteId, files });
      }
      onSent?.({ tipo: 'email_inviata', data: new Date().toISOString(), titolo: oggetto, casella });
      onClose();
    } catch (e) { setError(e.message); } finally { setSending(false); }
  }

  function addFiles(fileList) {
    setFiles(prev => [...prev, ...Array.from(fileList)]);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
      <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full max-w-2xl mx-0 sm:mx-4 flex flex-col max-h-[95vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b bg-gray-50 rounded-t-2xl sm:rounded-t-xl shrink-0">
          <h2 className="text-sm font-semibold text-gray-800 truncate">
            {mode === 'reply' ? `↩ Risposta: "${replyTo?.subject || ''}"` : '✉ Nuova Email'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none ml-3 shrink-0">&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {/* Intestazioni */}
          <div className="divide-y divide-gray-100 text-sm border-b">

            {/* Da */}
            <div className="flex items-center px-4 py-2.5 gap-3">
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
            <div className="flex items-center px-4 py-2.5 gap-3">
              <span className="w-14 text-right text-xs font-medium text-gray-400 shrink-0">A</span>
              <input
                type="text"
                value={a}
                onChange={e => setA(e.target.value)}
                readOnly={mode === 'reply'}
                placeholder="destinatario@email.it"
                className={`flex-1 bg-transparent focus:outline-none text-sm text-gray-800 min-w-0
                  ${mode === 'reply' ? 'cursor-default text-gray-500' : ''}`}
              />
              <div className="flex gap-1 shrink-0">
                {!showCc && (
                  <button type="button" onClick={() => { setShowCc(true); }}
                    className="text-[11px] text-brand-600 hover:text-brand-800 border border-brand-200 hover:bg-brand-50 rounded px-1.5 py-0.5 font-medium transition">
                    +CC
                  </button>
                )}
                {!showCcn && (
                  <button type="button" onClick={() => setShowCcn(true)}
                    className="text-[11px] text-gray-500 hover:text-gray-700 border border-gray-200 hover:bg-gray-50 rounded px-1.5 py-0.5 font-medium transition">
                    +CCN
                  </button>
                )}
              </div>
            </div>

            {/* CC */}
            {showCc && (
              <div className="flex items-center px-4 py-2.5 gap-3">
                <span className="w-14 text-right text-xs font-medium text-gray-400 shrink-0">CC</span>
                <input
                  type="text"
                  value={cc}
                  onChange={e => setCc(e.target.value)}
                  placeholder="cc@email.it, altro@email.it"
                  autoFocus
                  className="flex-1 bg-transparent focus:outline-none text-sm text-gray-800 min-w-0"
                />
                <button type="button" onClick={() => { setShowCc(false); setCc(''); }}
                  className="text-gray-300 hover:text-gray-500 text-sm shrink-0">✕</button>
              </div>
            )}

            {/* CCN */}
            {showCcn && (
              <div className="flex items-center px-4 py-2.5 gap-3">
                <span className="w-14 text-right text-xs font-medium text-gray-400 shrink-0">CCN</span>
                <input
                  type="text"
                  value={ccn}
                  onChange={e => setCcn(e.target.value)}
                  placeholder="ccn@email.it, altro@email.it"
                  autoFocus={!showCc}
                  className="flex-1 bg-transparent focus:outline-none text-sm text-gray-800 min-w-0"
                />
                <button type="button" onClick={() => { setShowCcn(false); setCcn(''); }}
                  className="text-gray-300 hover:text-gray-500 text-sm shrink-0">✕</button>
              </div>
            )}

            {/* Oggetto */}
            <div className="flex items-center px-4 py-2.5 gap-3">
              <span className="w-14 text-right text-xs font-medium text-gray-400 shrink-0">Oggetto</span>
              <input
                type="text"
                value={oggetto}
                onChange={e => setOggetto(e.target.value)}
                placeholder="Oggetto del messaggio"
                className="flex-1 bg-transparent focus:outline-none text-sm font-medium text-gray-800 min-w-0"
              />
            </div>
          </div>

          {/* Body */}
          <div className="px-5 py-4">
            <textarea
              value={testo}
              onChange={e => setTesto(e.target.value)}
              placeholder="Scrivi il messaggio..."
              rows={9}
              className="w-full resize-none focus:outline-none text-sm text-gray-800 placeholder-gray-400 leading-relaxed"
            />
            {mode === 'reply' && replyTo?.bodyPreview && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-1.5">—— Messaggio originale ——</p>
                <p className="text-xs text-gray-400 italic whitespace-pre-wrap line-clamp-4 leading-relaxed">
                  {replyTo.bodyPreview}
                </p>
              </div>
            )}
          </div>

          {/* Allegati */}
          <div className="px-5 pb-4">
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
              className={`border-2 border-dashed rounded-xl px-4 py-3 text-xs text-center transition cursor-default
                ${dragOver ? 'border-brand-400 bg-brand-50 text-brand-600' : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}
            >
              📎 Trascina allegati qui oppure{' '}
              <button type="button" onClick={() => fileRef.current?.click()}
                className="text-brand-600 hover:underline font-medium">
                sfoglia
              </button>
              <input type="file" multiple ref={fileRef} className="hidden"
                onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />
            </div>
            {files.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {files.map((f, i) => (
                  <span key={i} className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-full">
                    📄 {f.name} <span className="text-blue-400">({formatBytes(f.size)})</span>
                    <button type="button" onClick={() => setFiles(p => p.filter((_, j) => j !== i))}
                      className="text-blue-400 hover:text-blue-700 font-bold ml-0.5">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t flex items-center justify-between bg-gray-50 rounded-b-xl shrink-0">
          <p className="text-xs text-gray-400">
            {error
              ? <span className="text-red-500">{error}</span>
              : files.length > 0 ? `${files.length} allegato/i` : ''}
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={onClose} disabled={sending}>Annulla</Button>
            <Button size="sm" onClick={handleInvia}
              disabled={!a.trim() || !oggetto.trim() || sending}>
              {sending ? 'Invio in corso...' : '✉ Invia'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
