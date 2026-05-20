import { useState, useEffect, useCallback } from 'react';
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
const STATO_LABEL = {
  da_fare: 'Da fare', fatto: 'Fatto', da_non_fare: 'Da non fare', comunicato: 'Comunicato',
};

function formatGiorno(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function CellaStato({ item, onUpdate, updatingId, locked }) {
  if (!item) return <span className="block text-center text-gray-200 text-xs">—</span>;
  return (
    <div className={`flex gap-0.5 justify-center ${locked ? 'opacity-60' : ''}`}>
      {STATI_CELL.map(s => (
        <button
          key={s.k}
          title={locked ? 'Sblocca la data per modificare' : s.label}
          disabled={locked || updatingId === item.id}
          onClick={() => !locked && onUpdate(item.id, s.k)}
          className={`w-6 h-6 rounded text-xs font-bold leading-none transition
            ${locked ? 'cursor-not-allowed' : 'disabled:opacity-40'}
            ${item.stato === s.k
              ? STATO_ACTIVE[s.k]
              : `border border-gray-200 text-gray-300 ${locked ? '' : 'hover:border-gray-400 hover:text-gray-500'}`
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
  const [unlockedDays, setUnlockedDays] = useState(new Set());
  const [colFilter, setColFilter] = useState('');

  useEffect(() => { load(); }, [anno, mese]);

  async function load() {
    setLoading(true); setError(null); setUnlockedDays(new Set());
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

  function toggleDay(giorno) {
    setUnlockedDays(prev => {
      const next = new Set(prev);
      if (next.has(giorno)) next.delete(giorno); else next.add(giorno);
      return next;
    });
  }

  function exportCSV() {
    const rows = [['Data', 'Giorno', 'Cliente', 'Adempimento', 'Stato']];
    date.forEach(giorno => {
      perGiorno[giorno].forEach(item => {
        rows.push([
          giorno,
          formatGiorno(giorno),
          item.clienteNome || item.clienteId,
          item.adempimento,
          STATO_LABEL[item.stato] || item.stato,
        ]);
      });
    });
    const csv = rows.map(r =>
      r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const meseNome = MESI.find(m => m.v === mese)?.l || 'tutti';
    link.download = `scadenzario_${anno}_${meseNome}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  const perGiorno = items.reduce((acc, item) => {
    const d = item.scadenza?.slice(0, 10) || '';
    if (!acc[d]) acc[d] = [];
    acc[d].push(item);
    return acc;
  }, {});
  const date = Object.keys(perGiorno).sort();

  return (
    <div className="space-y-5 print:space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap print:hidden">
        <select value={anno} onChange={e => setAnno(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500">
          {ANNI.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={mese} onChange={e => setMese(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500">
          {MESI.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
        </select>
        <input
          type="text"
          placeholder="Filtra colonne..."
          value={colFilter}
          onChange={e => setColFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-44"
        />
        <button onClick={load}
          className="px-3 py-1.5 text-sm bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition">
          Aggiorna
        </button>
        {items.length > 0 && (
          <>
            <div className="flex-1" />
            <button onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-700">
              ⬇ Excel (CSV)
            </button>
            <button onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-700">
              🖨 Stampa
            </button>
          </>
        )}
      </div>

      {/* Conteggio */}
      {items.length > 0 && (
        <p className="text-xs text-gray-400 print:hidden">
          {date.length} scadenze · {[...new Set(items.map(i => i.clienteId))].length} clienti · {items.length} adempimenti
        </p>
      )}

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
          const adempimentiGiorno = [...new Set(dayItems.map(i => i.adempimento))]
            .filter(a => !colFilter || a.toLowerCase().includes(colFilter.toLowerCase()))
            .sort();
          const fatti = dayItems.filter(i => i.stato === 'fatto').length;
          const comunicati = dayItems.filter(i => i.stato === 'comunicato').length;
          const daFare = dayItems.filter(i => i.stato === 'da_fare').length;
          const isUnlocked = unlockedDays.has(giorno);

          if (adempimentiGiorno.length === 0) return null;

          return (
            <div key={giorno} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm print:shadow-none print:border-gray-400 print:break-inside-avoid">
              {/* Header giorno */}
              <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200 print:bg-gray-100">
                <div>
                  <p className="font-semibold text-gray-800 capitalize">{formatGiorno(giorno)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {clientiGiorno.length} {clientiGiorno.length === 1 ? 'cliente' : 'clienti'} · {dayItems.length} adempimenti
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    {daFare > 0 && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">{daFare} da fare</span>}
                    {fatti > 0 && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">{fatti} fatti</span>}
                    {comunicati > 0 && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{comunicati} comunicati</span>}
                  </div>
                  {/* Lock toggle */}
                  <button
                    onClick={() => toggleDay(giorno)}
                    title={isUnlocked ? 'Clicca per bloccare la modifica' : 'Clicca per abilitare la modifica'}
                    className={`print:hidden flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition
                      ${isUnlocked
                        ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                  >
                    {isUnlocked ? '🔓 Blocca' : '🔒 Modifica'}
                  </button>
                </div>
              </div>

              {/* Matrice */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-white border-b border-gray-100">
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 sticky left-0 bg-white min-w-44 border-r border-gray-200">
                        Cliente
                      </th>
                      {adempimentiGiorno.map(a => (
                        <th key={a} className="px-3 py-2.5 text-xs font-medium text-gray-500 text-center border-l border-gray-100 whitespace-nowrap" title={a}>
                          {a.length > 28 ? a.slice(0, 26) + '…' : a}
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
                          <td className={`px-4 py-2.5 font-medium text-xs sticky left-0 border-r border-gray-200 ${rowBg}`}>
                            <span className={isCessazione ? 'text-amber-700' : 'text-gray-800'}>{cl.nome || cl.id}</span>
                            {isCessazione && (
                              <span className="ml-1.5 text-[10px] bg-amber-200 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold">cessazione</span>
                            )}
                          </td>
                          {adempimentiGiorno.map(a => {
                            const item = dayItems.find(i => i.clienteId === cl.id && i.adempimento === a);
                            return (
                              <td key={a} className="px-3 py-2 text-center border-l border-gray-100">
                                <CellaStato
                                  item={item}
                                  onUpdate={handleUpdate}
                                  updatingId={updatingId}
                                  locked={!isUnlocked}
                                />
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

      <style>{`
        @media print {
          body > * { display: none !important; }
          #root { display: block !important; }
          .print\\:hidden { display: none !important; }
          .print\\:break-inside-avoid { break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
