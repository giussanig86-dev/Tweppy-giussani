import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/useAuth';
import { anagraficaApi } from '../../api/anagrafica';
import { checklistApi } from '../../api/checklist';
import ChecklistTable from './ChecklistTable';
import VistaScadenzario from './VistaScadenzario';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';

const ANNO_CORRENTE = new Date().getFullYear();
const ANNI = [ANNO_CORRENTE + 1, ANNO_CORRENTE, ANNO_CORRENTE - 1];

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-xl border p-4">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

function VistaCliente() {
  const { getToken } = useAuth();
  const [clienti, setClienti] = useState([]);
  const [clienteId, setClienteId] = useState('');
  const [anno, setAnno] = useState(ANNO_CORRENTE);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getToken().then(t => anagraficaApi.list(t).then(data => {
      setClienti(data.filter(c => c.stato !== 'cessato'));
    }).catch(() => {}));
  }, []);

  async function loadChecklist(cId, a) {
    if (!cId) return;
    setLoading(true); setError(null);
    try {
      const token = await getToken();
      setItems(await checklistApi.get(token, cId, a));
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }

  async function handleGenera() {
    const cliente = clienti.find(c => c.id === clienteId);
    if (!cliente) return;
    setGenerating(true); setError(null);
    try {
      const token = await getToken();
      setItems(await checklistApi.genera(token, cliente, anno));
    } catch (e) { setError(e.message); } finally { setGenerating(false); }
  }

  async function handleStatoChange(id, stato, note) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, stato } : i));
    const token = await getToken();
    await checklistApi.updateStato(token, id, stato, note);
  }

  const tot = items.length;
  const fatti = items.filter(i => i.stato === 'fatto').length;
  const comunicati = items.filter(i => i.stato === 'comunicato').length;
  const daFare = items.filter(i => i.stato === 'da_fare').length;

  const clienteSel = clienti.find(c => c.id === clienteId);
  const isCessazione = clienteSel?.stato === 'in_cessazione';

  return (
    <div>
      <div className="flex gap-4 mb-6 items-end flex-wrap">
        <div className="flex-1 min-w-48 max-w-xs">
          <label className="block text-xs font-medium text-gray-600 mb-1">Cliente</label>
          <select
            value={clienteId}
            onChange={e => { setClienteId(e.target.value); setItems([]); if (e.target.value) loadChecklist(e.target.value, anno); }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">— seleziona cliente —</option>
            {clienti.map(c => (
              <option key={c.id} value={c.id}>
                {c.ragioneSociale}{c.stato === 'in_cessazione' ? ' ⚠' : ''}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Anno</label>
          <select
            value={anno}
            onChange={e => { const a = parseInt(e.target.value); setAnno(a); setItems([]); if (clienteId) loadChecklist(clienteId, a); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {ANNI.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <Button onClick={handleGenera} disabled={!clienteId || generating}>
          {generating ? 'Generazione...' : items.length > 0 ? 'Rigenera Checklist' : 'Genera Checklist'}
        </Button>
      </div>

      {isCessazione && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
          ⚠ Questo cliente è in fase di cessazione.
        </div>
      )}
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {tot > 0 && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard label="Totale adempimenti" value={tot} color="text-gray-800" />
          <StatCard label="Fatti" value={fatti} color="text-green-600" />
          <StatCard label="Comunicati" value={comunicati} color="text-blue-600" />
          <StatCard label="Da fare" value={daFare} color={daFare > 0 ? 'text-gray-600' : 'text-gray-400'} />
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Caricamento...</p>
      ) : items.length > 0 ? (
        <ChecklistTable items={items} onStatoChange={handleStatoChange} />
      ) : clienteId ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg mb-2">Nessuna checklist per questo cliente e anno.</p>
          <p className="text-sm">Clicca "Genera Checklist" per crearla automaticamente in base al profilo del cliente.</p>
        </div>
      ) : (
        <div className="text-center py-16 text-gray-300">
          <p className="text-lg">Seleziona un cliente per visualizzare o generare la checklist.</p>
        </div>
      )}
    </div>
  );
}

export default function ChecklistPage() {
  const [tab, setTab] = useState('scadenzario');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Adempimenti &amp; Scadenze Fiscali</h1>
        <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
          {[
            { key: 'scadenzario', label: '📅 Scadenzario' },
            { key: 'cliente', label: '👤 Per Cliente' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                tab === t.key ? 'bg-white shadow text-brand-700' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'scadenzario' && <VistaScadenzario />}
      {tab === 'cliente' && <VistaCliente />}
    </div>
  );
}
