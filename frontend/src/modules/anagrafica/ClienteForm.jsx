import { useState } from 'react';
import { validateCodiceFiscale, validatePartitaIva } from '../../utils/validators';
import Button from '../../components/ui/Button';

const CATEGORIE_ANAGRAFICA = [
  'avvocato', 'studio paghe', 'aggiornamento professionale',
  'comunicazioni', 'software', 'contabilità', 'fiscale',
];
const TIPOLOGIE_CLIENTE = [
  'imprenditore individuale', 'professionista', 'società persone',
  'società capitali', 'associazione', 'ente non commerciale',
  'persona fisica', 'startup innovativa',
];
const TIPOLOGIE_CONTABILITA = ['ordinaria', 'semplificata', 'forfettaria', 'super semplificata', 'nessuna'];
const REGIMI_FISCALI = ['ordinario', 'forfettario', 'minimi', 'agricolo'];
const STATI = ['attivo', 'in_cessazione', 'cessato'];
const IVA_PERIODICITA = ['mensile', 'trimestrale', 'esonerato'];
const TIPI_INDIRIZZO = ['sede operativa', 'sede legale alternativa', 'magazzino', 'domicilio fiscale', 'altro'];
const SPID_PROVIDERS = ['Aruba', 'Poste Italiane', 'InfoCert', 'TIM', 'Namirial', 'Lepida', 'Register.it'];

