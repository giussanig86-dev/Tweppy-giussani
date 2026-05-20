import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../auth/useAuth';
import { anagraficaApi } from '../../api/anagrafica';
import { emailApi } from '../../api/email';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import EmailNote from './EmailNote';

function fmt(d) {
  if (!d) return '';
  return new Date(d).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function StatioBadge({ stato }) {
  const cls = stato === 'completato' ? 'bg-green-100 text-green-700'
    : stato === 'in_lavorazione' ? 'bg-blue-100 text-blue-700'
    : 'bg-gray-100 text-gray-600';
  return <span className={`text-xs px-1.5 py-0.5 rounded ${cls}`}>{stato}</span>;
}

const FILE_ICONS = {
  'application/pdf': { icon: '📄', color: 'text-red-600', bg: 'bg-red-50' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: '📝', color: 'text-blue-600', bg: 'bg-blue-50' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { icon: '📊', color: 'text-green-600', bg: 'bg-green-50' },
  'application/vnd.ms-excel': { icon: '📊', color: 'text-green-600', bg: 'bg-green-50' },
  'application/zip': { icon: '📦', color: 'text-yellow-600', bg: 'bg-yellow-50' },
};

function formatBytes(n) {
  if (!n) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function AllegatiPreview({ allegati, messageId, casella }) {
  const { getToken } = useAuth();
  const [viewer, setViewer] = useState(null);
  const [loadingAtt, setLoadingAtt] = useState(null);

  async function openViewer(att) {
    const key = att.id || att.name;
    setLoadingAtt(key);
    try {
      const token = await getToken();
      const blob = await emailApi.streamAllegato(token, messageId, att.id, att.name, att.contentType, casella);
      setViewer({ att, blobUrl: URL.createObjectURL(blob) });
    } finally { setLoadingAtt(null); }
  }

  function closeViewer() {
    if (viewer?.blobUrl) URL.revokeObjectURL(viewer.blobUrl);
    setViewer(null);
  }

  if (!allegati?.length) return null;

  return (
    <>
      <div className="mt-2 pt-2 border-t flex flex-wrap gap-2">
        {allegati.map((att, i) => {
          const isImg = att.contentType?.startsWith('image/');
          const isPdf = att.contentType === 'application/pdf';
          const canPreview = isImg || isPdf;
          const cfg = FILE_ICONS[att.contentType] || { icon: '📎', color: 'text-gray-500', bg: 'bg-gray-50' };
          const loading = loadingAtt === (att.id || att.name);

          return (
            <button
              key={i}
              onClick={() => canPreview ? openViewer(att) : undefined}
              disabled={loading}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 ${cfg.bg} hover:shadow-sm transition text-left ${canPreview ? 'cursor-pointer' : 'cursor-default opacity-70'}`}
            >
              {loading
                ? <span className="text-lg">⏳</span>
                : <span className="text-xl">{isImg ? '🖼' : cfg.icon}</span>
              }
              <div>
                <p className={`text-xs font-medium ${cfg.color} truncate max-w-[130px]`}>{att.name}</p>
                <p className="text-[10px] text-gray-400">
                  {formatBytes(att.size)} · {canPreview ? (loading ? 'caricamento...' : 'clicca per visualizzare') : 'formato non supportato'}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {viewer && (
        <div className="fixed inset-0 bg-black/85 z-50 flex flex-col" onClick={closeViewer}>
          <div className="flex items-center justify-between px-5 py-3 shrink-0" onClick={e => e.stopPropagation()}>
            <p className="text-white font-medium text-sm truncate">{viewer.att.name}</p>
            <div className="flex gap-2">
              <button
                onClick={() => { const a = document.createElement('a'); a.href = viewer.blobUrl; a.download = viewer.att.name; a.click(); }}
                className="text-white text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition font-medium"
              >
                ⬇ Scarica
              </button>
              <button onClick={closeViewer} className="text-white text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition font-medium">
                ✕ Chiudi
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden p-4" onClick={e => e.stopPropagation()}>
            {viewer.att.contentType?.startsWith('image/') ? (
              <img
                src={viewer.blobUrl}
                alt={viewer.att.name}
                className="max-w-full max-h-full mx-auto object-contain rounded-lg shadow-2xl block"
                style={{ maxHeight: 'calc(100vh - 100px)' }}
              />
            ) : (
              <iframe
                src={viewer.blobUrl}
                title={viewer.att.name}
                className="w-full rounded-lg bg-white shadow-2xl"
                style={{ height: 'calc(100vh - 100px)' }}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default function ComunicazioniPage() {
  const { getToken } = useAuth();
  const [clienti, setClienti] = useState([]);
  const [caselle, setCaselle] = useState(['me']);
  const [clienteSelezionato, setClienteSelezionato] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [spUrl, setSpUrl] = useState(null);

  // Sconosciuti
  const [sconosciuti, setSconosciuti] = useState([]);
  const [showSconosciuti, setShowSconosciuti] = useState(false);
  const [assegnaModal, setAssegnaModal] = useState(null);
  const [assegnaClienteId, setAssegnaClienteId] = useState('');
  const [assegnando, setAssegnando] = useState(false);

  // Chat state
  const [expandedId, setExpandedId] = useState(null);
  const [corpi, setCorpi] = useState({});
  const [allegatiMap, setAllegatiMap] = useState({});
  const [loadingMsg, setLoadingMsg] = useState(null);

  // Reply state
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [casellaMittente, setCasellaMittente] = useState('me');
  const [sending, setSending] = useState(false);
  const [replyFiles, setReplyFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Task da mail
  const [taskModal, setTaskModal] = useState(null);
  const [taskForm, setTaskForm] = useState({ assegnato: '', priorita: 'media' });
  const [savingTask, setSavingTask] = useState(false);

  const bottomRef = useRef(null);

  useEffect(() => {
    getToken().then(async t => {
      const [cl, ca, sc] = await Promise.all([
        anagraficaApi.list(t).catch(() => []),
        emailApi.caselle(t).catch(() => ['me']),
        emailApi.sconosciuti(t).catch(() => []),
      ]);
      setClienti(cl.filter(c => c.stato !== 'eliminato'));
      setCaselle(ca);
      setCasellaMittente(ca[0] || 'me');
      setSconosciuti(sc);
    });
  }, []);

  async function loadStorico(cliente) {
    if (!cliente) return;
    setLoading(true); setError(null); setTimeline([]); setExpandedId(null); setReplyTo(null); setSpUrl(null); setReplyFiles([]);
    try {
      const token = await getToken();
      const [data, sp] = await Promise.all([
        emailApi.storico(token, cliente.id),
        emailApi.sharepointUrl(token, cliente.id).catch(() => ({ url: null })),
      ]);
      setTimeline(data.timeline || []);
      setSpUrl(sp.url || null);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }

  async function handleScansiona() {
    setScanning(true); setScanResult(null);
    try {
      const token = await getToken();
      const res = await emailApi.scansiona(token, 24);
      setScanResult(res);
      if (clienteSelezionato) loadStorico(clienteSelezionato);
    } catch (e) { setError(e.message); } finally { setScanning(false); }
  }

  async function toggleExpand(item) {
    if (!item.messageId) return;
    if (expandedId === item.messageId) { setExpandedId(null); return; }
    setExpandedId(item.messageId);
    if (!corpi[item.messageId]) {
      setLoadingMsg(item.messageId);
      try {
        const token = await getToken();
        const [msg, atts] = await Promise.all([
          emailApi.getMessage(token, item.messageId, item.casella),
          emailApi.allegati(token, item.messageId, item.casella).catch(() => []),
        ]);
        setCorpi(prev => ({ ...prev, [item.messageId]: msg.body?.content || msg.body || '' }));
        setAllegatiMap(prev => ({ ...prev, [item.messageId]: atts }));
      } catch {} finally { setLoadingMsg(null); }
    }
  }

  async function handleRispondi() {
    if (!replyTo || !replyText.trim()) return;
    setSending(true);
    try {
      const token = await getToken();
      await emailApi.rispondi(token, replyTo.messageId, replyText, casellaMittente, replyFiles);
      setTimeline(prev => [{
        tipo: 'email_inviata',
        data: new Date().toISOString(),
        titolo: `Re: ${replyTo.subject}`,
        email: clienteSelezionato?.email || '',
        casella: casellaMittente,
      }, ...prev]);
      setReplyTo(null); setReplyText(''); setReplyFiles([]);
    } catch (e) { setError(e.message); } finally { setSending(false); }
  }

  async function handleSalvaTask() {
    if (!taskModal) return;
    setSavingTask(true);
    try {
      const token = await getToken();
      await emailApi.taskDaMail(token, {
        messageId: taskModal.messageId,
        mailbox: taskModal.casella,
        clienteId: clienteSelezionato.id,
        clienteNome: clienteSelezionato.ragioneSociale,
        titolo: taskModal.titolo,
        assegnato: taskForm.assegnato,
        priorita: taskForm.priorita,
      });
      setTaskModal(null);
    } catch (e) { setError(e.message); } finally { setSavingTask(false); }
  }

  async function handleAssegna() {
    if (!assegnaModal || !assegnaClienteId) return;
    setAssegnando(true);
    try {
      const token = await getToken();
      const cliente = clienti.find(c => c.id === assegnaClienteId);
      await emailApi.taskDaMail(token, {
        messageId: assegnaModal.messageId,
        mailbox: assegnaModal.casella || 'me',
        clienteId: assegnaClienteId,
        clienteNome: cliente?.ragioneSociale || '',
        titolo: `Email: ${assegnaModal.oggetto}`,
        assegnato: '', priorita: 'media',
      });
      setSconosciuti(prev => prev.filter(e => e.messageId !== assegnaModal.messageId));
      setAssegnaModal(null);
    } catch (e) { setError(e.message); } finally { setAssegnando(false); }
  }

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden gap-0">

      {/* ── Pannello sinistro: lista clienti ─────────────────────────────── */}
      <div className="w-64 shrink-0 border-r bg-gray-50 flex flex-col">
        <div className="p-3 border-b">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Comunicazioni</p>
          <input
            type="text"
            placeholder="Cerca cliente..."
            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {clienti.map(c => (
            <button
              key={c.id}
              onClick={() => { setClienteSelezionato(c); loadStorico(c); }}
              className={`w-full text-left px-4 py-3 text-sm border-b transition ${
                clienteSelezionato?.id === c.id
                  ? 'bg-brand-50 text-brand-800 font-medium border-l-2 border-l-brand-500'
                  : 'text-gray-700 hover:bg-white'
              }`}
            >
              <div className="font-medium truncate">{c.ragioneSociale}</div>
              {c.email && <div className="text-xs text-gray-400 truncate">{c.email}</div>}
            </button>
          ))}
        </div>

        {/* Sezione email da sconosciuti */}
        <div className="border-t">
          <button
            onClick={() => setShowSconosciuti(p => !p)}
            className="w-full text-left px-4 py-2 text-xs font-medium text-gray-500 flex items-center justify-between hover:bg-gray-100 transition"
          >
            <span>📭 Da sconosciuti ({sconosciuti.length})</span>
            <span>{showSconosciuti ? '▲' : '▼'}</span>
          </button>
          {showSconosciuti && (
            <div className="max-h-48 overflow-y-auto">
              {sconosciuti.length === 0 && (
                <p className="text-xs text-gray-400 px-4 py-2">Nessuna email da sconosciuti</p>
              )}
              {sconosciuti.map((e, i) => (
                <div key={i} className="px-4 py-2 text-xs border-b bg-amber-50 hover:bg-amber-100 transition">
                  <p className="font-medium text-gray-700 truncate">{e.mittente}</p>
                  <p className="text-gray-500 truncate">{e.oggetto}</p>
                  <button
                    onClick={() => { setAssegnaModal(e); setAssegnaClienteId(''); }}
                    className="text-brand-600 hover:underline mt-0.5"
                  >
                    Assegna a cliente
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-3 border-t">
          <Button size="sm" variant="secondary" className="w-full" onClick={handleScansiona} disabled={scanning}>
            {scanning ? 'Scansione...' : '🔄 Scansiona inbox'}
          </Button>
          {scanResult && (
            <p className="text-xs text-green-600 text-center mt-1">{scanResult.elaborati} email elaborate</p>
          )}
        </div>
      </div>

      {/* ── Pannello destro: chat ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <div className="px-5 py-3 border-b bg-white flex items-center justify-between shrink-0">
          {clienteSelezionato ? (
            <div className="flex items-center gap-3">
              <div>
                <p className="font-semibold text-gray-800">{clienteSelezionato.ragioneSociale}</p>
                {clienteSelezionato.email && <p className="text-xs text-gray-400">{clienteSelezionato.email}</p>}
              </div>
              {spUrl && (
                <button
                  onClick={() => window.open(spUrl, '_blank')}
                  title="Apri cartella SharePoint"
                  className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-lg flex items-center gap-1 transition shrink-0"
                >
                  📁 Cartella
                </button>
              )}
            </div>
          ) : (
            <p className="text-gray-400">Seleziona un cliente dalla lista</p>
          )}
          {caselle.length > 1 && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Caselle:</span>
              {caselle.map(c => (
                <span key={c} className="bg-gray-100 px-2 py-0.5 rounded">{c === 'me' ? '(principale)' : c}</span>
              ))}
            </div>
          )}
        </div>

        {/* Messaggi */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {!clienteSelezionato && (
            <p className="text-center text-gray-300 text-lg mt-20">
              Seleziona un cliente per vedere la conversazione
            </p>
          )}

          {loading && <p className="text-center text-gray-500 mt-10">Caricamento...</p>}
          {error && <p className="text-center text-red-500 mt-4">{error}</p>}

          {!loading && clienteSelezionato && timeline.length === 0 && (
            <p className="text-center text-gray-400 mt-20">Nessuna comunicazione registrata.</p>
          )}

          {[...timeline].reverse().map((item, i) => {
            if (item.tipo === 'task' || item.tipo === 'documento') {
              return (
                <div key={i} className="flex justify-center">
                  <div className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full flex items-center gap-1.5">
                    <span>{item.tipo === 'task' ? '✅' : '📄'}</span>
                    <span>{item.titolo}</span>
                    {item.stato && <StatioBadge stato={item.stato} />}
                    <span className="ml-1 opacity-60">{fmt(item.data)}</span>
                  </div>
                </div>
              );
            }

            const isRicevuta = item.tipo === 'email_ricevuta';
            const isExpanded = expandedId === item.messageId;

            return (
              <div key={i} className={`flex ${isRicevuta ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[75%] ${isRicevuta ? '' : 'items-end flex flex-col'}`}>
                  {item.casella && item.casella !== 'me' && (
                    <span className="text-xs text-gray-400 mb-0.5 px-1">📬 {item.casella}</span>
                  )}

                  <div
                    onClick={() => isRicevuta && toggleExpand(item)}
                    className={`rounded-2xl px-4 py-2.5 shadow-sm text-sm ${
                      isRicevuta
                        ? 'bg-white border border-gray-200 rounded-tl-sm cursor-pointer hover:shadow-md transition-shadow'
                        : 'bg-brand-600 text-white rounded-tr-sm'
                    }`}
                  >
                    <p className={`font-medium text-sm ${isRicevuta ? 'text-gray-800' : 'text-white'}`}>
                      {item.titolo}
                    </p>

                    {isRicevuta && item.preview && !isExpanded && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.preview}</p>
                    )}

                    {isRicevuta && isExpanded && (
                      <div className="mt-2 border-t pt-2">
                        {loadingMsg === item.messageId ? (
                          <p className="text-xs text-gray-400">Caricamento...</p>
                        ) : (
                          <div
                            className="text-xs text-gray-700 max-h-48 overflow-y-auto prose prose-sm"
                            dangerouslySetInnerHTML={{ __html: corpi[item.messageId] || item.preview }}
                          />
                        )}
                        <AllegatiPreview
                          allegati={allegatiMap[item.messageId]}
                          messageId={item.messageId}
                          casella={item.casella}
                        />
                        <EmailNote messageId={item.messageId} />
                        <div className="flex gap-2 mt-2 pt-2 border-t">
                          <button
                            onClick={(e) => { e.stopPropagation(); setReplyTo({ messageId: item.messageId, subject: item.titolo, casella: item.casella }); setReplyText(''); setReplyFiles([]); }}
                            className="text-xs bg-brand-50 text-brand-700 hover:bg-brand-100 px-2 py-1 rounded font-medium transition"
                          >
                            ↩ Rispondi
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setTaskModal({ messageId: item.messageId, casella: item.casella, titolo: item.titolo }); setTaskForm({ assegnato: '', priorita: 'media' }); }}
                            className="text-xs bg-green-50 text-green-700 hover:bg-green-100 px-2 py-1 rounded font-medium transition"
                          >
                            ✅ Crea Task
                          </button>
                        </div>
                      </div>
                    )}

                    {isRicevuta && (
                      <p className="text-xs text-gray-400 mt-1">{fmt(item.data)}</p>
                    )}
                  </div>

                  {!isRicevuta && (
                    <p className="text-xs text-gray-400 mt-0.5 text-right">{fmt(item.data)}</p>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Reply box */}
        {clienteSelezionato && (
          <div className="border-t bg-white px-4 py-3 shrink-0">
            {replyTo && (
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">
                  ↩ <span className="font-medium">In risposta a:</span> {replyTo.subject}
                </p>
                <button onClick={() => { setReplyTo(null); setReplyFiles([]); }} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
              </div>
            )}
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <textarea
                  rows={replyTo ? 3 : 2}
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder={replyTo ? 'Scrivi la tua risposta...' : 'Seleziona una email ricevuta e clicca "Rispondi"'}
                  disabled={!replyTo}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-gray-50 disabled:text-gray-400"
                />
                {replyTo && (
                  <>
                    <div
                      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={e => { e.preventDefault(); setDragOver(false); setReplyFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]); }}
                      className={`mt-1 border-2 border-dashed rounded-lg px-3 py-1.5 text-xs text-center transition cursor-default ${dragOver ? 'border-brand-400 bg-brand-50 text-brand-600' : 'border-gray-200 text-gray-400'}`}
                    >
                      Trascina allegati qui o{' '}
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="text-brand-600 hover:underline">
                        sfoglia
                      </button>
                      <input
                        type="file"
                        multiple
                        ref={fileInputRef}
                        className="hidden"
                        onChange={e => { setReplyFiles(prev => [...prev, ...Array.from(e.target.files)]); e.target.value = ''; }}
                      />
                    </div>
                    {replyFiles.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {replyFiles.map((f, i) => (
                          <span key={i} className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                            📎 {f.name} ({formatBytes(f.size)})
                            <button
                              type="button"
                              onClick={() => setReplyFiles(prev => prev.filter((_, j) => j !== i))}
                              className="text-blue-400 hover:text-blue-600 ml-0.5 font-bold leading-none"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="flex flex-col gap-2 items-end shrink-0">
                {caselle.length > 1 && replyTo && (
                  <select
                    value={casellaMittente}
                    onChange={e => setCasellaMittente(e.target.value)}
                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs bg-white"
                  >
                    {caselle.map(c => <option key={c} value={c}>{c === 'me' ? 'Casella principale' : c}</option>)}
                  </select>
                )}
                <Button
                  onClick={handleRispondi}
                  disabled={!replyTo || !replyText.trim() || sending}
                  size="sm"
                >
                  {sending ? 'Invio...' : 'Invia'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Crea Task */}
      <Modal open={!!taskModal} onClose={() => setTaskModal(null)} title="Crea Task da Email">
        {taskModal && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Titolo task</label>
              <input
                type="text"
                value={taskModal.titolo}
                onChange={e => setTaskModal(p => ({ ...p, titolo: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Cliente</label>
              <p className="text-sm font-medium text-gray-800 px-3 py-2 bg-gray-50 rounded-lg">{clienteSelezionato?.ragioneSociale}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Assegnato a</label>
                <input
                  type="text"
                  value={taskForm.assegnato}
                  onChange={e => setTaskForm(p => ({ ...p, assegnato: e.target.value }))}
                  placeholder="es. Laura"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Priorità</label>
                <select
                  value={taskForm.priorita}
                  onChange={e => setTaskForm(p => ({ ...p, priorita: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="bassa">Bassa</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setTaskModal(null)}>Annulla</Button>
              <Button onClick={handleSalvaTask} disabled={savingTask}>
                {savingTask ? 'Salvataggio...' : 'Crea Task'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Assegna Email Sconosciuta */}
      <Modal open={!!assegnaModal} onClose={() => setAssegnaModal(null)} title="Assegna Email a Cliente">
        {assegnaModal && (
          <div className="space-y-4">
            <div className="bg-amber-50 rounded-lg p-3 text-sm">
              <p><span className="text-gray-500">Da:</span> <strong>{assegnaModal.mittente}</strong></p>
              <p className="mt-1 text-gray-600 truncate">{assegnaModal.oggetto}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Assegna a cliente</label>
              <select
                value={assegnaClienteId}
                onChange={e => setAssegnaClienteId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">— seleziona cliente —</option>
                {clienti.map(c => <option key={c.id} value={c.id}>{c.ragioneSociale}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setAssegnaModal(null)}>Annulla</Button>
              <Button onClick={handleAssegna} disabled={!assegnaClienteId || assegnando}>
                {assegnando ? 'Salvataggio...' : 'Crea Task'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
