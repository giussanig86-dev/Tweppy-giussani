import { useState } from 'react';
import TaskCard from './TaskCard';

const COLUMNS = [
  { stato: 'da_fare', label: 'Da Fare', color: 'bg-gray-100', border: 'border-gray-200' },
  { stato: 'in_lavorazione', label: 'In Lavorazione', color: 'bg-blue-50', border: 'border-blue-200' },
  { stato: 'completato', label: 'Completato', color: 'bg-green-50', border: 'border-green-200' },
];

export default function TaskKanban({ tasks, onEdit, onDelete, onMove, onNewInColumn }) {
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  function handleDragStart(task) { setDragging(task); }
  function handleDragOver(e, stato) { e.preventDefault(); setDragOver(stato); }
  function handleDragLeave() { setDragOver(null); }
  function handleDrop(stato) {
    if (dragging && dragging.stato !== stato) onMove(dragging.id, stato);
    setDragging(null);
    setDragOver(null);
  }

  return (
    <div className="flex gap-4 items-start">
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.stato === col.stato);
        const isOver = dragOver === col.stato;

        return (
          <div
            key={col.stato}
            className={`flex-1 rounded-xl border ${col.border} ${col.color} p-3 min-h-64 transition ${isOver ? 'ring-2 ring-brand-500' : ''}`}
            onDragOver={(e) => handleDragOver(e, col.stato)}
            onDragLeave={handleDragLeave}
            onDrop={() => handleDrop(col.stato)}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">{col.label}</h3>
              <span className="text-xs bg-white border rounded-full px-2 py-0.5 text-gray-500">
                {colTasks.length}
              </span>
            </div>

            {colTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onDragStart={() => handleDragStart(task)}
                onEdit={() => onEdit(task)}
                onDelete={() => onDelete(task.id)}
              />
            ))}

            <button
              onClick={() => onNewInColumn(col.stato)}
              className="w-full mt-1 py-1.5 text-xs text-gray-400 hover:text-gray-600 hover:bg-white/60 rounded-lg transition border border-dashed border-gray-300 hover:border-gray-400"
            >
              + Aggiungi task
            </button>
          </div>
        );
      })}
    </div>
  );
}
