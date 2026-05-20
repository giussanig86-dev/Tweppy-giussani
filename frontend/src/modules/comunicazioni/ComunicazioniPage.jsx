import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../auth/useAuth';
import { anagraficaApi } from '../../api/anagrafica';
import { emailApi } from '../../api/email';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';

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

function AllegatiPreview({ allegati }) {
  const [lightbox, setLightbox] = useState(null);

  function download(att) {
    const bytes = att.downloadBytes || att.contentBytes;
    if (!bytes) return;
    const blob = b64toBlob(bytes, att.contentType);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = att.name; a.click();
    URL.revokeObjectURL(url);
  }

  function b64toBlob(b64, type) {
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type });
  }

  if (!allegati?.length) return null;

  return (
    <>
      <div className="mt-2 pt-2 border-t flex flex-wrap gap-2">
        {allegati.map((att, i) => {
          const isImg = att.contentType?.startsWith('image/');
          const cfg = FILE_ICONS[att.contentType] || { icon: '📎', color: 'text-gray-500', bg: 'bg-gray-50' };

          if (isImg && att.contentBytes) {
            return (
              <button key={i} onClick={() => setLightbox(att)}
                className="relative rounded-lg overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
                <img
                  src={`data:${att.contentType};base64,${att.contentBytes}`}
                  alt={att.name}
                  className="w-24 h-20 object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-[10px] px-1 py-0.5 truncate">
                  {att.name}
                </div>
              </button>
            );
          }

          return (
            <button key={i} onClick={() => download(att)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 ${cfg.bg} hover:shadow-sm transition-shadow text-left`}>
              <span className="text-lg">{cfg.icon}</span>
              <div>
                <p className={`text-xs font-medium ${cfg.color} truncate max-w-[120px]`}>{att.name}</p>
                <p className="text-[10px] text-gray-400">{formatBytes(att.size)}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Lightbox immagine */}
      {lightbox && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}>
          <div className="relative max-w-3xl max-h-full" onClick={e => e.stopPropagation()}>
            <img
              src={`data:${lightbox.contentType};base64,${lightbox.contentBytes}`}
              alt={lightbox.name}
              className="max-w-full max-h-[80vh] rounded-lg shadow-2xl object-contain"
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-white text-sm">{lightbox.name}</p>
              <div className="flex gap-2">
                <button onClick={() => {
                  const a = document.createElement('a');
                  a.href = `data:${lightbox.contentType};base64,${lightbox.contentBytes}`;
                  a.download = lightbox.name; a.click();
                }} className="text-white text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition">
                  ⬇ Scarica
                </button>
                <button onClick={() => setLightbox(null)}
                  className="text-white text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition">
                  ✕ Chiudi
                </button>
              </div>
            </div>
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

  // Chat state
  const [expandedId, setExpandedId] = useState(null);
  const [corpi, setCorpi] = useState({});        // messageId → body html
  const [allegatiMap, setAllegatiMap] = useState({});  // messageId → allegati[]
  const [loadingMsg, setLoadingMsg] = useState(null);

  // Reply state
  const [replyTo, setReplyTo] = useState(null);  // { messageId, subject, casella }
  const [replyText, setReplyText] = useState('');
  const [casellaMittente, setCasellaMittente] = useState('me');
  const [sending, setSending] = useState(false);

  // Task da mail
  const [taskModal, setTaskModal] = useState(null); // { messageId, casella, titolo }
  const [taskForm, setTaskForm] = useState({ assegnato: '', priorita: 'media' });
  const [savingTask, setSavingTask] = useState(false);

  const bottomRef = useRef(null);

  useEffect(() => {
    getToken().then(async t => {
      const [cl, ca] = await Promise.all([
        anagraficaApi.list(t).catch(() => []),
        emailApi.caselle(t).catch(() => ['me']),
      ]);
      setClienti(cl.filter(c => c.stato !== 'eliminato'));
      setCaselle(ca);
      setCasellaMittente(ca[0] || 'me');
    });
  }, []);

  async function loadStorico(cliente) {
    if (!cliente) return;
    setLoading(true); setError(null); setTimeline([]); setExpandedId(null); setReplyTo(null);
    try {
      const token = await getToken();
      const data = await emailApi.storico(token, cliente.id);
      setTimeline(data.timeline || []);
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
      await emailApi.rispondi(token, replyTo.messageId, replyText, casellaMittente);
      // aggiunge bolla ottimistica
      setTimeline(prev => [{
        tipo: 'email_inviata',
        data: new Date().toISOString(),
        titolo: `Re: ${replyTo.subject}`,
        email: clienteSelezionato?.email || '',
        casella: casellaMittente,
      }, ...prev]);
      setReplyTo(null); setReplyText('');
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

  const cercaCliente = (v) => clienti.filter(c =>
    c.ragioneSociale.toLowerCase().includes(v.toLowerCase())
  );

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
            onChange={e => {
              const v = e.target.value;
              if (!v) return;
            }}
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
            <div>
              <p className="font-semibold text-gray-800">{clienteSelezionato.ragioneSociale}</p>
              {clienteSelezionato.email && <p className="text-xs text-gray-400">{clienteSelezionato.email}</p>}
            </div>
          ) : (
            <p className="text-gray-400">Seleziona un cliente dalla lista</p>
          )}
          {caselle.length > 1 && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Casella monitorata:</span>
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

          {/* Timeline in ordine cronologico ascendente per la chat */}
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
                  {/* Casella badge */}
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

                    {/* Preview */}
                    {isRicevuta && item.preview && !isExpanded && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.preview}</p>
                    )}

                    {/* Corpo espanso */}
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
                        <AllegatiPreview allegati={allegatiMap[item.messageId]} />
                        <div className="flex gap-2 mt-2 pt-2 border-t">
                          <button
                            onClick={(e) => { e.stopPropagation(); setReplyTo({ messageId: item.messageId, subject: item.titolo, casella: item.casella }); setReplyText(''); }}
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
                <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
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
    </div>
  );
}
