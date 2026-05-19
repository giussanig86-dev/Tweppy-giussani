import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/useAuth';
import { anagraficaApi } from '../../api/anagrafica';
import { documentiApi } from '../../api/documenti';
import Button from '../../components/ui/Button';

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DocumentiPage() {
  const { getToken } = useAuth();
  const [clienti, setClienti] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [clienteId, setClienteId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [salvaSharePoint, setSalvaSharePoint] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    getToken().then((t) => {
      anagraficaApi.list(t).then(setClienti).catch(() => {});
      documentiApi.templates(t).then(setTemplates).catch(() => {});
    });
  }, []);

  async function handleGenera() {
    if (!clienteId || !templateId) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const token = await getToken();
      const blob = await documentiApi.genera(token, clienteId, templateId, salvaSharePoint);

      const cliente = clienti.find((c) => c.id === clienteId);
      const template = templates.find((t) => t.id === templateId);
      const filename = `${template?.nome || templateId}_${cliente?.ragioneSociale || 'cliente'}.docx`;

      downloadBlob(blob, filename);
      setSuccess(`Documento "${template?.nome}" generato e scaricato.`);
    } catch (e) {
      setError(e.message || 'Errore durante la generazione');
    } finally {
      setLoading(false);
    }
  }

  const clienteSelezionato = clienti.find((c) => c.id === clienteId);
  const templateSelezionato = templates.find((t) => t.id === templateId);
  const canGenerate = clienteId && templateId && !loading;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Generazione Documenti</h1>

      <div className="bg-white rounded-xl border shadow-sm p-6 space-y-5">
        {/* Selezione cliente */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Cliente *</label>
          <select
            value={clienteId}
            onChange={(e) => setClienteId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">— seleziona cliente —</option>
            {clienti.map((c) => <option key={c.id} value={c.id}>{c.ragioneSociale}</option>)}
          </select>
          {clienteSelezionato && (
            <p className="text-xs text-gray-400 mt-1">
              {clienteSelezionato.tipologiaCliente} — {clienteSelezionato.regimeFiscale}
            </p>
          )}
        </div>

        {/* Selezione template */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">Template *</label>
          <div className="grid grid-cols-2 gap-3">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => setTemplateId(t.id)}
                className={`text-left p-3 rounded-lg border transition ${
                  templateId === t.id
                    ? 'border-brand-500 bg-blue-50 ring-2 ring-brand-500'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <p className="text-sm font-medium text-gray-800">{t.nome}</p>
                <p className="text-xs text-gray-400 mt-0.5">{t.descrizione}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Opzione SharePoint */}
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={salvaSharePoint}
            onChange={(e) => setSalvaSharePoint(e.target.checked)}
            className="rounded"
          />
          Salva copia in SharePoint nella cartella del cliente
        </label>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm">{success}</p>}

        <div className="pt-2">
          <Button onClick={handleGenera} disabled={!canGenerate} className="w-full justify-center">
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Claude sta generando il documento...
              </span>
            ) : (
              'Genera Documento .docx'
            )}
          </Button>
          {canGenerate && !loading && (
            <p className="text-xs text-gray-400 text-center mt-2">
              Claude userà i dati di <strong>{clienteSelezionato?.ragioneSociale}</strong> per compilare <strong>{templateSelezionato?.nome}</strong>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
