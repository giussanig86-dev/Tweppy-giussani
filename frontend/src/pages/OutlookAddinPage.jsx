import { useState, useEffect } from 'react';
import { useAuth } from '../auth/useAuth';
import { anagraficaApi } from '../api/anagrafica';
import { emailApi } from '../api/email';

function fmt(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

const STATO_BADGE = {
  da_fare: 'bg-gray-100 text-gray-600',
  in_lavorazione: 'bg-blue-100 text-blue-700',
  completato: 'bg-green-100 text-green-700',
  fatto: 'bg-green-100 text-green-700',
};

export default function OutlookAddinPage() {
  const { getToken } = useAuth();
  const [stato, setStato] = useState('loading'); // loading | trovato | sconosciuto | errore
  const [cliente, setCliente] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [senderEmail, setSenderEmail] = useState('');
  const [senderName, setSenderName] = useState('');
  const [creatingTask, setCreatingTask] = useState(false);
  const [taskCreated, setTaskCreated] = useState(false);
  const [errore, setErrore] = useState('');

  useEffect(() => {
    if (typeof Office === 'undefined') {
      setStato('errore');
      setErrore('Office.js non disponibile. Apri questa pagina da Outlook.');
      return;
    }
    Office.onReady(async () => {
      try {
        const item = Office.context.mailbox.item;
        const email = item?.from?.emailAddress || '';
        const name = item?.from?.displayName || email;
        setSenderEmail(email);
        setSenderName(name);

        const token = await getToken();
        const clienti = await anagraficaApi.list(token);
        const trovato = clienti.find(c =>
          (c.email || '').toLowerCase() === email.toLowerCase() ||
          (c.pec || '').toLowerCase() === email.toLowerCase()
        );

        if (trovato) {
          setCliente(trovato);
          const storico = await emailApi.storico(token, trovato.id).catch(() => ({ timeline: [] }));
          const ultimi = (storico.timeline || [])
            .filter(i => i.tipo === 'task')
            .slice(0, 3);
          setTasks(ultimi);
          setStato('trovato');
        } else {
          setCliente({ email, ragioneSociale: name });
          setStato('sconosciuto');
        }
      } catch (e) {
        setErrore(e.message);
        setStato('errore');
      }
    });
  }, []);

  async function handleCreaTask() {
    if (!cliente?.id) return;
    setCreatingTask(true);
    try {
      const token = await getToken();
      const item = Office.context.mailbox.item;
      await emailApi.taskDaMail(token, {
        messageId: item?.itemId || '',
        mailbox: 'me',
        clienteId: cliente.id,
        clienteNome: cliente.ragioneSociale,
        titolo: `Email: ${item?.subject || senderEmail}`,
        assegnato: '',
        priorita: 'media',
      });
      setTaskCreated(true);
    } catch (e) {
      setErrore(e.message);
    } finally {
      setCreatingTask(false);
    }
  }

  if (stato === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="text-center">
          <div className="text-3xl mb-3">⏳</div>
          <p className="text-sm text-gray-500">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (stato === 'errore') {
    return (
      <div className="p-4 bg-white">
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          <p className="font-medium mb-1">Errore</p>
          <p>{errore}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen font-sans text-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-gray-50">
        <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-0.5">GDS Studio CRM</p>
        {stato === 'trovato' ? (
          <>
            <p className="font-semibold text-gray-800 truncate">{cliente.ragioneSociale}</p>
            <p className="text-xs text-gray-400 truncate">{senderEmail}</p>
          </>
        ) : (
          <>
            <p className="font-medium text-gray-700 truncate">{senderName || senderEmail}</p>
            <p className="text-xs text-amber-600">Non in anagrafica</p>
          </>
        )}
      </div>

      <div className="px-4 py-3 space-y-4">
        {stato === 'trovato' && (
          <>
            {/* Info cliente */}
            <div className="space-y-1 text-xs text-gray-600">
              {cliente.tipologiaCliente && (
                <p><span className="text-gray-400">Tipo:</span> {cliente.tipologiaCliente}</p>
              )}
              {cliente.regimeFiscale && (
                <p><span className="text-gray-400">Regime:</span> {cliente.regimeFiscale}</p>
              )}
              {cliente.stato && cliente.stato !== 'attivo' && (
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium mt-1
                  ${cliente.stato === 'in_cessazione' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                  {cliente.stato.replace('_', ' ')}
                </span>
              )}
            </div>

            {/* Task recenti */}
            {tasks.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Ultimi task</p>
                <div className="space-y-1.5">
                  {tasks.map((t, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className={`mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 ${STATO_BADGE[t.stato] || STATO_BADGE.da_fare}`}>
                        {t.stato?.replace('_', ' ') || '—'}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-700 truncate">{t.titolo}</p>
                        {t.data && <p className="text-[10px] text-gray-400">{fmt(t.data)}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {tasks.length === 0 && (
              <p className="text-xs text-gray-400">Nessun task recente per questo cliente.</p>
            )}

            {/* Crea task */}
            <div className="pt-2 border-t">
              {taskCreated ? (
                <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-700 text-center">
                  ✅ Task creato con successo
                </div>
              ) : (
                <button
                  onClick={handleCreaTask}
                  disabled={creatingTask}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium py-2 rounded-lg transition"
                >
                  {creatingTask ? 'Creazione...' : '✅ Crea Task da questa email'}
                </button>
              )}
              {errore && <p className="text-red-500 text-xs mt-1 text-center">{errore}</p>}
            </div>
          </>
        )}

        {stato === 'sconosciuto' && (
          <div className="space-y-3">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
              <p>Il mittente <strong>{senderEmail}</strong> non è presente in anagrafica.</p>
            </div>
            <a
              href={`${window.location.origin}/anagrafica`}
              target="_blank"
              rel="noreferrer"
              className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium py-2 rounded-lg transition"
            >
              ➕ Aggiungi in anagrafica
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
