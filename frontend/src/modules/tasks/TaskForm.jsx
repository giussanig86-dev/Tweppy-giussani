import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/useAuth';
import { anagraficaApi } from '../../api/anagrafica';
import Button from '../../components/ui/Button';

const EMPTY = {
  titolo: '', descrizione: '', clienteId: '', clienteNome: '',
  assegnato: '', scadenza: '', priorita: 'media', stato: 'da_fare', note: '',
};

export default function TaskForm({ initial, onSave, onCancel }) {
  const { getToken } = useAuth();
  const [form, setForm] = useState({ ...EMPTY, ...initial });
  const [clienti, setClienti] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getToken().then((t) => anagraficaApi.list(t).then(setClienti).catch(() => {}));
  }, []);

  function set(field, value) { setForm((p) => ({ ...p, [field]: value })); }

  function handleClienteChange(e) {
    const id = e.target.value;
    const c = clienti.find((c) => c.id === id);
    set('clienteId', id);
    set('clienteNome', c?.ragioneSociale || '');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.titolo.trim()) { setError('Titolo obbligatorio'); return; }
    setSaving(true);
    try { await onSave(form); } catch (err) { setError(err.message); } finally { setSaving(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Titolo *</label>
        <input
          value={form.titolo}
          onChange={(e) => set('titolo', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Cliente</label>
          <select
            value={form.clienteId}
            onChange={handleClienteChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">— nessuno —</option>
            {clienti.map((c) => <option key={c.id} value={c.id}>{c.ragioneSociale}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Assegnato a</label>
          <input
            value={form.assegnato}
            onChange={(e) => set('assegnato', e.target.value)}
            placeholder="es. Laura"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Scadenza</label>
          <input
            type="date"
            value={form.scadenza}
            onChange={(e) => set('scadenza', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Priorità</label>
          <select
            value={form.priorita}
            onChange={(e) => set('priorita', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="bassa">Bassa</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Stato</label>
          <select
            value={form.stato}
            onChange={(e) => set('stato', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="da_fare">Da Fare</option>
            <option value="in_lavorazione">In Lavorazione</option>
            <option value="completato">Completato</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Descrizione</label>
        <textarea
          value={form.descrizione}
          onChange={(e) => set('descrizione', e.target.value)}
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel}>Annulla</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Salvataggio...' : 'Salva'}</Button>
      </div>
    </form>
  );
}
