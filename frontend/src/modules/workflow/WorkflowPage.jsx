import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/useAuth';
import { anagraficaApi } from '../../api/anagrafica';
import { workflowApi } from '../../api/workflow';
import WorkflowBuilder from './WorkflowBuilder';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';

const TIPO_ICON = { task: '✅', documento: '📄', email: '📤' };
const STEP_STATO = { ok: 'bg-green-100 text-green-700', errore: 'bg-red-100 text-red-700' };

export default function WorkflowPage() {
  const { getToken } = useAuth();
  const [workflows, setWorkflows] = useState([]);
  const [clienti, setClienti] = useState([]);
  const [loading, setLoading] = useState(true);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [avvioModal, setAvvioModal] = useState(null); // workflow selezionato per avvio
  const [clienteId, setClienteId] = useState('');
  const [esecuzione, setEsecuzione] = useState(null); // risultati esecuzione
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);

  async function load() {
    try {
      setLoading(true);
      const token = await getToken();
      const [wf, cl] = await Promise.all([workflowApi.list(token), anagraficaApi.list(token)]);
      setWorkflows(wf);
      setClienti(cl);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleSaveWorkflow(data) {
    const token = await getToken();
    if (editingWorkflow?.id) await workflowApi.update(token, editingWorkflow.id, data);
    else await workflowApi.create(token, data);
    setBuilderOpen(false); setEditingWorkflow(null);
    load();
  }

  async function handleDelete(id) {
    if (!confirm('Eliminare il workflow?')) return;
    const token = await getToken();
    await workflowApi.remove(token, id);
    load();
  }

  async function handleEsegui() {
    const cliente = clienti.find(c => c.id === clienteId);
    if (!cliente) return;
    setRunning(true); setEsecuzione(null); setError(null);
    try {
      const token = await getToken();
      const res = await workflowApi.esegui(token, avvioModal.id, cliente);
      setEsecuzione(res);
    } catch (e) { setError(e.message); } finally { setRunning(false); }
  }

  function openBuilder(wf = null) { setEditingWorkflow(wf); setBuilderOpen(true); }
  function closeAvvio() { setAvvioModal(null); setClienteId(''); setEsecuzione(null); setError(null); }

  const predefiniti = workflows.filter(w => w.predefinito);
  const custom = workflows.filter(w => !w.predefinito);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Workflow Engine</h1>
        <Button onClick={() => openBuilder()}>+ Nuovo Workflow</Button>
      </div>

      {loading ? <p className="text-gray-500">Caricamento...</p> : (
        <div className="space-y-6">
          {/* Workflow predefiniti */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Workflow Predefiniti</h2>
            <div className="grid grid-cols-1 gap-4">
              {predefiniti.map(wf => (
                <WorkflowCard key={wf.id} wf={wf} onAvvia={() => { setAvvioModal(wf); setEsecuzione(null); }} predefinito />
              ))}
            </div>
          </div>

          {/* Workflow custom */}
          {custom.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Workflow Personalizzati</h2>
              <div className="grid grid-cols-1 gap-4">
                {custom.map(wf => (
                  <WorkflowCard key={wf.id} wf={wf}
                    onAvvia={() => { setAvvioModal(wf); setEsecuzione(null); }}
                    onEdit={() => openBuilder(wf)}
                    onDelete={() => handleDelete(wf.id)} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal avvio */}
      <Modal open={!!avvioModal} onClose={closeAvvio} title={`Avvia: ${avvioModal?.nome}`}>
        {!esecuzione ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">{avvioModal?.descrizione}</p>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Cliente *</label>
              <select value={clienteId} onChange={e => setClienteId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="">— seleziona cliente —</option>
                {clienti.map(c => <option key={c.id} value={c.id}>{c.ragioneSociale}</option>)}
              </select>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-medium text-gray-600 mb-2">Steps che verranno eseguiti:</p>
              <div className="space-y-1">
                {(avvioModal?.steps || []).map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                    <span>{TIPO_ICON[s.tipo]}</span>
                    <span>{s.titolo || s.templateId || s.emailTemplateNome}</span>
                    {s.assegnato && <span className="text-gray-400">→ {s.assegnato}</span>}
                  </div>
                ))}
              </div>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={closeAvvio}>Annulla</Button>
              <Button onClick={handleEsegui} disabled={!clienteId || running}>
                {running ? 'Esecuzione in corso...' : 'Avvia Workflow'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="font-semibold text-gray-800">Workflow completato</p>
            <div className="space-y-2">
              {esecuzione.risultati.map((r, i) => (
                <div key={i} className={`flex items-start gap-3 p-2 rounded-lg border text-sm ${STEP_STATO[r.stato]}`}>
                  <span>{TIPO_ICON[r.tipo]}</span>
                  <div className="flex-1">
                    <span className="font-medium">{r.stato === 'ok' ? r.dettaglio : r.errore}</span>
                  </div>
                  <span className="text-xs font-bold uppercase">{r.stato}</span>
                </div>
              ))}
            </div>
            <Button onClick={closeAvvio}>Chiudi</Button>
          </div>
        )}
      </Modal>

      {/* Modal builder */}
      <Modal open={builderOpen} onClose={() => { setBuilderOpen(false); setEditingWorkflow(null); }}
        title={editingWorkflow ? 'Modifica Workflow' : 'Nuovo Workflow'}>
        <WorkflowBuilder
          initial={editingWorkflow}
          onSave={handleSaveWorkflow}
          onCancel={() => { setBuilderOpen(false); setEditingWorkflow(null); }}
        />
      </Modal>
    </div>
  );
}

function WorkflowCard({ wf, onAvvia, onEdit, onDelete, predefinito }) {
  const steps = wf.steps || [];
  const taskCount = steps.filter(s => s.tipo === 'task').length;
  const docCount = steps.filter(s => s.tipo === 'documento').length;
  const emailCount = steps.filter(s => s.tipo === 'email').length;

  return (
    <div className="bg-white rounded-xl border p-5 flex items-start justify-between gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-gray-800">{wf.nome}</h3>
          {predefinito && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">predefinito</span>}
        </div>
        <p className="text-sm text-gray-500 mb-3">{wf.descrizione}</p>
        <div className="flex gap-3 text-xs text-gray-400">
          <span>{steps.length} step{steps.length !== 1 ? 's' : ''}</span>
          {taskCount > 0 && <span>✅ {taskCount} task</span>}
          {docCount > 0 && <span>📄 {docCount} doc</span>}
          {emailCount > 0 && <span>📤 {emailCount} email</span>}
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <Button size="sm" onClick={onAvvia}>Avvia</Button>
        {!predefinito && onEdit && <Button size="sm" variant="secondary" onClick={onEdit}>Modifica</Button>}
        {!predefinito && onDelete && <Button size="sm" variant="danger" onClick={onDelete}>Elimina</Button>}
      </div>
    </div>
  );
}
