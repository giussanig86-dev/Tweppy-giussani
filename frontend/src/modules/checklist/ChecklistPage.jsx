import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/useAuth';
import { anagraficaApi } from '../../api/anagrafica';
import { checklistApi } from '../../api/checklist';
import ChecklistTable from './ChecklistTable';
import Button from '../../components/ui/Button';

const ANNO_CORRENTE = new Date().getFullYear();
const ANNI = [ANNO_CORRENTE + 1, ANNO_CORRENTE, ANNO_CORRENTE - 1];

export default function ChecklistPage() {
  const { getToken } = useAuth();
  const [clienti, setClienti] = useState([]);
  const [clienteId, setClienteId] = useState('');
  const [anno, setAnno] = useState(ANNO_CORRENTE);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getToken().then((t) => anagraficaApi.list(t).then(setClienti).catch(() => {}));
  }, []);

  async function loadChecklist(cId, a) {
    if (!cId) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const data = await checklistApi.get(token, cId, a);
      setItems(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleClienteChange(e) {
    setClienteId(e.target.value);
    setItems([]);
    if (e.target.value) loadChecklist(e.target.value, anno);
  }

  function handleAnnoChange(e) {
    const a = parseInt(e.target.value);
    setAnno(a);
    setItems([]);
    if (clienteId) loadChecklist(clienteId, a);
  }

  async function handleGenera() {
    const cliente = clienti.find((c) => c.id === clienteId);
    if (!cliente) return;
    setGenerating(true);
    setError(null);
    try {
      const token = await getToken();
      const data = await checklistApi.genera(token, cliente, anno);
      setItems(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleStatoChange(id, stato, note) {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, stato } : i));
    const token = await getToken();
    await checklistApi.updateStato(token, id, stato, note);
  }

  const tot = items.length;
  const completati = items.filter((i) => i.stato === 'completato').length;
  const inCorso = items.filter((i) => i.stato === 'in_lavorazione').length;
  const scaduti = items.filter((i) => i.stato !== 'completato' && new Date(i.scadenza) < new Date()).length;

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <h1 className="text-2xl font-bold">Checklist Scadenze Fiscali</h1>
      </div>

      {/* Selettori */}
      <div className="flex gap-4 mb-6 items-end">
        <div className="flex-1 max-w-xs">
          <label className="block text-xs font-medium text-gray-600 mb-1">Cliente</label>
          <select
            value={clienteId}
            onChange={handleClienteChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">— seleziona cliente —</option>
            {clienti.map((c) => <option key={c.id} value={c.id}>{c.ragioneSociale}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Anno</label>
          <select
            value={anno}
            onChange={handleAnnoChange}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {ANNI.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <Button onClick={handleGenera} disabled={!clienteId || generating}>
          {generating ? 'Generazione...' : items.length > 0 ? 'Rigenera Checklist' : 'Genera Checklist'}
        </Button>
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {/* Stats */}
      {tot > 0 && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Totale adempimenti', value: tot, color: 'text-gray-800' },
            { label: 'Completati', value: completati, color: 'text-green-600' },
            { label: 'In lavorazione', value: inCorso, color: 'text-blue-600' },
            { label: 'Scaduti', value: scaduti, color: scaduti > 0 ? 'text-red-600' : 'text-gray-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border p-4">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Caricamento...</p>
      ) : items.length > 0 ? (
        <ChecklistTable items={items} onStatoChange={handleStatoChange} />
      ) : clienteId ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg mb-2">Nessuna checklist per questo cliente e anno.</p>
          <p className="text-sm">Clicca "Genera Checklist" per crearla automaticamente.</p>
        </div>
      ) : (
        <div className="text-center py-16 text-gray-300">
          <p className="text-lg">Seleziona un cliente per visualizzare o generare la checklist.</p>
        </div>
      )}
    </div>
  );
}
