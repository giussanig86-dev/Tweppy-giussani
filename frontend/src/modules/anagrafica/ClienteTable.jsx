import Button from '../../components/ui/Button';

const STATO_BADGE = {
  attivo:         'bg-green-100 text-green-800',
  in_cessazione:  'bg-amber-100 text-amber-800',
  cessato:        'bg-red-100 text-red-600',
  inattivo:       'bg-gray-100 text-gray-600',
};

export default function ClienteTable({ clienti, onEdit, onDelete }) {
  if (clienti.length === 0) {
    return <p className="text-gray-400 text-sm py-8 text-center">Nessun cliente trovato.</p>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
          <tr>
            <th className="px-4 py-3 text-left">Ragione Sociale</th>
            <th className="px-4 py-3 text-left">CF / P.IVA</th>
            <th className="px-4 py-3 text-left">Regime</th>
            <th className="px-4 py-3 text-left">Tipo</th>
            <th className="px-4 py-3 text-left">Stato</th>
            <th className="px-4 py-3 text-left">Referente</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {clienti.map((c) => (
            <tr key={c.id} className={`hover:bg-gray-50 ${c.stato === 'cessato' ? 'opacity-60' : ''} ${c.stato === 'in_cessazione' ? 'bg-amber-50/30' : ''}`}>
              <td className="px-4 py-3 font-medium">{c.ragioneSociale}</td>
              <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                {c.codiceFiscale && <div>{c.codiceFiscale}</div>}
                {c.partitaIva && <div>{c.partitaIva}</div>}
              </td>
              <td className="px-4 py-3 text-gray-600">{c.regimeFiscale}</td>
              <td className="px-4 py-3 text-gray-600 capitalize">{c.tipologiaCliente}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATO_BADGE[c.stato] || 'bg-gray-100 text-gray-600'}`}>
                  {(c.stato || '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-600">{c.referente}</td>
              <td className="px-4 py-3 flex gap-2 justify-end">
                <Button size="sm" variant="secondary" onClick={() => onEdit(c)}>Modifica</Button>
                <Button size="sm" variant="danger" onClick={() => onDelete(c.id)}>Elimina</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
