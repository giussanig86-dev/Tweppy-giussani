import Button from '../../components/ui/Button';

const PRIORITY_BADGE = {
  alta: 'bg-red-100 text-red-700',
  media: 'bg-yellow-100 text-yellow-700',
  bassa: 'bg-green-100 text-green-700',
};

function formatDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function isOverdue(d) {
  if (!d) return false;
  return new Date(d) < new Date();
}

export default function TaskCard({ task, onEdit, onDelete, onDragStart }) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-2 cursor-grab active:cursor-grabbing hover:shadow-md transition"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-gray-800 leading-snug flex-1">{task.titolo}</p>
        {task.priorita && (
          <span className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${PRIORITY_BADGE[task.priorita] || 'bg-gray-100 text-gray-500'}`}>
            {task.priorita}
          </span>
        )}
      </div>

      {task.clienteNome && (
        <p className="text-xs text-gray-500 mt-1">{task.clienteNome}</p>
      )}

      <div className="flex items-center justify-between mt-2">
        <div className="text-xs text-gray-400 space-y-0.5">
          {task.assegnato && <div>→ {task.assegnato}</div>}
          {task.scadenza && (
            <div className={isOverdue(task.scadenza) ? 'text-red-500 font-medium' : ''}>
              {formatDate(task.scadenza)}
            </div>
          )}
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="secondary" className="!px-2 !py-1 text-xs" onClick={onEdit}>✏️</Button>
          <Button size="sm" variant="danger" className="!px-2 !py-1 text-xs" onClick={onDelete}>✕</Button>
        </div>
      </div>
    </div>
  );
}
