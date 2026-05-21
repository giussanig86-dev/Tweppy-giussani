import Button from '../../components/ui/Button';
import SharePointClienteLink from '../../components/ui/SharePointClienteLink';

function IconAlberoCartelle() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
      <path d="M3 3h6v4H3z"/>
      <path d="M6 7v4"/>
      <path d="M6 11h6"/>
      <path d="M6 11v6"/>
      <path d="M12 9h6v4h-6z"/>
      <path d="M12 15h6v4h-6z"/>
      <path d="M6 17h3"/>
    </svg>
  );
}

const STATO_BADGE = {
  attivo:         'bg-green-100 text-green-800',
  in_cessazione:  'bg-amber-100 text-amber-800',
  cessato:        'bg-red-100 text-red-600',
  inattivo:       'bg-gray-100 text-gray-600',
};

export default function ClienteTable({ clienti, onEdit, onDelete, onCreaCartelline, creatingFoldersId }) {
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
              <td className="px-4 py-3 font-medium">
                <div className="flex items-center gap-1.5">
                  {c.ragioneSociale}
                  <SharePointClienteLink nome={c.ragioneSociale} />
                </div>
              </td>
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
                {onCreaCartelline && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onCreaCartelline(c)}
                    disabled={creatingFoldersId === c.id}
                    title="Crea struttura cartelle SharePoint"
                  >
                    {creatingFoldersId === c.id
                      ? <span className="animate-spin inline-block">⏳</span>
                      : <IconAlberoCartelle />}
                  </Button>
                )}
                {onEdit && <Button size="sm" variant="secondary" onClick={() => onEdit(c)}>Modifica</Button>}
                {onDelete && <Button size="sm" variant="danger" onClick={() => onDelete(c.id)}>Elimina</Button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
