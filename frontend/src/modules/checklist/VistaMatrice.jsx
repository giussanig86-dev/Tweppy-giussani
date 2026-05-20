import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/useAuth';
import { checklistApi } from '../../api/checklist';

const ANNO_CORRENTE = new Date().getFullYear();
const ANNI = [ANNO_CORRENTE + 1, ANNO_CORRENTE, ANNO_CORRENTE - 1];
const CATEGORIE = ['IVA', 'Dichiarazioni', 'Acconti', 'Ritenute', 'Dipendenti', 'Societario', 'Altro'];
const MESI = [
  { v: 0, l: 'Tutti i mesi' },
  { v: 1, l: 'Gennaio' }, { v: 2, l: 'Febbraio' }, { v: 3, l: 'Marzo' },
  { v: 4, l: 'Aprile' }, { v: 5, l: 'Maggio' }, { v: 6, l: 'Giugno' },
  { v: 7, l: 'Luglio' }, { v: 8, l: 'Agosto' }, { v: 9, l: 'Settembre' },
  { v: 10, l: 'Ottobre' }, { v: 11, l: 'Novembre' }, { v: 12, l: 'Dicembre' },
];

const STATO_STYLE = {
  completato: 'bg-green-100 text-green-700',
  in_lavorazione: 'bg-blue-100 text-blue-700',
  da_fare: 'bg-red-100 text-red-700',
};

function statoAggregato(items) {
  if (!items.length) return null;
  if (items.every(i => i.stato === 'completato')) return 'completato';
  if (items.some(i => i.stato === 'in_lavorazione')) return 'in_lavorazione';
  return 'da_fare';
}

function CellaBadge({ items }) {
  const stato = statoAggregato(items);
  if (!stato) return <span className="text-gray-200">—</span>;
  const tot = items.length;
  const done = items.filter(i => i.stato === 'completato').length;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${STATO_STYLE[stato]}`}>
      {stato === 'completato' ? '✓' : `${done}/${tot}`}
    </span>
  );
}

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

const CICLO = ['da_fare', 'in_lavorazione', 'completato'];

export default function VistaMatrice() {
  const { getToken } = useAuth();
  const [anno, setAnno] = useState(ANNO_CORRENTE);
  const [mese, setMese] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dettaglio, setDettaglio] = useState(null); // { clienteNome, categoria, items }
  const [colEvidenziata, setColEvidenziata] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => { load(); }, [anno, mese]);

  async function load() {
    setLoading(true); setError(null); setDettaglio(null);
    try {
      const token = await getToken();
      setItems(await checklistApi.matrice(token, anno, mese || null));
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }

  const clienti = [...new Map(
    items.map(i => [i.clienteId, { clienteId: i.clienteId, clienteNome: i.clienteNome }])
  ).values()].sort((a, b) => (a.clienteNome || '').localeCompare(b.clienteNome || ''));

  function cellItems(clienteId, categoria) {
    return items.filter(i => i.clienteId === clienteId && i.categoria === categoria);
  }

  function handleCella(clienteId, clienteNome, categoria) {
    const ci = cellItems(clienteId, categoria);
    if (!ci.length) return;
    setDettaglio({ clienteNome, categoria, items: ci });
  }

  async function cycleStato(item) {
    const nextStato = CICLO[(CICLO.indexOf(item.stato) + 1) % CICLO.length];
    setUpdatingId(item.id);
    try {
      const token = await getToken();
      await checklistApi.updateStato(token, item.id, nextStato);
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, stato: nextStato } : i));
      setDettaglio(prev => prev
        ? { ...prev, items: prev.items.map(i => i.id === item.id ? { ...i, stato: nextStato } : i) }
        : prev
      );
    } catch {} finally { setUpdatingId(null); }
  }

  return (
    <div className="space-y-4">
      {/* Filtri */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={anno}
          onChange={e => setAnno(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          {ANNI.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select
          value={mese}
          onChange={e => setMese(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          {MESI.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
        </select>
        <button
          onClick={load}
          className="px-3 py-1.5 text-sm bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition"
        >
          Aggiorna
        </button>
        {items.length > 0 && (
          <span className="text-xs text-gray-400 ml-auto">
            {clienti.length} clienti · {items.length} adempimenti
          </span>
        )}
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {loading ? (
        <p className="text-sm text-gray-400">Caricamento...</p>
      ) : clienti.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-16">
          Nessun adempimento per-cliente trovato nel periodo selezionato.
        </p>
      ) : (
        <div className="flex gap-4 min-h-0">
          {/* Tabella matrice */}
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 border-b border-r border-gray-200 sticky left-0 bg-gray-50 min-w-48">
                    Cliente
                  </th>
                  {CATEGORIE.map(cat => (
                    <th
                      key={cat}
                      onClick={() => setColEvidenziata(c => c === cat ? null : cat)}
                      className={`px-3 py-2.5 text-xs font-semibold text-center border-b border-gray-200 cursor-pointer select-none transition whitespace-nowrap
                        ${colEvidenziata === cat ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                      {cat}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clienti.map((c, ri) => (
                  <tr key={c.clienteId} className={ri % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className={`px-4 py-2 font-medium text-gray-800 border-r border-gray-200 sticky left-0 text-xs
                      ${ri % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                      {c.clienteNome || c.clienteId}
                    </td>
                    {CATEGORIE.map(cat => {
                      const ci = cellItems(c.clienteId, cat);
                      const isSelected = dettaglio?.clienteId === c.clienteId && dettaglio?.categoria === cat;
                      const isColEv = colEvidenziata === cat;
                      return (
                        <td
                          key={cat}
                          onClick={() => handleCella(c.clienteId, c.clienteNome, cat)}
                          className={`px-3 py-2 text-center transition
                            ${ci.length ? 'cursor-pointer hover:bg-brand-50' : ''}
                            ${isSelected ? 'bg-brand-50 ring-1 ring-inset ring-brand-400' : ''}
                            ${isColEv && ci.length ? 'bg-yellow-50' : ''}`}
                        >
                          <CellaBadge items={ci} />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pannello dettaglio */}
          {dettaglio && (
            <div className="w-72 shrink-0 border border-gray-200 rounded-xl bg-white overflow-hidden flex flex-col">
              <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-800 truncate">{dettaglio.clienteNome}</p>
                  <p className="text-xs text-gray-500">{dettaglio.categoria}</p>
                </div>
                <button onClick={() => setDettaglio(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                {dettaglio.items.map(item => (
                  <div key={item.id} className="px-4 py-3">
                    <p className="text-xs font-medium text-gray-800 leading-snug">{item.adempimento}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(item.scadenza)}</p>
                    <button
                      disabled={updatingId === item.id}
                      onClick={() => cycleStato(item)}
                      className={`mt-1.5 text-xs px-2 py-0.5 rounded-full font-semibold transition disabled:opacity-50
                        ${STATO_STYLE[item.stato] || 'bg-gray-100 text-gray-500'}`}
                    >
                      {item.stato === 'da_fare' ? 'Da fare'
                        : item.stato === 'in_lavorazione' ? 'In lavorazione'
                        : 'Completato'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
