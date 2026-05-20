import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/useAuth';
import { tasksApi } from '../../api/tasks';
import TaskList from './TaskList';
import TaskChat from './TaskChat';
import TaskForm from './TaskForm';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';

export default function TasksPage() {
  const { getToken } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filterAssegnato, setFilterAssegnato] = useState('');
  const [showCompletati, setShowCompletati] = useState(false);

  async function loadTasks() {
    try {
      setLoading(true);
      const token = await getToken();
      setTasks(await tasksApi.list(token));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadTasks(); }, []);

  function openNew() { setEditing({}); setModalOpen(true); }
  function openEdit(task) { setEditing(task); setModalOpen(true); }
  function closeModal() { setModalOpen(false); setEditing(null); }

  async function handleSave(data) {
    const token = await getToken();
    if (editing?.id) {
      await tasksApi.update(token, editing.id, data);
    } else {
      await tasksApi.create(token, data);
    }
    closeModal();
    loadTasks();
  }

  async function handleDelete(id) {
    if (!confirm('Eliminare il task?')) return;
    const token = await getToken();
    if (selectedTask?.id === id) setSelectedTask(null);
    await tasksApi.remove(token, id);
    loadTasks();
  }

  const assegnati = [...new Set(tasks.map((t) => t.assegnato).filter(Boolean))];

  let filtered = showCompletati ? tasks : tasks.filter((t) => t.stato !== 'completato');
  if (filterAssegnato) filtered = filtered.filter((t) => t.assegnato === filterAssegnato);

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h1 className="text-2xl font-bold">Task Management</h1>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-sm text-gray-500 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showCompletati}
              onChange={(e) => setShowCompletati(e.target.checked)}
              className="rounded"
            />
            Mostra completati
          </label>
          <Button onClick={openNew}>+ Nuovo Task</Button>
        </div>
      </div>

      {assegnati.length > 0 && (
        <div className="mb-3 flex gap-2 items-center shrink-0">
          <span className="text-sm text-gray-500">Filtra per:</span>
          <button
            onClick={() => setFilterAssegnato('')}
            className={`text-xs px-2 py-1 rounded-full border transition
              ${!filterAssegnato ? 'bg-brand-500 text-white border-brand-500' : 'border-gray-300 text-gray-600 hover:border-gray-400'}`}
          >
            Tutti
          </button>
          {assegnati.map((a) => (
            <button
              key={a}
              onClick={() => setFilterAssegnato(a)}
              className={`text-xs px-2 py-1 rounded-full border transition
                ${filterAssegnato === a ? 'bg-brand-500 text-white border-brand-500' : 'border-gray-300 text-gray-600 hover:border-gray-400'}`}
            >
              {a}
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-red-500 text-sm mb-2 shrink-0">{error}</p>}

      {loading ? (
        <p className="text-sm text-gray-400">Caricamento...</p>
      ) : (
        <div className="flex gap-4 flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto pr-1">
            <TaskList
              tasks={filtered}
              onEdit={openEdit}
              onDelete={handleDelete}
              onSelect={setSelectedTask}
              selectedId={selectedTask?.id}
            />
          </div>
          <div className="w-80 shrink-0">
            <TaskChat task={selectedTask} />
          </div>
        </div>
      )}

      <Modal open={modalOpen} title={editing?.id ? 'Modifica Task' : 'Nuovo Task'} onClose={closeModal}>
        {editing !== null && (
          <TaskForm initial={editing} onSave={handleSave} onCancel={closeModal} />
        )}
      </Modal>
    </div>
  );
}
