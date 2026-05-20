import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../auth/useAuth';
import { emailApi } from '../../api/email';

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return (
    d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }) +
    ' ' +
    d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
  );
}

export default function EmailNote({ messageId }) {
  const { account, getToken } = useAuth();
  const [note, setNote] = useState([]);
  const [testo, setTesto] = useState('');
  const [sending, setSending] = useState(false);
  const [open, setOpen] = useState(false);
  const bottomRef = useRef(null);

  async function loadNote() {
    if (!messageId) return;
    try {
      const token = await getToken();
      setNote(await emailApi.listNote(token, messageId));
    } catch {}
  }

  useEffect(() => {
    setNote([]);
    setTesto('');
    setOpen(false);
    loadNote();
    const interval = setInterval(loadNote, 30000);
    return () => clearInterval(interval);
  }, [messageId]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [note, open]);

  async function handleAdd(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!testo.trim()) return;
    setSending(true);
    try {
      const token = await getToken();
      await emailApi.addNota(token, messageId, {
        testo: testo.trim(),
        autore: account?.name || account?.username || 'Utente',
      });
      setTesto('');
      await loadNote();
    } catch {
    } finally {
      setSending(false);
    }
  }

  const currentUser = account?.name || account?.username;

  return (
    <div className="mt-2 border-t pt-2" onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-medium transition"
      >
        <span>{open ? '▾' : '▸'}</span>
        <span>Note interne</span>
        {note.length > 0 && (
          <span className="bg-gray-200 text-gray-600 rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
            {note.length}
          </span>
        )}
      </button>

      {open && (
        <div className="mt-2">
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {note.length === 0 && (
              <p className="text-xs text-gray-400 italic">Nessuna nota ancora.</p>
            )}
            {note.map((n) => {
              const isMine = n.autore === currentUser;
              return (
                <div key={n.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] text-gray-400 mb-0.5">
                    {n.autore} · {formatTime(n.createdAt)}
                  </span>
                  <div
                    className={`px-2.5 py-1.5 rounded-lg text-xs max-w-[85%] break-words
                      ${isMine ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-700'}`}
                  >
                    {n.testo}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleAdd} className="flex gap-1.5 mt-2">
            <input
              value={testo}
              onChange={e => setTesto(e.target.value)}
              placeholder="Aggiungi una nota interna..."
              className="flex-1 border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <button
              type="submit"
              disabled={sending || !testo.trim()}
              className="px-2.5 py-1.5 bg-brand-500 text-white rounded-lg text-xs font-medium disabled:opacity-50 hover:bg-brand-600 transition"
            >
              +
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
