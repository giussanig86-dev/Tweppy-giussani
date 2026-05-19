import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/useAuth';
import { anagraficaApi } from '../../api/anagrafica';
import { templatesApi } from '../../api/templates';
import Button from '../../components/ui/Button';

const STEP = { SELEZIONE: 1, ANTEPRIMA: 2, INVIO: 3, RISULTATO: 4 };

const FILTRI = [
  { value: 'tutti', label: 'Tutti i clienti attivi' },
  { value: 'tipologia', label: 'Per tipologia cliente' },
  { value: 'regime', label: 'Per regime fiscale' },
  { value: 'manuale', label: 'Selezione manuale' },
];

export default function InvioMassivo({ templates }) {
  const { getToken } = useAuth();
  const [step, setStep] = useState(STEP.SELEZIONE);
  const [templateId, setTemplateId] = useState('');
  const [filtro, setFiltro] = useState('tutti');
  const [filtroValore, setFiltroValore] = useState('');
  const [clienti, setClienti] = useState([]);
  const [selezionati, setSelezionati] = useState([]);
  const [anteprime, setAnteprime] = useState([]);
  const [loading, setLoading] = useState(false);
  const [risultato, setRisultato] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getToken().then(t => anagraficaApi.list(t).then(setClienti).catch(() => {}));
  }, []);

  const clientiAttivi = clienti.filter(c => c.stato === 'attivo' && c.email);

  function getDestinatari() {
    if (filtro === 'tutti') return clientiAttivi;
    if (filtro === 'tipologia') return clientiAttivi.filter(c => c.tipologiaCliente === filtroValore);
    if (filtro === 'regime') return clientiAttivi.filter(c => c.regimeFiscale === filtroValore);
    if (filtro === 'manuale') return clientiAttivi.filter(c => selezionati.includes(c.id));
    return [];
  }

  function toggleSelezionato(id) {
    setSelezionati(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  }

  const destinatari = getDestinatari();

  async function handleAnteprima() {
    if (!templateId || destinatari.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const data = await templatesApi.anteprima(token, templateId, destinatari.map(c => c.id));
      setAnteprime(data);
      setStep(STEP.ANTEPRIMA);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }

  async function handleInvia() {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await templatesApi.inviaBatch(token, templateId, destinatari.map(c => c.id));
      setRisultato(res);
      setStep(STEP.RISULTATO);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }

  function reset() {
    setStep(STEP.SELEZIONE); setTemplateId(''); setFiltro('tutti');
    setFiltroValore(''); setSelezionati([]); setAnteprime([]); setRisultato(null);
  }

  const tipologie = [...new Set(clientiAttivi.map(c => c.tipologiaCliente).filter(Boolean))];
  const regimi = [...new Set(clientiAttivi.map(c => c.regimeFiscale).filter(Boolean))];

  return (
    <div>
      {/* Stepper */}
      <div className="flex items-center gap-2 mb-6">
        {[['1','Seleziona'],['2','Anteprima'],['3','Invia'],['4','Risultato']].map(([n, label], i) => (
          <div key={n} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
              ${step >= i+1 ? 'bg-brand-500 text-white' : 'bg-gray-200 text-gray-400'}`}>{n}</div>
            <span className={`text-sm ${step >= i+1 ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>{label}</span>
            {i < 3 && <span className="text-gray-300 mx-1">›</span>}
          </div>
        ))}
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {/* Step 1: Selezione */}
      {step === STEP.SELEZIONE && (
        <div className="space-y-5 max-w-xl">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Template *</label>
            <select value={templateId} onChange={e => setTemplateId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="">— seleziona template —</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Destinatari</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {FILTRI.map(f => (
                <button key={f.value} type="button" onClick={() => setFiltro(f.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border
                    ${filtro === f.value ? 'border-brand-500 bg-blue-50 text-brand-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  {f.label}
                </button>
              ))}
            </div>

            {filtro === 'tipologia' && (
              <select value={filtroValore} onChange={e => setFiltroValore(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white mb-3 focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="">— seleziona tipologia —</option>
                {tipologie.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            )}

            {filtro === 'regime' && (
              <select value={filtroValore} onChange={e => setFiltroValore(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white mb-3 focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="">— seleziona regime —</option>
                {regimi.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            )}

            {filtro === 'manuale' && (
              <div className="border rounded-lg max-h-48 overflow-y-auto">
                {clientiAttivi.map(c => (
                  <label key={c.id} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer border-b last:border-0">
                    <input type="checkbox" checked={selezionati.includes(c.id)} onChange={() => toggleSelezionato(c.id)} />
                    <span className="text-sm">{c.ragioneSociale}</span>
                    <span className="text-xs text-gray-400 ml-auto">{c.email}</span>
                  </label>
                ))}
              </div>
            )}

            <p className="text-sm text-gray-500 mt-2">
              <span className="font-semibold text-gray-800">{destinatari.length}</span> destinatari selezionati
            </p>
          </div>

          <Button onClick={handleAnteprima} disabled={!templateId || destinatari.length === 0 || loading}>
            {loading ? 'Caricamento...' : 'Genera Anteprima →'}
          </Button>
        </div>
      )}

      {/* Step 2: Anteprima */}
      {step === STEP.ANTEPRIMA && (
        <div>
          <p className="text-sm text-gray-500 mb-4">
            Anteprima di {anteprime.length} email (su {destinatari.length} totali). Verifica prima di inviare.
          </p>
          <div className="space-y-4 mb-6">
            {anteprime.map((a, i) => (
              <div key={i} className="bg-white border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{a.clienteNome}</span>
                  <span className="text-xs text-gray-400">{a.email}</span>
                </div>
                <p className="text-xs text-gray-500 mb-1"><span className="font-medium">Oggetto:</span> {a.oggetto}</p>
                <pre className="text-xs text-gray-600 whitespace-pre-wrap bg-gray-50 rounded p-2 max-h-32 overflow-y-auto">{a.corpo}</pre>
              </div>
            ))}
            {destinatari.length > 5 && (
              <p className="text-xs text-gray-400 text-center">... e altri {destinatari.length - anteprime.length} destinatari</p>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setStep(STEP.SELEZIONE)}>← Modifica</Button>
            <Button onClick={() => setStep(STEP.INVIO)}>Procedi all'invio →</Button>
          </div>
        </div>
      )}

      {/* Step 3: Conferma invio */}
      {step === STEP.INVIO && (
        <div className="max-w-md">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
            <p className="font-semibold text-amber-800 mb-1">Conferma invio</p>
            <p className="text-sm text-amber-700">
              Stai per inviare <strong>{destinatari.length} email</strong> tramite il tuo account Outlook.
              L'operazione non è reversibile.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setStep(STEP.ANTEPRIMA)}>← Indietro</Button>
            <Button onClick={handleInvia} disabled={loading}>
              {loading ? 'Invio in corso...' : `Invia ${destinatari.length} email`}
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Risultato */}
      {step === STEP.RISULTATO && risultato && (
        <div className="max-w-md">
          <div className={`rounded-xl p-5 mb-4 ${risultato.errori.length === 0 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
            <p className="font-semibold text-lg mb-1">{risultato.inviati} email inviate</p>
            {risultato.errori.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium text-red-700 mb-1">{risultato.errori.length} errori:</p>
                {risultato.errori.map((e, i) => (
                  <p key={i} className="text-xs text-red-600">{e.clienteNome}: {e.errore}</p>
                ))}
              </div>
            )}
          </div>
          <Button onClick={reset}>Nuovo invio</Button>
        </div>
      )}
    </div>
  );
}
