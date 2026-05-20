import { useState } from 'react';

const STATI_CICLO = ['da_fare', 'fatto', 'comunicato', 'da_non_fare'];
const STATO_STYLE = {
  da_fare:      { bg: 'bg-gray-100 text-gray-600 hover:bg-gray-200',   label: 'Da fare' },
  fatto:        { bg: 'bg-green-100 text-green-700 hover:bg-green-200', label: 'Fatto' },
  da_non_fare:  { bg: 'bg-red-100 text-red-600 hover:bg-red-200',      label: 'Da non fare' },
  comunicato:   { bg: 'bg-blue-100 text-blue-700 hover:bg-blue-200',   label: 'Comunicato' },
};

function isScaduto(scadenza, stato) {
  return stato === 'da_fare' && new Date(scadenza) < new Date();
}

function formatData(d) {
  if (!d) return '';
  const [y, m, g] = d.split('-');
  return `${g}/${m}/${y}`;
}

export default function ChecklistTable({ items, onStatoChange }) {
  const [openCategorie, setOpenCategorie] = useState({});

  const categorie = [...new Set(items.map((i) => i.categoria))];

  function toggleCategoria(cat) {
    setOpenCategorie((p) => ({ ...p, [cat]: !p[cat] }));
  }

  function advanceStato(item) {
    const idx = STATI_CICLO.indexOf(item.stato);
    const next = STATI_CICLO[(idx + 1) % STATI_CICLO.length];
    onStatoChange(item.id, next, item.note);
  }

  function statsPerCategoria(cat) {
    const catItems = items.filter((i) => i.categoria === cat);
    const done = catItems.filter((i) => i.stato === 'fatto').length;
    return { tot: catItems.length, done };
  }

  return (
    <div className="space-y-3">
      {categorie.map((cat) => {
        const { tot, done } = statsPerCategoria(cat);
        const isOpen = openCategorie[cat] !== false;
        const pct = Math.round((done / tot) * 100);
        const catItems = items.filter((i) => i.categoria === cat);

        return (
          <div key={cat} className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition"
              onClick={() => toggleCategoria(cat)}
            >
              <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-800">{cat}</span>
                <span className="text-xs text-gray-400">{done}/{tot}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-24 bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${pct === 100 ? 'bg-green-500' : 'bg-brand-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
                <span className="text-gray-400 text-xs">{isOpen ? '▲' : '▼'}</span>
              </div>
            </button>

            {isOpen && (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-5 py-2 text-left w-36">Scadenza</th>
                    <th className="px-5 py-2 text-left">Adempimento</th>
                    <th className="px-5 py-2 text-left">Note</th>
                    <th className="px-5 py-2 text-left w-36">Stato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {catItems.map((item) => {
                    const scad = isScaduto(item.scadenza, item.stato);
                    return (
                      <tr key={item.id} className={scad ? 'bg-red-50' : 'hover:bg-gray-50'}>
                        <td className={`px-5 py-2.5 font-mono text-xs ${scad ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                          {formatData(item.scadenza)}
                          {scad && <span className="ml-1 text-red-500">!</span>}
                        </td>
                        <td className="px-5 py-2.5 font-medium text-gray-800">{item.adempimento}</td>
                        <td className="px-5 py-2.5 text-gray-400 text-xs">{item.note}</td>
                        <td className="px-5 py-2.5">
                          <button
                            onClick={() => advanceStato(item)}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium transition cursor-pointer ${STATO_STYLE[item.stato]?.bg || STATO_STYLE.da_fare.bg}`}
                          >
                            {STATO_STYLE[item.stato]?.label || 'Da fare'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        );
      })}
    </div>
  );
}
