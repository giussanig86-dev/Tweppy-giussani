import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/useAuth';
import { anagraficaApi } from '../../api/anagrafica';
import Button from '../../components/ui/Button';

const TIPI = ['riunione', 'appuntamento', 'udienza', 'scadenza', 'altro'];

function toLocalDT(isoOrDate) {
  if (!isoOrDate) return '';
  const d = new Date(isoOrDate);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const EMPTY = { titolo: '', tipo: 'appuntamento', clienteId: '', clienteNome: '', inizio: '', fine: '', note: '', partecipanti: '', creaMeeting: false };

export default function EventoForm({ initial, selectedDate, onSave, onCancel, onDelete }) {
  const { getToken } = useAuth();
  const [form, setForm] = useState(() => {
    if (initial) {
      return {
        ...EMPTY,
        ...initial,
        inizio: toLocalDT(initial.start?.dateTime || initial.inizio),
        fine: toLocalDT(initial.end?.dateTime || initial.fine),
        titolo: initial.subject || initial.titolo || '',
        tipo: initial.categories?.[0] || initial.tipo || 'appuntamento',
        partecipanti: (initial.attendees?.map(a => a.emailAddress?.address) || initial.partecipanti || []).join(', '),
      };
    }
    const base = selectedDate ? `${selectedDate}T09:00` : '';
    const fine = selectedDate ? `${selectedDate}T10:00` : '';
    return { ...EMPTY, inizio: base, fine };
  });
  const [clienti, setClienti] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getToken().then(t => anagraficaApi.list(t).then(setClienti).catch(() => {}));
  }, []);

  function set(f, v) { setForm(p => ({ ...p, [f]: v })); }

  function handleClienteChange(e) {
    const id = e.target.value;
    const c = clienti.find(c => c.id === id);
    set('clienteId', id);
    set('clienteNome', c?.ragioneSociale || '');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.titolo.trim() || !form.inizio || !form.fine) { setError('Titolo, inizio e fine obbligatori'); return; }
    setSaving(true);
    try {
      await onSave({
        ...form,
        partecipanti: form.partecipanti ? form.partecipanti.split(',').map(s => s.trim()).filter(Boolean) : [],
      });
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Titolo *</label>
          <input value={form.titolo} onChange={e => set('titolo', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
          <select value={form.tipo} onChange={e => set('tipo', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500">
            {TIPI.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Cliente</label>
          <select value={form.clienteId} onChange={handleClienteChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option value="">— nessuno —</option>
            {clienti.map(c => <option key={c.id} value={c.id}>{c.ragioneSociale}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Inizio *</label>
          <input type="datetime-local" value={form.inizio} onChange={e => set('inizio', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Fine *</label>
          <input type="datetime-local" value={form.fine} onChange={e => set('fine', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Partecipanti (email separate da virgola)</label>
          <input value={form.partecipanti} onChange={e => set('partecipanti', e.target.value)}
            placeholder="es. mario@example.com, laura@studio.it"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Note</label>
          <textarea value={form.note} onChange={e => set('note', e.target.value)} rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
        <input type="checkbox" checked={form.creaMeeting} onChange={e => set('creaMeeting', e.target.checked)} />
        Crea Microsoft Teams Meeting (link automatico)
      </label>

      <div className="flex justify-between pt-2">
        <div>
          {onDelete && initial?.id && (
            <Button type="button" variant="danger" onClick={() => onDelete(initial.id)}>Elimina</Button>
          )}
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onCancel}>Annulla</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Salvataggio...' : 'Salva'}</Button>
        </div>
      </div>
    </form>
  );
}
