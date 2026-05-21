import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/useAuth';
import { parcellazioneApi } from '../../api/parcellazione';
import { anagraficaApi } from '../../api/anagrafica';
import AttivitaForm from './AttivitaForm';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import SharePointClienteLink from '../../components/ui/SharePointClienteLink';

const TABS = ['Registro Attività', 'Dashboard Redditività', 'Calcola Parcella'];

const fmt = (n) => `€ ${Number(n || 0).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function ParcellazionePage() {
  const { getToken } = useAuth();
  const [tab, setTab] = useState(0);
  const [tariffario, setTariffario] = useState(null);
  const [clienti, setClienti] = useState([]);
  const [attivita, setAttivita] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [taskCompletati, setTaskCompletati] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [filtroCliente, setFiltroCliente] = useState('');
  const [filtroAnno, setFiltroAnno] = useState(String(new Date().getFullYear()));
  const [filtroFatturato, setFiltroFatturato] = useState('');
  const [annoDb, setAnnoDb] = useState(String(new Date().getFullYear()));

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  // Import task
  const [importOpen, setImportOpen] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [voceImport, setVoceImport] = useState('');
  const [importing, setImporting] = useState(false);

  // Selezione per fattura
  const [selectedIds, setSelectedIds] = useState([]);

  async function load() {
    try {
      setLoading(true);
      const token = await getToken();
      const [tar, cl, att, db] = await Promise.all([
        parcellazioneApi.tariffario(token),
        anagraficaApi.list(token),
        parcellazioneApi.listAttivita(token, buildParams()),
        parcellazioneApi.dashboard(token, filtroAnno),
      ]);
      setTariffario(tar);
      setClienti(cl.filter(c => c.stato !== 'eliminato'));
      setAttivita(att);
      setDashboard(db);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }

  function buildParams() {
    const p = {};
    if (filtroCliente) p.clienteId = filtroCliente;
    if (filtroAnno) p.anno = filtroAnno;
    if (filtroFatturato !== '') p.fatturato = filtroFatturato;
    return p;
  }

  useEffect(() => { load(); }, [filtroCliente, filtroAnno, filtroFatturato]);

  async function handleSave(data) {
    const token = await getToken();
    if (editItem?.id) await parcellazioneApi.updateAttivita(token, editItem.id, data);
    else await parcellazioneApi.createAttivita(token, data);
    setModalOpen(false); setEditItem(null);
    load();
  }

  async function handleDelete(id) {
    if (!confirm('Eliminare questa attività?')) return;
    const token = await getToken();
    await parcellazioneApi.deleteAttivita(token, id);
    load();
  }

  async function handleFattura() {
    if (!selectedIds.length) return;
    if (!confirm(`Segnare ${selectedIds.length} attività come fatturate?`)) return;
    const token = await getToken();
    await parcellazioneApi.fattura(token, selectedIds);
    setSelectedIds([]);
    load();
  }

  async function openImport() {
    const token = await getToken();
    const tasks = await parcellazioneApi.taskCompletati(token);
    setTaskCompletati(tasks);
    setSelectedTaskIds([]);
    setVoceImport(tariffario?.voci?.find(v => v.id === 'consulenza_oraria')?.id || '');
    setImportOpen(true);
  }

  async function handleImporta() {
    if (!selectedTaskIds.length) return;
    setImporting(true);
    try {
      const token = await getToken();
      await parcellazioneApi.importaTask(token, selectedTaskIds, voceImport);
      setImportOpen(false);
      load();
    } finally { setImporting(false); }
  }

  function toggleSelect(id) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function toggleSelectTask(id) {
    setSelectedTaskIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  const daFatturare = attivita.filter(a => !a.fatturato);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Parcellazione LAPET</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={openImport}>Importa da Task</Button>
          <Button onClick={() => { setEditItem(null); setModalOpen(true); }}>+ Nuova Attività</Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)}
            className={`px-5 py-2 text-sm font-medium border-b-2 -mb-px transition ${tab === i ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? <p className="text-gray-500">Caricamento...</p> : error ? <p className="text-red-500">{error}</p> : (
        <>
          {tab === 0 && (
            <RegistroTab
              attivita={attivita}
              clienti={clienti}
              filtroCliente={filtroCliente} setFiltroCliente={setFiltroCliente}
              filtroAnno={filtroAnno} setFiltroAnno={setFiltroAnno}
              filtroFatturato={filtroFatturato} setFiltroFatturato={setFiltroFatturato}
              selectedIds={selectedIds} toggleSelect={toggleSelect}
              onEdit={item => { setEditItem(item); setModalOpen(true); }}
              onDelete={handleDelete}
              onFattura={handleFattura}
              daFatturare={daFatturare}
            />
          )}
          {tab === 1 && <DashboardTab dashboard={dashboard} anno={filtroAnno} setAnno={setFiltroAnno} />}
          {tab === 2 && <CalcolaTab tariffario={tariffario} />}
        </>
      )}

      {/* Modal nuova/modifica attività */}
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditItem(null); }}
        title={editItem ? 'Modifica Attività' : 'Nuova Attività'}>
        <AttivitaForm
          initial={editItem}
          clienti={clienti}
          tariffario={tariffario}
          onSave={handleSave}
          onCancel={() => { setModalOpen(false); setEditItem(null); }}
        />
      </Modal>

      {/* Modal import task */}
      <Modal open={importOpen} onClose={() => setImportOpen(false)} title="Importa Task Completati">
        <div className="space-y-4">
          {taskCompletati.length === 0 ? (
            <p className="text-sm text-gray-500">Nessun task completato da importare.</p>
          ) : (
            <>
              <p className="text-sm text-gray-600">{taskCompletati.length} task disponibili</p>
              <div className="max-h-60 overflow-y-auto space-y-1">
                {taskCompletati.map(t => (
                  <label key={t.id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" checked={selectedTaskIds.includes(t.id)}
                      onChange={() => toggleSelectTask(t.id)} className="rounded" />
                    <div className="text-sm">
                      <div className="font-medium text-gray-800">{t.titolo}</div>
                      <div className="text-xs text-gray-400">{t.clienteNome}</div>
                    </div>
                  </label>
                ))}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Voce tariffario</label>
                <select value={voceImport} onChange={e => setVoceImport(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500">
                  {(tariffario?.voci || []).map(v => (
                    <option key={v.id} value={v.id}>{v.descrizione} (€ {v.importoBase})</option>
                  ))}
                </select>
              </div>
            </>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setImportOpen(false)}>Chiudi</Button>
            {taskCompletati.length > 0 && (
              <Button onClick={handleImporta} disabled={!selectedTaskIds.length || importing}>
                {importing ? 'Importazione...' : `Importa ${selectedTaskIds.length} task`}
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}

function RegistroTab({ attivita, clienti, filtroCliente, setFiltroCliente, filtroAnno, setFiltroAnno,
  filtroFatturato, setFiltroFatturato, selectedIds, toggleSelect, onEdit, onDelete, onFattura, daFatturare }) {

  const anni = [];
  for (let y = new Date().getFullYear(); y >= 2020; y--) anni.push(y);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={filtroCliente} onChange={e => setFiltroCliente(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
          <option value="">Tutti i clienti</option>
          {clienti.map(c => <option key={c.id} value={c.id}>{c.ragioneSociale}</option>)}
        </select>
        <select value={filtroAnno} onChange={e => setFiltroAnno(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
          <option value="">Tutti gli anni</option>
          {anni.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={filtroFatturato} onChange={e => setFiltroFatturato(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
          <option value="">Tutti</option>
          <option value="false">Da fatturare</option>
          <option value="true">Già fatturati</option>
        </select>
        {selectedIds.length > 0 && (
          <Button size="sm" onClick={onFattura}>
            Segna come fatturati ({selectedIds.length})
          </Button>
        )}
      </div>

      {attivita.length === 0 ? (
        <p className="text-sm text-gray-500">Nessuna attività trovata.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-gray-500 uppercase tracking-wide">
                <th className="pb-2 pr-3 w-8"></th>
                <th className="pb-2 pr-3">Data</th>
                <th className="pb-2 pr-3">Cliente</th>
                <th className="pb-2 pr-3">Prestazione</th>
                <th className="pb-2 pr-3">Collaboratore</th>
                <th className="pb-2 pr-3 text-right">Netto</th>
                <th className="pb-2 pr-3 text-right">Totale</th>
                <th className="pb-2 pr-3">Stato</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {attivita.map(a => (
                <tr key={a.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 pr-3">
                    {!a.fatturato && (
                      <input type="checkbox" checked={selectedIds.includes(a.id)}
                        onChange={() => toggleSelect(a.id)} className="rounded" />
                    )}
                  </td>
                  <td className="py-2 pr-3 text-gray-600">{a.data}</td>
                  <td className="py-2 pr-3 font-medium text-gray-800">
                    <div className="flex items-center gap-1">
                      {a.clienteNome}
                      <SharePointClienteLink nome={a.clienteNome} />
                    </div>
                  </td>
                  <td className="py-2 pr-3 text-gray-600 max-w-xs truncate" title={a.voceDescrizione}>{a.voceDescrizione || a.note}</td>
                  <td className="py-2 pr-3 text-gray-500">{a.collaboratore || '—'}</td>
                  <td className="py-2 pr-3 text-right text-gray-700">{fmt(a.importoNetto)}</td>
                  <td className="py-2 pr-3 text-right font-semibold text-gray-800">{fmt(a.importoTotale)}</td>
                  <td className="py-2 pr-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.fatturato ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {a.fatturato ? 'Fatturato' : 'Da fatturare'}
                    </span>
                  </td>
                  <td className="py-2">
                    <div className="flex gap-1">
                      <Button size="sm" variant="secondary" onClick={() => onEdit(a)}>Modifica</Button>
                      <Button size="sm" variant="danger" onClick={() => onDelete(a.id)}>X</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DashboardTab({ dashboard, anno, setAnno }) {
  const anni = [];
  for (let y = new Date().getFullYear(); y >= 2020; y--) anni.push(y);

  if (!dashboard) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-600">Anno:</label>
        <select value={anno} onChange={e => setAnno(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
          {anni.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Fatturato anno" value={`€ ${Number(dashboard.totaleAnno).toLocaleString('it-IT', { minimumFractionDigits: 2 })}`} />
        <KpiCard label="Mese corrente" value={`€ ${Number(dashboard.totaleMese).toLocaleString('it-IT', { minimumFractionDigits: 2 })}`} />
        <KpiCard label="Da fatturare" value={`€ ${Number(dashboard.totaleDaFatturare).toLocaleString('it-IT', { minimumFractionDigits: 2 })}`} highlight />
        <KpiCard label="N° attività anno" value={dashboard.conteggioAttivita} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Per cliente */}
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Top clienti per fatturato</h3>
          <div className="space-y-2">
            {(dashboard.perCliente || []).map(([nome, tot], i) => {
              const max = dashboard.perCliente[0]?.[1] || 1;
              return (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 truncate max-w-xs">{nome}</span>
                    <span className="font-medium text-gray-800 ml-2">{fmt(tot)}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full">
                    <div className="h-full bg-brand-500 rounded-full" style={{ width: `${(tot / max) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Per collaboratore */}
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Per collaboratore</h3>
          <div className="space-y-2">
            {(dashboard.perCollaboratore || []).map(([nome, tot], i) => {
              const max = dashboard.perCollaboratore[0]?.[1] || 1;
              return (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{nome || '(nessuno)'}</span>
                    <span className="font-medium text-gray-800 ml-2">{fmt(tot)}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(tot / max) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, highlight }) {
  return (
    <div className={`rounded-xl border p-5 ${highlight ? 'border-amber-300 bg-amber-50' : 'bg-white'}`}>
      <div className={`text-2xl font-bold ${highlight ? 'text-amber-700' : 'text-gray-800'}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

function CalcolaTab({ tariffario }) {
  const voci = tariffario?.voci || [];
  const categorie = [...new Set(voci.map(v => v.categoria))];
  const [voceId, setVoceId] = useState('');
  const [importoUnitario, setImportoUnitario] = useState('');
  const [quantita, setQuantita] = useState('1');

  function handleVoce(id) {
    setVoceId(id);
    const v = voci.find(x => x.id === id);
    if (v) setImportoUnitario(String(v.importoBase));
  }

  const netto = parseFloat(importoUnitario || 0) * parseFloat(quantita || 1);
  const contributo = netto * (tariffario?.contributoIntegrativo || 0.04);
  const iva = (netto + contributo) * (tariffario?.iva || 0.22);
  const totale = netto + contributo + iva;
  const r = n => Math.round(n * 100) / 100;

  return (
    <div className="max-w-md space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Voce tariffario</label>
        <select value={voceId} onChange={e => handleVoce(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500">
          <option value="">— seleziona voce —</option>
          {categorie.map(cat => (
            <optgroup key={cat} label={cat}>
              {voci.filter(v => v.categoria === cat).map(v => (
                <option key={v.id} value={v.id}>{v.descrizione} (€ {v.importoBase})</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Importo unitario (€)</label>
          <input type="number" step="0.01" min="0" value={importoUnitario} onChange={e => setImportoUnitario(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Quantità</label>
          <input type="number" step="1" min="1" value={quantita} onChange={e => setQuantita(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
      </div>

      {netto > 0 && (
        <div className="bg-white rounded-xl border p-5 text-sm space-y-3">
          <div className="flex justify-between text-gray-600">
            <span>Imponibile netto</span><span className="font-medium">{fmt(r(netto))}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Contributo integrativo ({((tariffario?.contributoIntegrativo || 0.04) * 100).toFixed(0)}%)</span>
            <span className="font-medium">{fmt(r(contributo))}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>IVA ({((tariffario?.iva || 0.22) * 100).toFixed(0)}%)</span>
            <span className="font-medium">{fmt(r(iva))}</span>
          </div>
          <div className="flex justify-between text-gray-800 font-bold text-lg border-t pt-3">
            <span>Totale da pagare</span>
            <span className="text-brand-700">{fmt(r(totale))}</span>
          </div>
        </div>
      )}
    </div>
  );
}
