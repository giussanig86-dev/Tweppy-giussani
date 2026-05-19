import { useState, useEffect } from 'react';
import Button from '../../components/ui/Button';

const EMPTY = {
  clienteId: '', clienteNome: '',
  data: new Date().toISOString().slice(0, 10),
  voceId: '', voceDescrizione: '',
  importoUnitario: '', quantita: 1,
  collaboratore: '', note: '',
};

function calcola(importoUnitario, quantita, tariffario) {
  const netto = parseFloat(importoUnitario || 0) * parseFloat(quantita || 1);
  const contributo = netto * (tariffario?.contributoIntegrativo || 0.04);
  const iva = (netto + contributo) * (tariffario?.iva || 0.22);
  return {
    importoNetto: Math.round(netto * 100) / 100,
    contributoIntegrativo: Math.round(contributo * 100) / 100,
    iva: Math.round(iva * 100) / 100,
    importoTotale: Math.round((netto + contributo + iva) * 100) / 100,
  };
}

export default function AttivitaForm({ initial, clienti, tariffario, onSave, onCancel }) {
  const [form, setForm] = useState({ ...EMPTY, ...initial });
  const [saving, setSaving] = useState(false);

  const voci = tariffario?.voci || [];
  const anteprima = calcola(form.importoUnitario, form.quantita, tariffario);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function handleVoceChange(voceId) {
    const voce = voci.find(v => v.id === voceId);
    set('voceId', voceId);
    if (voce) {
      set('voceDescrizione', voce.descrizione);
      set('importoUnitario', String(voce.importoBase));
    }
  }

  function handleClienteChange(clienteId) {
    const c = clienti.find(cl => cl.id === clienteId);
    set('clienteId', clienteId);
    if (c) set('clienteNome', c.ragioneSociale);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ ...form, ...anteprima });
    } finally { setSaving(false); }
  }

  const categorie = [...new Set(voci.map(v => v.categoria))];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Cliente *</label>
          <select required value={form.clienteId} onChange={e => handleClienteChange(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option value="">— seleziona cliente —</option>
            {clienti.map(c => <option key={c.id} value={c.id}>{c.ragioneSociale}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Data *</label>
          <input required type="date" value={form.data} onChange={e => set('data', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Collaboratore</label>
          <input type="text" value={form.collaboratore} onChange={e => set('collaboratore', e.target.value)}
            placeholder="es. Laura"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>

        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Voce Tariffario</label>
          <select value={form.voceId} onChange={e => handleVoceChange(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option value="">— seleziona voce —</option>
            {categorie.map(cat => (
              <optgroup key={cat} label={cat}>
                {voci.filter(v => v.categoria === cat).map(v => (
                  <option key={v.id} value={v.id}>{v.descrizione} (€ {v.importoBase})</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Importo Unitario (€) *</label>
          <input required type="number" step="0.01" min="0" value={form.importoUnitario}
            onChange={e => set('importoUnitario', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Quantità</label>
          <input type="number" step="1" min="1" value={form.quantita}
            onChange={e => set('quantita', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>

        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Note</label>
          <textarea rows={2} value={form.note} onChange={e => set('note', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
      </div>

      {/* Live preview */}
      {parseFloat(form.importoUnitario) > 0 && (
        <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
          <div className="flex justify-between text-gray-600">
            <span>Netto</span><span>€ {anteprima.importoNetto.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Contributo integrativo (4%)</span><span>€ {anteprima.contributoIntegrativo.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>IVA (22%)</span><span>€ {anteprima.iva.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold text-gray-800 border-t pt-1 mt-1">
            <span>Totale</span><span>€ {anteprima.importoTotale.toFixed(2)}</span>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel}>Annulla</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Salvataggio...' : 'Salva'}</Button>
      </div>
    </form>
  );
}
