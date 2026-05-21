import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../auth/useAuth';
import { calendarioApi } from '../../api/calendario';

function formatTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function EventoChat({ evento }) {
  const { account, getToken } = useAuth();
  const [messaggi, setMessaggi] = useState([]);
  const [testo, setTesto] = useState('');
  const [destinatario, setDestinatario] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const partecipanti = (evento?.partecipanti || evento?.attendees?.map(a => ({
    email: a.emailAddress?.address,
    nome: a.emailAddress?.name,
  })) || []).filter(Boolean);

  async function load() {
    if (!evento?.id) return;
    try {
      const token = await getToken();
      setMessaggi(await calendarioApi.listChat(token, evento.id));
    } catch {}
  }

  useEffect(() => { load(); }, [evento?.id]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messaggi]);

  async function handleSend() {
    if (!testo.trim()) return;
    setSending(true);
    try {
      const token = await getToken();
      const dest = partecipanti.find(p =>
        (typeof p === 'string' ? p : p.email) === destinatario
      );
      await calendarioApi.sendChat(token, evento.id, {
        testo,
        autore: account?.name || 'Utente',
        autoreEmail: account?.username || '',
        destinatario: typeof dest === 'string' ? dest : (dest?.nome || dest?.email || ''),
        destinatarioEmail: typeof dest === 'string' ? dest : (dest?.email || ''),
        eventoTitolo: evento.subject || evento.titolo || '',
        clienteId: evento.clienteId || '',
        clienteNome: evento.clienteNome || '',
      });
      setTesto('');
      setDestinatario('');
      load();
    } catch {} finally { setSending(false); }
  }

  const mioEmail = account?.username || '';

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 overflow-y-auto space-y-2 py-2 px-1 min-h-0" style={{ maxHeight: 260 }}>
        {messaggi.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-8">Nessun messaggio ancora.</p>
        )}
        {messaggi.map(m => {
          const isMio = m.autoreEmail === mioEmail;
          return (
            <div key={m.id} className={`flex flex-col ${isMio ? 'items-end' : 'items-start'}`}>
              {m.destinatario && (
                <span className="text-xs text-gray-400 mb-0.5">
                  {isMio ? `→ ${m.destinatario}` : `da ${m.autore}`}
                </span>
              )}
              <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                isMio ? 'bg-brand-500 text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'
              }`}>
                {!isMio && <p className="text-xs font-semibold mb-0.5 opacity-70">{m.autore}</p>}
                <p className="whitespace-pre-wrap">{m.testo}</p>
              </div>
              <span className="text-xs text-gray-400 mt-0.5">{formatTime(m.createdAt)}</span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="border-t pt-2 mt-2 space-y-1.5">
        {partecipanti.length > 0 && (
          <select
            value={destinatario}
            onChange={e => setDestinatario(e.target.value)}
            className="w-full border rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">Invia a tutti (nessuna task)</option>
            {partecipanti.map(p => {
              const email = typeof p === 'string' ? p : p.email;
              const nome = typeof p === 'string' ? p : (p.nome || p.email);
              if (email === mioEmail) return null;
              return (
                <option key={email} value={email}>
                  → {nome} (crea task)
                </option>
              );
            })}
          </select>
        )}
        <div className="flex gap-2">
          <input
            value={testo}
            onChange={e => setTesto(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Scrivi un messaggio..."
            className="flex-1 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            onClick={handleSend}
            disabled={sending || !testo.trim()}
            className="px-3 py-1.5 bg-brand-500 text-white text-sm rounded-lg hover:bg-brand-600 disabled:opacity-50 transition"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}
