import { useState } from 'react';
import Button from '../../components/ui/Button';

const TIPO_ICONS = { task: '✅', documento: '📄', email: '📤' };
const DOC_TEMPLATES = [
  { id: 'mandato', nome: 'Mandato Professionale' },
  { id: 'privacy', nome: 'Informativa Privacy GDPR' },
  { id: 'benvenuto', nome: 'Lettera di Benvenuto' },
  { id: 'richiesta_documenti', nome: 'Richiesta Documenti' },
];

function StepRow({ step, idx, onUpdate, onDelete, onDragStart, onDragOver, onDrop }) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => { e.preventDefault(); onDragOver(); }}
      onDrop={onDrop}
      className="flex gap-3 items-start bg-white border rounded-lg p-3 cursor-grab active:cursor-grabbing hover:shadow-sm transition"
    >
      <span className="text-gray-400 text-xs mt-2 select-none">⠿</span>
      <span className="mt-1.5 text-base">{TIPO_ICONS[step.tipo] || '•'}</span>

      <div className="flex-1 grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">Tipo</label>
          <select value={step.tipo} onChange={e => onUpdate({ tipo: e.target.value, titolo: '', templateId: '', emailTemplateNome: '' })}
            className="w-full border border-gray-200 rounded px-2 py-1 text-xs bg-white">
            <option value="task">Task</option>
            <option value="documento">Documento</option>
            <option value="email">Email</option>
          </select>
        </div>

        {step.tipo === 'task' && (
          <>
            <div>
              <label className="block text-xs text-gray-500 mb-0.5">Titolo *</label>
              <input value={step.titolo || ''} onChange={e => onUpdate({ titolo: e.target.value })}
                className="w-full border border-gray-200 rounded px-2 py-1 text-xs" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-0.5">Assegnato a</label>
              <input value={step.assegnato || ''} onChange={e => onUpdate({ assegnato: e.target.value })}
                placeholder="es. Laura"
                className="w-full border border-gray-200 rounded px-2 py-1 text-xs" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-0.5">Priorità</label>
              <select value={step.priorita || 'media'} onChange={e => onUpdate({ priorita: e.target.value })}
                className="w-full border border-gray-200 rounded px-2 py-1 text-xs bg-white">
                <option value="bassa">Bassa</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
              </select>
            </div>
          </>
        )}

        {step.tipo === 'documento' && (
          <div>
            <label className="block text-xs text-gray-500 mb-0.5">Template</label>
            <select value={step.templateId || ''} onChange={e => onUpdate({ templateId: e.target.value })}
              className="w-full border border-gray-200 rounded px-2 py-1 text-xs bg-white">
              <option value="">— seleziona —</option>
              {DOC_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          </div>
        )}

        {step.tipo === 'email' && (
          <div>
            <label className="block text-xs text-gray-500 mb-0.5">Nome template email</label>
            <input value={step.emailTemplateNome || ''} onChange={e => onUpdate({ emailTemplateNome: e.target.value })}
              placeholder="es. Lettera di Benvenuto"
              className="w-full border border-gray-200 rounded px-2 py-1 text-xs" />
            <p className="text-xs text-gray-400 mt-0.5">Deve corrispondere a un template in Template Manager</p>
          </div>
        )}
      </div>

      <button onClick={onDelete} className="text-gray-300 hover:text-red-400 mt-1 text-lg leading-none transition">✕</button>
    </div>
  );
}

export default function WorkflowBuilder({ initial, onSave, onCancel }) {
  const [nome, setNome] = useState(initial?.nome || '');
  const [descrizione, setDescrizione] = useState(initial?.descrizione || '');
  const [steps, setSteps] = useState(initial?.steps || []);
  const [dragging, setDragging] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function addStep() {
    setSteps(p => [...p, { id: Date.now(), tipo: 'task', titolo: '', assegnato: '', priorita: 'media' }]);
  }

  function updateStep(idx, patch) {
    setSteps(p => p.map((s, i) => i === idx ? { ...s, ...patch } : s));
  }

  function deleteStep(idx) {
    setSteps(p => p.filter((_, i) => i !== idx));
  }

  function handleDrop(targetIdx) {
    if (dragging === null || dragging === targetIdx) return;
    setSteps(p => {
      const arr = [...p];
      const [item] = arr.splice(dragging, 1);
      arr.splice(targetIdx, 0, item);
      return arr.map((s, i) => ({ ...s, id: i + 1 }));
    });
    setDragging(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!nome.trim()) { setError('Nome obbligatorio'); return; }
    if (steps.length === 0) { setError('Almeno uno step obbligatorio'); return; }
    setSaving(true);
    try { await onSave({ nome, descrizione, steps }); } catch (err) { setError(err.message); } finally { setSaving(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Nome workflow *</label>
          <input value={nome} onChange={e => setNome(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Descrizione</label>
          <input value={descrizione} onChange={e => setDescrizione(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-gray-600">Steps ({steps.length})</label>
          <span className="text-xs text-gray-400">Trascina per riordinare</span>
        </div>
        <div className="space-y-2">
          {steps.map((step, idx) => (
            <StepRow
              key={step.id || idx}
              step={step}
              idx={idx}
              onUpdate={patch => updateStep(idx, patch)}
              onDelete={() => deleteStep(idx)}
              onDragStart={() => setDragging(idx)}
              onDragOver={() => {}}
              onDrop={() => handleDrop(idx)}
            />
          ))}
        </div>
        <button type="button" onClick={addStep}
          className="mt-2 w-full py-2 text-sm text-gray-400 hover:text-gray-600 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition">
          + Aggiungi step
        </button>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Annulla</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Salvataggio...' : 'Salva Workflow'}</Button>
      </div>
    </form>
  );
}