const EMPTY = {
  ragioneSociale: '', codiceFiscale: '', partitaIva: '',
  tipoSoggetto: '', tipologiaCliente: '', categoriaAnagrafica: '', tipologiaContabilita: '',
  regimeFiscale: '', atecoCode: '', settore: '',
  ivaPeriodicita: '', soggettoISA: false, soggettoRitenute: false, dipendenti: 0,
  indirizzo: '', cap: '', comune: '', provincia: '',
  email: '', pec: '', telefono: '',
  referente: '', dataInizioRapporto: '', stato: 'attivo', note: '',
  collaboratoreAssegnato: '',
};

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${className}`}
      {...props}
    />
  );
}

function Select({ children, ...props }) {
  return (
    <select
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
      {...props}
    >
      <option value="">— seleziona —</option>
      {children}
    </select>
  );
}

function PasswordInput({ value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-base leading-none"
        tabIndex={-1}
      >
        {show ? '🙈' : '👁'}
      </button>
    </div>
  );
}

function parseJson(val, fallback) {
  try { return val ? (typeof val === 'string' ? JSON.parse(val) : val) : fallback; }
  catch { return fallback; }
}

export default function ClienteForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({ ...EMPTY, ...initial });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [indirizziSecondari, setIndirizziSecondari] = useState(() =>
    parseJson(initial?.indirizziSecondari, [])
  );
  const [credenzialiPec, setCredenzialiPec] = useState(() =>
    parseJson(initial?.credenzialiPec, { username: '', password: '' })
  );
  const [credenzialiSpid, setCredenzialiSpid] = useState(() =>
    parseJson(initial?.credenzialiSpid, { provider: '', username: '', password: '' })
  );

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }

  function validate() {
    const e = {};
    if (!form.ragioneSociale.trim()) e.ragioneSociale = 'Campo obbligatorio';
    if (form.codiceFiscale && !validateCodiceFiscale(form.codiceFiscale))
      e.codiceFiscale = 'Codice fiscale non valido';
    if (form.partitaIva && !validatePartitaIva(form.partitaIva))
      e.partitaIva = 'Partita IVA non valida';
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length > 0) { setErrors(e2); return; }
    setSaving(true);
    try {
      await onSave({
        ...form,
        indirizziSecondari: JSON.stringify(indirizziSecondari),
        credenzialiPec: JSON.stringify(credenzialiPec),
        credenzialiSpid: JSON.stringify(credenzialiSpid),
      });
    } finally {
      setSaving(false);
    }
  }

  // ── Indirizzi secondari helpers ───────────────────────────────────────────
  function addIndirizzo() {
    setIndirizziSecondari(prev => [...prev, { tipo: 'sede operativa', indirizzo: '', cap: '', comune: '', provincia: '' }]);
  }
  function removeIndirizzo(i) {
    setIndirizziSecondari(prev => prev.filter((_, j) => j !== i));
  }
  function updateIndirizzo(i, field, value) {
    setIndirizziSecondari(prev => prev.map((addr, j) => j === i ? { ...addr, [field]: value } : addr));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Dati principali */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Dati Principali</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Ragione Sociale *" error={errors.ragioneSociale}>
            <Input value={form.ragioneSociale} onChange={e => set('ragioneSociale', e.target.value)} />
          </Field>
          <Field label="Stato">
            <Select value={form.stato} onChange={e => set('stato', e.target.value)}>
              {STATI.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
            {form.stato === 'in_cessazione' && (
              <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                ⚠ Il cliente è in fase di cessazione. Verrà evidenziato nello scadenzario.
              </div>
            )}
            {form.stato === 'cessato' && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                ⛔ Il cliente è cessato. Salvando, tutti gli adempimenti verranno eliminati.
              </div>
            )}
          </Field>
          <Field label="Codice Fiscale" error={errors.codiceFiscale}>
            <Input
              value={form.codiceFiscale}
              onChange={e => set('codiceFiscale', e.target.value.toUpperCase())}
              maxLength={16}
            />
          </Field>
          <Field label="Partita IVA" error={errors.partitaIva}>
            <Input
              value={form.partitaIva}
              onChange={e => set('partitaIva', e.target.value)}
              maxLength={11}
            />
          </Field>
        </div>
      </section>

      {/* Tipologia */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Tipologia</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Tipologia Cliente">
            <Select value={form.tipologiaCliente} onChange={e => set('tipologiaCliente', e.target.value)}>
              {TIPOLOGIE_CLIENTE.map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Categoria Anagrafica">
            <Select value={form.categoriaAnagrafica} onChange={e => set('categoriaAnagrafica', e.target.value)}>
              {CATEGORIE_ANAGRAFICA.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Tipologia Contabilità">
            <Select value={form.tipologiaContabilita} onChange={e => set('tipologiaContabilita', e.target.value)}>
              {TIPOLOGIE_CONTABILITA.map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Regime Fiscale">
            <Select value={form.regimeFiscale} onChange={e => set('regimeFiscale', e.target.value)}>
              {REGIMI_FISCALI.map(r => <option key={r} value={r}>{r}</option>)}
            </Select>
          </Field>
          <Field label="Periodicità IVA">
            <Select value={form.ivaPeriodicita} onChange={e => set('ivaPeriodicita', e.target.value)}>
              {IVA_PERIODICITA.map(v => <option key={v} value={v}>{v}</option>)}
            </Select>
          </Field>
          <Field label="Codice ATECO">
            <Input value={form.atecoCode} onChange={e => set('atecoCode', e.target.value)} />
          </Field>
          <Field label="Settore">
            <Input value={form.settore} onChange={e => set('settore', e.target.value)} />
          </Field>
        </div>
        <div className="flex gap-6 mt-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.soggettoISA} onChange={e => set('soggettoISA', e.target.checked)} />
            Soggetto ISA
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.soggettoRitenute} onChange={e => set('soggettoRitenute', e.target.checked)} />
            Soggetto a Ritenute
          </label>
          <Field label="N. Dipendenti">
            <Input type="number" min="0" value={form.dipendenti} onChange={e => set('dipendenti', parseInt(e.target.value) || 0)} className="w-24" />
          </Field>
        </div>
      </section>

      {/* Contatti + Indirizzo principale */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Contatti</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Email">
            <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} />
          </Field>
          <Field label="PEC">
            <Input type="email" value={form.pec} onChange={e => set('pec', e.target.value)} />
          </Field>
          <Field label="Telefono">
            <Input value={form.telefono} onChange={e => set('telefono', e.target.value)} />
          </Field>
          <Field label="Referente">
            <Input value={form.referente} onChange={e => set('referente', e.target.value)} />
          </Field>
          <Field label="Indirizzo (sede legale)">
            <Input value={form.indirizzo} onChange={e => set('indirizzo', e.target.value)} />
          </Field>
          <div className="grid grid-cols-3 gap-2">
            <Field label="CAP">
              <Input value={form.cap} onChange={e => set('cap', e.target.value)} maxLength={5} />
            </Field>
            <Field label="Comune">
              <Input value={form.comune} onChange={e => set('comune', e.target.value)} />
            </Field>
            <Field label="Prov.">
              <Input value={form.provincia} onChange={e => set('provincia', e.target.value.toUpperCase())} maxLength={2} />
            </Field>
          </div>
        </div>
      </section>

      {/* Indirizzi secondari */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Indirizzi Secondari</h3>
          <button
            type="button"
            onClick={addIndirizzo}
            className="text-xs text-brand-600 hover:text-brand-800 font-medium border border-brand-300 hover:bg-brand-50 px-2 py-1 rounded-lg transition"
          >
            + Aggiungi Indirizzo
          </button>
        </div>
        {indirizziSecondari.length === 0 && (
          <p className="text-xs text-gray-400 italic">Nessun indirizzo secondario. Clicca "+ Aggiungi Indirizzo" per aggiungerne uno.</p>
        )}
        <div className="space-y-3">
          {indirizziSecondari.map((addr, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <select
                  value={addr.tipo}
                  onChange={e => updateIndirizzo(i, 'tipo', e.target.value)}
                  className="border border-gray-300 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  {TIPI_INDIRIZZO.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <button
                  type="button"
                  onClick={() => removeIndirizzo(i)}
                  className="text-xs text-red-400 hover:text-red-600 font-medium"
                >
                  Rimuovi
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2">
                  <Input
                    placeholder="Indirizzo"
                    value={addr.indirizzo}
                    onChange={e => updateIndirizzo(i, 'indirizzo', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    placeholder="CAP"
                    value={addr.cap}
                    onChange={e => updateIndirizzo(i, 'cap', e.target.value)}
                    maxLength={5}
                    className="border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <input
                    placeholder="Comune"
                    value={addr.comune}
                    onChange={e => updateIndirizzo(i, 'comune', e.target.value)}
                    className="border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 col-span-2"
                  />
                </div>
                <div>
                  <input
                    placeholder="Prov."
                    value={addr.provincia}
                    onChange={e => updateIndirizzo(i, 'provincia', e.target.value.toUpperCase())}
                    maxLength={2}
                    className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Credenziali PEC e SPID */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 mb-1 uppercase tracking-wide">Credenziali di Accesso</h3>
        <p className="text-xs text-amber-600 mb-3">⚠ Dati sensibili — conservare con cura. Accesso limitato agli utenti autorizzati.</p>

        <div className="grid grid-cols-2 gap-6">
          {/* PEC */}
          <div className="border border-gray-200 rounded-lg p-4 bg-blue-50/30">
            <p className="text-xs font-semibold text-blue-700 mb-3 uppercase tracking-wide">📧 Accesso Webmail PEC</p>
            <div className="space-y-3">
              <Field label="Username / Email">
                <Input
                  value={credenzialiPec.username}
                  onChange={e => setCredenzialiPec(p => ({ ...p, username: e.target.value }))}
                  placeholder="utente@pec.it"
                  autoComplete="off"
                />
              </Field>
              <Field label="Password">
                <PasswordInput
                  value={credenzialiPec.password}
                  onChange={e => setCredenzialiPec(p => ({ ...p, password: e.target.value }))}
                  placeholder="••••••••"
                />
              </Field>
            </div>
          </div>

          {/* SPID */}
          <div className="border border-gray-200 rounded-lg p-4 bg-green-50/30">
            <p className="text-xs font-semibold text-green-700 mb-3 uppercase tracking-wide">🔐 Accesso SPID</p>
            <div className="space-y-3">
              <Field label="Identity Provider">
                <Select
                  value={credenzialiSpid.provider}
                  onChange={e => setCredenzialiSpid(p => ({ ...p, provider: e.target.value }))}
                >
                  {SPID_PROVIDERS.map(pr => <option key={pr} value={pr}>{pr}</option>)}
                </Select>
              </Field>
              <Field label="Username / Codice Fiscale">
                <Input
                  value={credenzialiSpid.username}
                  onChange={e => setCredenzialiSpid(p => ({ ...p, username: e.target.value }))}
                  placeholder="RSSMRA80A01H501U"
                  autoComplete="off"
                />
              </Field>
              <Field label="Password">
                <PasswordInput
                  value={credenzialiSpid.password}
                  onChange={e => setCredenzialiSpid(p => ({ ...p, password: e.target.value }))}
                  placeholder="••••••••"
                />
              </Field>
            </div>
          </div>
        </div>
      </section>

      {/* Studio */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Gestione Studio</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Collaboratore Assegnato">
            <Input value={form.collaboratoreAssegnato} onChange={e => set('collaboratoreAssegnato', e.target.value)} />
          </Field>
          <Field label="Data Inizio Rapporto">
            <Input type="date" value={form.dataInizioRapporto} onChange={e => set('dataInizioRapporto', e.target.value)} />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Note">
            <textarea
              value={form.note}
              onChange={e => set('note', e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </Field>
        </div>
      </section>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Annulla</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Salvataggio...' : 'Salva'}</Button>
      </div>
    </form>
  );
}
