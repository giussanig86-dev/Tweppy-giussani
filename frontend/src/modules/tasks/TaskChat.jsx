import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../auth/useAuth';
import { tasksApi } from '../../api/tasks';

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return (
    d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }) +
    ' ' +
    d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
  );
}

export default function TaskChat({ task }) {
  const { account, getToken } = useAuth();
  const [messaggi, setMessaggi] = useState([]);
  const [testo, setTesto] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  async function loadMessaggi() {
    if (!task?.id) return;
    try {
      const token = await getToken();
      const data = await tasksApi.listMessaggi(token, task.id);
      setMessaggi(data);
    } catch {}
  }

  useEffect(() => {
    setMessaggi([]);
    setTesto('');
    loadMessaggi();
    const interval = setInterval(loadMessaggi, 20000);
    return () => clearInterval(interval);
  }, [task?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messaggi]);

  async function handleSend(e) {
    e.preventDefault();
    if (!testo.trim() || !task?.id) return;
    setSending(true);
    try {
      const token = await getToken();
      await tasksApi.addMessaggio(token, task.id, {
        testo: testo.trim(),
        autore: account?.name || account?.username || 'Utente',
      });
      setTesto('');
      await loadMessaggi();
    } catch {
    } finally {
      setSending(false);
    }
  }

  if (!task) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
        Seleziona un task per chattare
      </div>
    );
  }

  const currentUser = account?.name || account?.username;

  return (
    <div className="h-full flex flex-col border border-gray-200 rounded-xl bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 shrink-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{task.titolo}</p>
        <p className="text-xs text-gray-400">Chat interna</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {messaggi.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-6">Nessun messaggio ancora.</p>
        )}
        {messaggi.map((m) => {
          const isMine = m.autore === currentUser;
          return (
            <div key={m.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
              <span className="text-xs text-gray-400 mb-0.5">
                {m.autore} · {formatTime(m.createdAt)}
              </span>
              <div
                className={`px-3 py-2 rounded-xl text-sm max-w-[85%] break-words
                  ${isMine ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-800'}`}
              >
                {m.testo}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="px-3 py-3 border-t border-gray-100 flex gap-2 shrink-0">
        <input
          value={testo}
          onChange={(e) => setTesto(e.target.value)}
          placeholder="Scrivi un messaggio..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button
          type="submit"
          disabled={sending || !testo.trim()}
          className="px-3 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-brand-600 transition shrink-0"
        >
          Invia
        </button>
      </form>
    </div>
  );
}
