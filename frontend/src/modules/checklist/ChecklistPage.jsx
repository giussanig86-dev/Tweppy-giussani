import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/useAuth';
import { anagraficaApi } from '../../api/anagrafica';
import { checklistApi } from '../../api/checklist';
import ChecklistTable from './ChecklistTable';
import VistaMatrice from './VistaMatrice';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';

const ANNO_CORRENTE = new Date().getFullYear();
const ANNI = [ANNO_CORRENTE + 1, ANNO_CORRENTE, ANNO_CORRENTE - 1];
const CATEGORIE = ['IVA', 'Dichiarazioni', 'Acconti', 'Ritenute', 'Dipendenti', 'Societario', 'Altro'];

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-xl border p-4">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

// ─── Vista per-Anno (scadenzario studio) ─────────────────────────────────────
function VistaAnno() {
  const { getToken } = useAuth();
  const [anno, setAnno] = useState(ANNO_CORRENTE);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [nuovoModal, setNuovoModal] = useState(false);
  const [nuovoForm, setNuovoForm] = useState({
    adempimento: '', categoria: 'IVA', scadenza: '', note: '', aggiungiCalendario: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadItems(anno); }, [anno]);

  async function loadItems(a) {
    setLoading(true); setError(null);
    try {
      const token = await getToken();
      setItems(await checklistApi.getAnno(token, a));
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }

  async function handleGenera() {
    setGenerating(true); setError(null);
    try {
      const token = await getToken();
      const data = await checklistApi.generaAnno(token, anno);
      setItems(data);
    } catch (e) { setError(e.message); } finally { setGenerating(false); }
  }

  async function handleStatoChange(id, stato, note) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, stato } : i));
    const token = await getToken();
    await checklistApi.updateStato(token, id, stato, note);
  }

  async function handleNuovo() {
    if (!nuovoForm.adempimento || !nuovoForm.scadenza) return;
    setSaving(true);
    try {
      const token = await getToken();
      const item = await checklistApi.create(token, { ...nuovoForm, anno });
      setItems(prev => [...prev, item].sort((a, b) => (a.scadenza || '').localeCompare(b.scadenza || '')));
      setNuovoModal(false);
      setNuovoForm({ adempimento: '', categoria: 'IVA', scadenza: '', note: '', aggiungiCalendario: true });
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  }

  const tot = items.length;
  const completati = items.filter(i => i.stato === 'completato').length;
  const inCorso = items.filter(i => i.stato === 'in_lavorazione').length;
  const scaduti = items.filter(i => i.stato !== 'completato' && new Date(i.scadenza) < new Date()).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-gray-600">Anno</label>
          <select
            value={anno}
            onChange={e => setAnno(parseInt(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {ANNI.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setNuovoModal(true)}>
            + Nuovo Adempimento
          </Button>
          <Button onClick={handleGenera} disabled={generating}>
            {generating ? 'Generazione...' : `Genera Scadenzario ${anno}`}
          </Button>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {tot > 0 && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard label="Totale adempimenti" value={tot} color="text-gray-800" />
          <StatCard label="Completati" value={completati} color="text-green-600" />
          <StatCard label="In lavorazione" value={inCorso} color="text-blue-600" />
          <StatCard label="Scaduti" value={scaduti} color={scaduti > 0 ? 'text-red-600' : 'text-gray-400'} />
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Caricamento...</p>
      ) : items.length > 0 ? (
        <ChecklistTable items={items} onStatoChange={handleStatoChange} />
      ) : (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg mb-2">Nessun adempimento per il {anno}.</p>
          <p className="text-sm">
            Clicca <strong>Genera Scadenzario {anno}</strong> per creare automaticamente tutte le scadenze fiscali,
            <br />oppure <strong>+ Nuovo Adempimento</strong> per aggiungerne uno manuale.
          </p>
        </div>
      )}

      <Modal open={nuovoModal} onClose={() => setNuovoModal(false)} title="Nuovo Adempimento">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Adempimento *</label>
            <input
              type="text"
              value={nuovoForm.adempimento}
              onChange={e => setNuovoForm(p => ({ ...p, adempimento: e.target.value }))}
              placeholder="es. Acconto IMU"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Categoria</label>
              <select
                value={nuovoForm.categoria}
                onChange={e => setNuovoForm(p => ({ ...p, categoria: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {CATEGORIE.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Scadenza *</label>
              <input
                type="date"
                value={nuovoForm.scadenza}
                onChange={e => setNuovoForm(p => ({ ...p, scadenza: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Note</label>
            <textarea
              value={nuovoForm.note}
              onChange={e => setNuovoForm(p => ({ ...p, note: e.target.value }))}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={nuovoForm.aggiungiCalendario}
              onChange={e => setNuovoForm(p => ({ ...p, aggiungiCalendario: e.target.checked }))}
            />
            Aggiungi anche al calendario
          </label>
          <div className="flex justify-end gap-3 pt-1">
            <Button variant="secondary" onClick={() => setNuovoModal(false)}>Annulla</Button>
            <Button
              onClick={handleNuovo}
              disabled={saving || !nuovoForm.adempimento || !nuovoForm.scadenza}
            >
              {saving ? 'Salvataggio...' : 'Crea Adempimento'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Vista per-Cliente ────────────────────────────────────────────────────────
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
    getToken().then(t => anagraficaApi.list(t).then(setClienti).catch(() => {}));
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
  const completati = items.filter(i => i.stato === 'completato').length;
  const inCorso = items.filter(i => i.stato === 'in_lavorazione').length;
  const scaduti = items.filter(i => i.stato !== 'completato' && new Date(i.scadenza) < new Date()).length;

  return (
    <div>
      <div className="flex gap-4 mb-6 items-end">
        <div className="flex-1 max-w-xs">
          <label className="block text-xs font-medium text-gray-600 mb-1">Cliente</label>
          <select
            value={clienteId}
            onChange={e => { setClienteId(e.target.value); setItems([]); if (e.target.value) loadChecklist(e.target.value, anno); }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">— seleziona cliente —</option>
            {clienti.map(c => <option key={c.id} value={c.id}>{c.ragioneSociale}</option>)}
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

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {tot > 0 && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard label="Totale adempimenti" value={tot} color="text-gray-800" />
          <StatCard label="Completati" value={completati} color="text-green-600" />
          <StatCard label="In lavorazione" value={inCorso} color="text-blue-600" />
          <StatCard label="Scaduti" value={scaduti} color={scaduti > 0 ? 'text-red-600' : 'text-gray-400'} />
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

// ─── Pagina principale con tab ────────────────────────────────────────────────
export default function ChecklistPage() {
  const [tab, setTab] = useState('anno');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Adempimenti &amp; Scadenze Fiscali</h1>
        <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
          {[
            { key: 'anno', label: '📅 Scadenzario Studio' },
            { key: 'cliente', label: '👤 Per Cliente' },
            { key: 'matrice', label: '📊 Riepilogo' },
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

      {tab === 'anno' && <VistaAnno />}
      {tab === 'cliente' && <VistaCliente />}
      {tab === 'matrice' && <VistaMatrice />}
    </div>
  );
}
