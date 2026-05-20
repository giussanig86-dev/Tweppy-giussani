import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/useAuth';
import { checklistApi } from '../../api/checklist';
import { anagraficaApi } from '../../api/anagrafica';

const ANNO_CORRENTE = new Date().getFullYear();
const ANNI = [ANNO_CORRENTE + 1, ANNO_CORRENTE, ANNO_CORRENTE - 1];
const MESI = [
  { v: 0, l: 'Tutti i mesi' },
  { v: 1, l: 'Gennaio' }, { v: 2, l: 'Febbraio' }, { v: 3, l: 'Marzo' },
  { v: 4, l: 'Aprile' }, { v: 5, l: 'Maggio' }, { v: 6, l: 'Giugno' },
  { v: 7, l: 'Luglio' }, { v: 8, l: 'Agosto' }, { v: 9, l: 'Settembre' },
  { v: 10, l: 'Ottobre' }, { v: 11, l: 'Novembre' }, { v: 12, l: 'Dicembre' },
];

const STATI_CELL = [
  { k: 'da_fare',     label: 'Da fare',     icon: '○' },
  { k: 'fatto',       label: 'Fatto',       icon: '✓' },
  { k: 'da_non_fare', label: 'Da non fare', icon: '✕' },
  { k: 'comunicato',  label: 'Comunicato',  icon: '✉' },
];
const STATO_ACTIVE = {
  da_fare:     'bg-gray-200 text-gray-700',
  fatto:       'bg-green-500 text-white',
  da_non_fare: 'bg-red-400 text-white',
  comunicato:  'bg-blue-500 text-white',
};

function formatGiorno(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function CellaStato({ item, onUpdate, updatingId }) {
  if (!item) return <span className="block text-center text-gray-200 text-xs">—</span>;
  return (
    <div className="flex gap-0.5 justify-center">
      {STATI_CELL.map(s => (
        <button
          key={s.k}
          title={s.label}
          disabled={updatingId === item.id}
          onClick={() => onUpdate(item.id, s.k)}
          className={`w-6 h-6 rounded text-xs font-bold leading-none transition disabled:opacity-40
            ${item.stato === s.k
              ? STATO_ACTIVE[s.k]
              : 'border border-gray-200 text-gray-300 hover:border-gray-400 hover:text-gray-500'
            }`}
        >
          {s.icon}
        </button>
      ))}
    </div>
  );
}

export default function VistaScadenzario() {
  const { getToken } = useAuth();
  const [anno, setAnno] = useState(ANNO_CORRENTE);
  const [mese, setMese] = useState(new Date().getMonth() + 1);
  const [items, setItems] = useState([]);
  const [clientiInfo, setClientiInfo] = useState({});
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => { load(); }, [anno, mese]);

  async function load() {
    setLoading(true); setError(null);
    try {
      const token = await getToken();
      const [data, clienti] = await Promise.all([
        checklistApi.matrice(token, anno, mese || null),
        anagraficaApi.list(token),
      ]);
      setItems(data);
      setClientiInfo(Object.fromEntries(clienti.map(c => [c.id, c])));
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function handleUpdate(id, stato) {
    setUpdatingId(id);
    try {
      const token = await getToken();
      await checklistApi.updateStato(token, id, stato);
      setItems(prev => prev.map(i => i.id === id ? { ...i, stato } : i));
    } catch {} finally { setUpdatingId(null); }
  }

  const perGiorno = items.reduce((acc, item) => {
    const d = item.scadenza?.slice(0, 10) || '';
    if (!acc[d]) acc[d] = [];
    acc[d].push(item);
    return acc;
  }, {});
  const date = Object.keys(perGiorno).sort();

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <select value={anno} onChange={e => setAnno(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500">
          {ANNI.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={mese} onChange={e => setMese(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500">
          {MESI.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
        </select>
        <button onClick={load} className="px-3 py-1.5 text-sm bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition">
          Aggiorna
        </button>
        {items.length > 0 && (
          <span className="text-xs text-gray-400 ml-auto">
            {date.length} scadenze · {[...new Set(items.map(i => i.clienteId))].length} clienti · {items.length} adempimenti
          </span>
        )}
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {loading ? (
        <p className="text-gray-400 text-sm">Caricamento...</p>
      ) : date.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg mb-2">Nessun adempimento nel periodo selezionato.</p>
          <p className="text-sm">Usa la scheda "Per Cliente" per generare le checklist.</p>
        </div>
      ) : (
        date.map(giorno => {
          const dayItems = perGiorno[giorno];
          const clientiGiorno = [...new Map(dayItems.map(i => [i.clienteId, { id: i.clienteId, nome: i.clienteNome }])).values()]
            .sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
          const adempimentiGiorno = [...new Set(dayItems.map(i => i.adempimento))].sort();
          const fatti = dayItems.filter(i => i.stato === 'fatto').length;
          const comunicati = dayItems.filter(i => i.stato === 'comunicato').length;
          const daFare = dayItems.filter(i => i.stato === 'da_fare').length;

          return (
            <div key={giorno} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
                <div>
                  <p className="font-semibold text-gray-800 capitalize">{formatGiorno(giorno)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {clientiGiorno.length} {clientiGiorno.length === 1 ? 'cliente' : 'clienti'} · {dayItems.length} adempimenti
                  </p>
                </div>
                <div className="flex gap-1.5">
                  {daFare > 0 && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">{daFare} da fare</span>}
                  {fatti > 0 && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">{fatti} fatti</span>}
                  {comunicati > 0 && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{comunicati} comunicati</span>}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-white border-b border-gray-100">
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 sticky left-0 bg-white min-w-40 border-r border-gray-100">
                        Cliente
                      </th>
                      {adempimentiGiorno.map(a => (
                        <th key={a} className="px-3 py-2.5 text-xs font-medium text-gray-500 text-center border-l border-gray-100 whitespace-nowrap" title={a}>
                          {a.length > 26 ? a.slice(0, 24) + '…' : a}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {clientiGiorno.map((cl, ri) => {
                      const info = clientiInfo[cl.id];
                      const isCessazione = info?.stato === 'in_cessazione';
                      const rowBg = isCessazione ? 'bg-amber-50' : ri % 2 === 0 ? 'bg-white' : 'bg-gray-50/40';
                      return (
                        <tr key={cl.id} className={rowBg}>
                          <td className={`px-4 py-2.5 font-medium text-xs sticky left-0 border-r border-gray-100 ${rowBg}`}>
                            <span className={isCessazione ? 'text-amber-700' : 'text-gray-800'}>{cl.nome || cl.id}</span>
                            {isCessazione && (
                              <span className="ml-1.5 text-[10px] bg-amber-200 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold">cessazione</span>
                            )}
                          </td>
                          {adempimentiGiorno.map(a => {
                            const item = dayItems.find(i => i.clienteId === cl.id && i.adempimento === a);
                            return (
                              <td key={a} className="px-3 py-2 text-center border-l border-gray-100">
                                <CellaStato item={item} onUpdate={handleUpdate} updatingId={updatingId} />
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
