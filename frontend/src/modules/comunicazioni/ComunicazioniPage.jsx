import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/useAuth';
import { anagraficaApi } from '../../api/anagrafica';
import { emailApi } from '../../api/email';
import Button from '../../components/ui/Button';

const TIPO_CONFIG = {
  task:           { icon: '✅', label: 'Task', color: 'bg-green-50 border-green-200' },
  documento:      { icon: '📄', label: 'Documento generato', color: 'bg-blue-50 border-blue-200' },
  email_inviata:  { icon: '📤', label: 'Email inviata', color: 'bg-purple-50 border-purple-200' },
  email_ricevuta: { icon: '📧', label: 'Email ricevuta', color: 'bg-yellow-50 border-yellow-200' },
};

function formatData(d) {
  if (!d) return '';
  return new Date(d).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function ComunicazioniPage() {
  const { getToken } = useAuth();
  const [clienti, setClienti] = useState([]);
  const [clienteId, setClienteId] = useState('');
  const [timeline, setTimeline] = useState([]);
  const [clienteNome, setClienteNome] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getToken().then(t => anagraficaApi.list(t).then(setClienti).catch(() => {}));
  }, []);

  async function loadStorico(cId) {
    if (!cId) return;
    setLoading(true); setError(null); setTimeline([]);
    try {
      const token = await getToken();
      const data = await emailApi.storico(token, cId);
      setTimeline(data.timeline || []);
      setClienteNome(data.cliente || '');
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }

  function handleClienteChange(e) {
    setClienteId(e.target.value);
    loadStorico(e.target.value);
  }

  async function handleScansiona() {
    setScanning(true); setScanResult(null); setError(null);
    try {
      const token = await getToken();
      const res = await emailApi.scansiona(token, 24);
      setScanResult(res);
      if (clienteId) loadStorico(clienteId);
    } catch (e) { setError(e.message); } finally { setScanning(false); }
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <h1 className="text-2xl font-bold">Storico Comunicazioni</h1>
        <div className="flex items-center gap-3">
          {scanResult && (
            <span className="text-sm text-green-600 font-medium">
              {scanResult.elaborati} email elaborate
            </span>
          )}
          <Button variant="secondary" onClick={handleScansiona} disabled={scanning}>
            {scanning ? 'Scansione...' : '🔄 Scansiona Inbox (ultime 24h)'}
          </Button>
        </div>
      </div>

      <div className="mb-6 max-w-xs">
        <label className="block text-xs font-medium text-gray-600 mb-1">Cliente</label>
        <select value={clienteId} onChange={handleClienteChange}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500">
          <option value="">— seleziona cliente —</option>
          {clienti.map(c => <option key={c.id} value={c.id}>{c.ragioneSociale}</option>)}
        </select>
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {loading && <p className="text-gray-500">Caricamento storico...</p>}

      {!loading && clienteId && timeline.length === 0 && (
        <p className="text-gray-400 text-center py-12">Nessuna comunicazione registrata per questo cliente.</p>
      )}

      {!loading && !clienteId && (
        <p className="text-gray-300 text-center py-16 text-lg">Seleziona un cliente per visualizzare lo storico.</p>
      )}

      {timeline.length > 0 && (
        <div>
          <p className="text-sm text-gray-500 mb-4">{timeline.length} eventi per <strong>{clienteNome}</strong></p>
          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />
            <div className="space-y-3">
              {timeline.map((item, i) => {
                const cfg = TIPO_CONFIG[item.tipo] || { icon: '•', label: item.tipo, color: 'bg-gray-50 border-gray-200' };
                return (
                  <div key={i} className="flex gap-4 items-start pl-12 relative">
                    <div className="absolute left-3 w-5 h-5 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center text-xs">
                      {cfg.icon}
                    </div>
                    <div className={`flex-1 border rounded-lg p-3 ${cfg.color}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{cfg.label}</span>
                        <span className="text-xs text-gray-400">{formatData(item.data)}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-800 mt-1">{item.titolo}</p>
                      {item.stato && (
                        <span className={`text-xs px-1.5 py-0.5 rounded mt-1 inline-block
                          ${item.stato === 'completato' ? 'bg-green-100 text-green-700' : item.stato === 'in_lavorazione' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                          {item.stato}
                        </span>
                      )}
                      {item.preview && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.preview}</p>}
                      {item.assegnato && <p className="text-xs text-gray-400 mt-0.5">→ {item.assegnato}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
