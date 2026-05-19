import { useState, useRef } from 'react';
import { useAuth } from '../../auth/useAuth';
import { ocrApi } from '../../api/ocr';
import { anagraficaApi } from '../../api/anagrafica';
import ClienteForm from '../anagrafica/ClienteForm';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';

const TIPI = [
  { value: 'visura_camerale', label: 'Visura Camerale' },
  { value: 'carta_identita', label: "Carta d'Identità" },
  { value: 'tessera_sanitaria', label: 'Tessera Sanitaria' },
];

function mapDatiToAnagrafica(dati, tipo) {
  if (tipo === 'visura_camerale') return dati;
  const nome = [dati.cognome, dati.nome].filter(Boolean).join(' ');
  return {
    ragioneSociale: nome,
    codiceFiscale: dati.codiceFiscale || '',
    indirizzo: dati.indirizzo || '',
    comune: dati.comune || '',
    provincia: dati.provincia || '',
    cap: dati.cap || '',
    tipologiaCliente: 'persona fisica',
  };
}

export default function OcrPage() {
  const { getToken } = useAuth();
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [tipo, setTipo] = useState('visura_camerale');
  const [loading, setLoading] = useState(false);
  const [dati, setDati] = useState(null);
  const [datiEdit, setDatiEdit] = useState(null);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [modalForm, setModalForm] = useState(false);
  const [draggingOver, setDraggingOver] = useState(false);

  function handleFile(f) {
    if (!f) return;
    setFile(f);
    setDati(null);
    setDatiEdit(null);
    setError(null);
    setSaved(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDraggingOver(false);
    handleFile(e.dataTransfer.files[0]);
  }

  async function handleEstrai() {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const result = await ocrApi.estrai(token, file, tipo);
      setDati(result.dati);
      setDatiEdit({ ...result.dati });
    } catch (e) {
      setError(e.message || 'Errore durante l\'estrazione');
    } finally {
      setLoading(false);
    }
  }

  async function handleSalvaDocumento() {
    const ragioneSociale = datiEdit?.ragioneSociale || datiEdit?.cognome || 'documento';
    try {
      const token = await getToken();
      await ocrApi.salva(token, file, { ragioneSociale, tipoDocumento: tipo });
      setSaved(true);
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleCreaCliente(formData) {
    const token = await getToken();
    await anagraficaApi.create(token, formData);
    setModalForm(false);
  }

  const precompilato = datiEdit ? mapDatiToAnagrafica(datiEdit, tipo) : null;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">OCR Documenti → Anagrafica</h1>

      {/* Upload zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition mb-6 ${
          draggingOver ? 'border-brand-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDraggingOver(true); }}
        onDragLeave={() => setDraggingOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => handleFile(e.target.files[0])}
        />
        {file ? (
          <div>
            <p className="font-medium text-gray-800">{file.name}</p>
            <p className="text-sm text-gray-400 mt-1">{(file.size / 1024).toFixed(0)} KB</p>
          </div>
        ) : (
          <div>
            <p className="text-gray-500">Trascina qui il documento oppure clicca per selezionarlo</p>
            <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG — max 10 MB</p>
          </div>
        )}
      </div>

      {/* Tipo documento + pulsante */}
      <div className="flex gap-4 items-end mb-6">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-600 mb-1">Tipo documento</label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {TIPI.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <Button onClick={handleEstrai} disabled={!file || loading}>
          {loading ? 'Analisi in corso...' : 'Estrai Dati con Claude'}
        </Button>
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {/* Risultato estrazione */}
      {datiEdit && (
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h2 className="text-base font-semibold mb-4">Dati estratti — verifica e correggi</h2>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(datiEdit).map(([key, val]) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-500 mb-1 capitalize">
                  {key.replace(/([A-Z])/g, ' $1')}
                </label>
                <input
                  value={val || ''}
                  onChange={(e) => setDatiEdit((p) => ({ ...p, [key]: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-6">
            <Button onClick={() => setModalForm(true)}>
              Crea / Apri Anagrafica Cliente
            </Button>
            <Button
              variant="secondary"
              onClick={handleSalvaDocumento}
              disabled={saved}
            >
              {saved ? 'Documento salvato ✓' : 'Salva documento in SharePoint'}
            </Button>
          </div>
        </div>
      )}

      <Modal
        open={modalForm}
        onClose={() => setModalForm(false)}
        title="Nuovo Cliente da OCR"
      >
        <ClienteForm
          initial={precompilato}
          onSave={handleCreaCliente}
          onCancel={() => setModalForm(false)}
        />
      </Modal>
    </div>
  );
}
