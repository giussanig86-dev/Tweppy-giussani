import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/useAuth';
import { utentiApi } from '../../api/utenti';
import Button from '../../components/ui/Button';

const RUOLI = ['admin', 'collaboratore', 'visualizzatore'];

const RUOLO_BADGE = {
  admin:          'bg-purple-100 text-purple-700',
  collaboratore:  'bg-blue-100 text-blue-700',
  visualizzatore: 'bg-gray-100 text-gray-600',
};

const RUOLO_DESC = {
  admin:          'Accesso completo a tutte le funzioni',
  collaboratore:  'Task, comunicazioni, calendario, checklist, documenti',
  visualizzatore: 'Solo lettura — nessuna modifica',
};

const EMPTY = { email: '', nome: '', ruolo: 'collaboratore' };

export default function GestioneUtenti() {
  const { getToken } = useAuth();
  const [utenti, setUtenti] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function load() {
    try {
      setLoading(true);
      const token = await getToken();
      setUtenti(await utentiApi.list(token));
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleSave() {
    if (!form.email || !form.ruolo) return;
    setSaving(true);
    try {
      const token = await getToken();
      if (form.id) {
        await utentiApi.update(token, form.id, { email: form.email, nome: form.nome, ruolo: form.ruolo });
      } else {
        await utentiApi.create(token, form);
      }
      setForm(null);
      load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!confirm('Rimuovere questo utente dalla gestione ruoli?')) return;
    const token = await getToken();
    await utentiApi.remove(token, id);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Gestione Utenti</h1>
          <p className="text-sm text-gray-500 mt-0.5">Assegna ruoli ai membri dello studio</p>
        </div>
        <Button onClick={() => setForm({ ...EMPTY })}>+ Aggiungi Utente</Button>
      </div>

      {/* Legenda ruoli */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {RUOLI.map(r => (
          <div key={r} className="bg-white rounded-xl border p-4">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${RUOLO_BADGE[r]}`}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </span>
            <p className="text-xs text-gray-500 mt-2">{RUOLO_DESC[r]}</p>
          </div>
        ))}
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {loading ? (
        <p className="text-gray-500">Caricamento...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Nome</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Ruolo</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {utenti.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{u.nome || u.email}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${RUOLO_BADGE[u.ruolo] || 'bg-gray-100'}`}>
                      {u.ruolo}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2 justify-end">
                    <Button size="sm" variant="secondary" onClick={() => setForm({ ...u })}>Modifica</Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(u.id)}>Rimuovi</Button>
                  </td>
                </tr>
              ))}
              {utenti.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400 text-sm">
                  Nessun utente configurato — tutti gli utenti Azure AD hanno accesso come Admin.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Form modale */}
      {form && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4">{form.id ? 'Modifica Utente' : 'Aggiungi Utente'}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email Microsoft 365 *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="utente@dominio.it"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nome</label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={e => setForm(p => ({ ...p, nome: e.target.value }))}
                  placeholder="Nome e Cognome"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Ruolo *</label>
                <select
                  value={form.ruolo}
                  onChange={e => setForm(p => ({ ...p, ruolo: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {RUOLI.map(r => (
                    <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)} — {RUOLO_DESC[r]}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-5">
              <Button variant="secondary" onClick={() => setForm(null)}>Annulla</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? 'Salvataggio...' : 'Salva'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
