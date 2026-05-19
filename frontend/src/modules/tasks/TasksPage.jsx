import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/useAuth';
import { tasksApi } from '../../api/tasks';
import TaskKanban from './TaskKanban';
import TaskForm from './TaskForm';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';

export default function TasksPage() {
  const { getToken } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [filterAssegnato, setFilterAssegnato] = useState('');

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

  function openNew(stato = 'da_fare') {
    setSelected({ stato });
    setModalOpen(true);
  }

  function openEdit(task) { setSelected(task); setModalOpen(true); }
  function closeModal() { setModalOpen(false); setSelected(null); }

  async function handleSave(data) {
    const token = await getToken();
    if (selected?.id) {
      await tasksApi.update(token, selected.id, data);
    } else {
      await tasksApi.create(token, data);
    }
    closeModal();
    loadTasks();
  }

  async function handleDelete(id) {
    if (!confirm('Eliminare il task?')) return;
    const token = await getToken();
    await tasksApi.remove(token, id);
    loadTasks();
  }

  async function handleMove(id, nuovoStato) {
    const token = await getToken();
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, stato: nuovoStato } : t));
    await tasksApi.update(token, id, { stato: nuovoStato });
  }

  const assegnati = [...new Set(tasks.map((t) => t.assegnato).filter(Boolean))];
  const filtered = filterAssegnato
    ? tasks.filter((t) => t.assegnato === filterAssegnato)
    : tasks;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Task Management</h1>
        <Button onClick={() => openNew()}>+ Nuovo Task</Button>
      </div>

      {assegnati.length > 0 && (
        <div className="mb-4 flex gap-2 items-center">
          <span className="text-sm text-gray-500">Filtra per:</span>
          <button
            onClick={() => setFilterAssegnato('')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition ${!filterAssegnato ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Tutti
          </button>
          {assegnati.map((a) => (
            <button
              key={a}
              onClick={() => setFilterAssegnato(a)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition ${filterAssegnato === a ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {a}
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}

      {loading ? (
        <p className="text-gray-500">Caricamento...</p>
      ) : (
        <TaskKanban
          tasks={filtered}
          onEdit={openEdit}
          onDelete={handleDelete}
          onMove={handleMove}
          onNewInColumn={openNew}
        />
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={selected?.id ? 'Modifica Task' : 'Nuovo Task'}
      >
        <TaskForm initial={selected} onSave={handleSave} onCancel={closeModal} />
      </Modal>
    </div>
  );
}
