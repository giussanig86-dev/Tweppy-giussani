import { useState } from 'react';
import Button from '../../components/ui/Button';

const PLACEHOLDERS = ['ragioneSociale','codiceFiscale','partitaIva','email','pec','telefono',
  'referente','indirizzo','cap','comune','provincia','regimeFiscale','tipologiaCliente',
  'collaboratoreAssegnato','dataOggi'];

const EMPTY = { nome: '', oggetto: '', corpo: '' };

export default function TemplateForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({ ...EMPTY, ...initial });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function set(f, v) { setForm(p => ({ ...p, [f]: v })); }

  function inserisciSegnaposto(campo, placeholder) {
    const tag = `{{${placeholder}}}`;
    setForm(p => ({ ...p, [campo]: (p[campo] || '') + tag }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.nome.trim() || !form.oggetto.trim() || !form.corpo.trim()) {
      setError('Nome, oggetto e corpo sono obbligatori');
      return;
    }
    setSaving(true);
    try { await onSave(form); } catch (err) { setError(err.message); } finally { setSaving(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Nome template *</label>
        <input value={form.nome} onChange={e => set('nome', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-medium text-gray-600">Oggetto email *</label>
          <SegnapostoDropdown onSelect={p => inserisciSegnaposto('oggetto', p)} />
        </div>
        <input value={form.oggetto} onChange={e => set('oggetto', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-medium text-gray-600">Corpo email *</label>
          <SegnapostoDropdown onSelect={p => inserisciSegnaposto('corpo', p)} />
        </div>
        <textarea value={form.corpo} onChange={e => set('corpo', e.target.value)} rows={10}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-y font-mono text-xs" />
      </div>

      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-xs text-gray-500 font-medium mb-1">Segnaposti disponibili:</p>
        <div className="flex flex-wrap gap-1">
          {PLACEHOLDERS.map(p => (
            <span key={p} className="text-xs bg-white border rounded px-1.5 py-0.5 text-gray-600 font-mono">
              {`{{${p}}}`}
            </span>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Annulla</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Salvataggio...' : 'Salva Template'}</Button>
      </div>
    </form>
  );
}

function SegnapostoDropdown({ onSelect }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(p => !p)}
        className="text-xs text-brand-500 hover:text-brand-700">
        + inserisci segnaposto
      </button>
      {open && (
        <div className="absolute right-0 top-5 z-10 bg-white border rounded-lg shadow-lg p-2 w-52 max-h-48 overflow-y-auto">
          {PLACEHOLDERS.map(p => (
            <button key={p} type="button"
              className="block w-full text-left text-xs px-2 py-1 hover:bg-gray-50 rounded font-mono"
              onClick={() => { onSelect(p); setOpen(false); }}>
              {`{{${p}}}`}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
