import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/useAuth';
import { anagraficaApi } from '../../api/anagrafica';
import ClienteTable from './ClienteTable';
import ClienteForm from './ClienteForm';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';

export default function AnagraficaPage() {
  const { getToken } = useAuth();
  const [clienti, setClienti] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  async function loadClienti() {
    try {
      setLoading(true);
      const token = await getToken();
      const data = await anagraficaApi.list(token);
      setClienti(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadClienti(); }, []);

  function openNew() { setSelected(null); setModalOpen(true); }
  function openEdit(cliente) { setSelected(cliente); setModalOpen(true); }
  function closeModal() { setModalOpen(false); setSelected(null); }

  async function handleSave(data) {
    const token = await getToken();
    if (selected) {
      await anagraficaApi.update(token, selected.id, data);
    } else {
      await anagraficaApi.create(token, data);
    }
    closeModal();
    loadClienti();
  }

  async function handleDelete(id) {
    if (!confirm('Eliminare il cliente? Resterà nello storico.')) return;
    const token = await getToken();
    await anagraficaApi.remove(token, id);
    loadClienti();
  }

  const filtered = clienti.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.ragioneSociale?.toLowerCase().includes(q) ||
      c.codiceFiscale?.toLowerCase().includes(q) ||
      c.partitaIva?.includes(q)
    );
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Anagrafica Clienti</h1>
        <Button onClick={openNew}>+ Nuovo Cliente</Button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Cerca per ragione sociale, CF o P.IVA..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}

      {loading ? (
        <p className="text-gray-500">Caricamento...</p>
      ) : (
        <ClienteTable clienti={filtered} onEdit={openEdit} onDelete={handleDelete} />
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={selected ? 'Modifica Cliente' : 'Nuovo Cliente'}
      >
        <ClienteForm
          initial={selected}
          onSave={handleSave}
          onCancel={closeModal}
        />
      </Modal>
    </div>
  );
}
