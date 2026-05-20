import Button from '../../components/ui/Button';

const PRIORITY_BADGE = {
  alta: 'bg-red-100 text-red-700',
  media: 'bg-yellow-100 text-yellow-700',
  bassa: 'bg-green-100 text-green-700',
};

const STATO_BADGE = {
  da_fare: 'bg-gray-100 text-gray-600',
  in_lavorazione: 'bg-blue-100 text-blue-700',
  completato: 'bg-green-100 text-green-700',
};

const STATO_LABEL = {
  da_fare: 'Da fare',
  in_lavorazione: 'In lavorazione',
  completato: 'Completato',
};

function formatDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function isOverdue(task) {
  if (!task.scadenza || task.stato === 'completato') return false;
  return new Date(task.scadenza) < new Date();
}

export default function TaskList({ tasks, onEdit, onDelete, onSelect, selectedId }) {
  const sorted = [...tasks].sort((a, b) => {
    const da = a.scadenza ? new Date(a.scadenza) : Infinity;
    const db = b.scadenza ? new Date(b.scadenza) : Infinity;
    if (da !== db) return da - db;
    return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
  });

  if (!sorted.length) {
    return <p className="text-sm text-gray-400 text-center py-12">Nessun task attivo.</p>;
  }

  return (
    <div className="space-y-1.5">
      {sorted.map((task) => {
        const selected = task.id === selectedId;
        const overdue = isOverdue(task);
        return (
          <div
            key={task.id}
            onClick={() => onSelect(task)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition
              ${selected
                ? 'border-brand-500 bg-brand-50 shadow-sm'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'}`}
          >
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATO_BADGE[task.stato] || 'bg-gray-100 text-gray-500'}`}>
              {STATO_LABEL[task.stato] || task.stato}
            </span>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{task.titolo}</p>
              {task.clienteNome && (
                <p className="text-xs text-gray-400 truncate">{task.clienteNome}</p>
              )}
            </div>

            {task.assegnato && (
              <span className="text-xs text-gray-500 shrink-0">{task.assegnato}</span>
            )}

            {task.scadenza && (
              <span className={`text-xs font-medium shrink-0 ${overdue ? 'text-red-500' : 'text-gray-400'}`}>
                {overdue ? '⚠ ' : ''}{formatDate(task.scadenza)}
              </span>
            )}

            {task.priorita && (
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${PRIORITY_BADGE[task.priorita] || 'bg-gray-100 text-gray-500'}`}>
                {task.priorita}
              </span>
            )}

            <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
              <Button size="sm" variant="secondary" className="!px-2 !py-1 text-xs" onClick={() => onEdit(task)}>✏️</Button>
              <Button size="sm" variant="danger" className="!px-2 !py-1 text-xs" onClick={() => onDelete(task.id)}>✕</Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
