import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/useAuth';
import { templatesApi } from '../../api/templates';
import TemplateForm from './TemplateForm';
import InvioMassivo from './InvioMassivo';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';

const TABS = ['Libreria Template', 'Invio Massivo'];

export default function TemplatesPage() {
  const { getToken } = useAuth();
  const [tab, setTab] = useState(0);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);

  async function load() {
    try {
      setLoading(true);
      const token = await getToken();
      setTemplates(await templatesApi.list(token));
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function openNew() { setSelected(null); setModalOpen(true); }
  function openEdit(t) { setSelected(t); setModalOpen(true); }
  function closeModal() { setModalOpen(false); setSelected(null); }

  async function handleSave(data) {
    const token = await getToken();
    if (selected) await templatesApi.update(token, selected.id, data);
    else await templatesApi.create(token, data);
    closeModal();
    load();
  }

  async function handleDelete(id) {
    if (!confirm('Eliminare il template?')) return;
    const token = await getToken();
    await templatesApi.remove(token, id);
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Template Manager</h1>

      <div className="flex border-b mb-6">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition -mb-px
              ${tab === i ? 'border-brand-500 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-500">{templates.length} template salvati</p>
            <Button onClick={openNew}>+ Nuovo Template</Button>
          </div>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          {loading ? <p className="text-gray-500">Caricamento...</p> : (
            templates.length === 0 ? (
              <div className="text-center py-16 text-gray-300">
                <p className="text-lg">Nessun template. Creane uno per iniziare.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {templates.map(t => (
                  <div key={t.id} className="bg-white rounded-xl border p-4 flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">{t.nome}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{t.oggetto}</p>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2 font-mono">{t.corpo?.slice(0, 100)}...</p>
                    </div>
                    <div className="flex gap-2 shrink-0 ml-4">
                      <Button size="sm" variant="secondary" onClick={() => openEdit(t)}>Modifica</Button>
                      <Button size="sm" variant="danger" onClick={() => handleDelete(t.id)}>Elimina</Button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}

      {tab === 1 && <InvioMassivo templates={templates} />}

      <Modal open={modalOpen} onClose={closeModal} title={selected ? 'Modifica Template' : 'Nuovo Template'}>
        <TemplateForm initial={selected} onSave={handleSave} onCancel={closeModal} />
      </Modal>
    </div>
  );
}
