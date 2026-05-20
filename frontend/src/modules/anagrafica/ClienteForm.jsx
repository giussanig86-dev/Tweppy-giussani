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
const STATI = ['attivo', 'inattivo', 'sospeso'];
const IVA_PERIODICITA = ['mensile', 'trimestrale', 'esonerato'];

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

export default function ClienteForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({ ...EMPTY, ...initial });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
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
      await onSave(form);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Dati principali */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Dati Principali</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Ragione Sociale *" error={errors.ragioneSociale}>
            <Input value={form.ragioneSociale} onChange={(e) => set('ragioneSociale', e.target.value)} />
          </Field>
          <Field label="Stato">
            <Select value={form.stato} onChange={(e) => set('stato', e.target.value)}>
              {STATI.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </Field>
          <Field label="Codice Fiscale" error={errors.codiceFiscale}>
            <Input
              value={form.codiceFiscale}
              onChange={(e) => set('codiceFiscale', e.target.value.toUpperCase())}
              maxLength={16}
            />
          </Field>
          <Field label="Partita IVA" error={errors.partitaIva}>
            <Input
              value={form.partitaIva}
              onChange={(e) => set('partitaIva', e.target.value)}
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
            <Select value={form.tipologiaCliente} onChange={(e) => set('tipologiaCliente', e.target.value)}>
              {TIPOLOGIE_CLIENTE.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Categoria Anagrafica">
            <Select value={form.categoriaAnagrafica} onChange={(e) => set('categoriaAnagrafica', e.target.value)}>
              {CATEGORIE_ANAGRAFICA.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Tipologia Contabilità">
            <Select value={form.tipologiaContabilita} onChange={(e) => set('tipologiaContabilita', e.target.value)}>
              {TIPOLOGIE_CONTABILITA.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Regime Fiscale">
            <Select value={form.regimeFiscale} onChange={(e) => set('regimeFiscale', e.target.value)}>
              {REGIMI_FISCALI.map((r) => <option key={r} value={r}>{r}</option>)}
            </Select>
          </Field>
          <Field label="Periodicità IVA">
            <Select value={form.ivaPeriodicita} onChange={(e) => set('ivaPeriodicita', e.target.value)}>
              {IVA_PERIODICITA.map((v) => <option key={v} value={v}>{v}</option>)}
            </Select>
          </Field>
          <Field label="Codice ATECO">
            <Input value={form.atecoCode} onChange={(e) => set('atecoCode', e.target.value)} />
          </Field>
          <Field label="Settore">
            <Input value={form.settore} onChange={(e) => set('settore', e.target.value)} />
          </Field>
        </div>
        <div className="flex gap-6 mt-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.soggettoISA} onChange={(e) => set('soggettoISA', e.target.checked)} />
            Soggetto ISA
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.soggettoRitenute} onChange={(e) => set('soggettoRitenute', e.target.checked)} />
            Soggetto a Ritenute
          </label>
          <Field label="N. Dipendenti">
            <Input type="number" min="0" value={form.dipendenti} onChange={(e) => set('dipendenti', parseInt(e.target.value) || 0)} className="w-24" />
          </Field>
        </div>
      </section>

      {/* Contatti */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Contatti</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Email">
            <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
          </Field>
          <Field label="PEC">
            <Input type="email" value={form.pec} onChange={(e) => set('pec', e.target.value)} />
          </Field>
          <Field label="Telefono">
            <Input value={form.telefono} onChange={(e) => set('telefono', e.target.value)} />
          </Field>
          <Field label="Referente">
            <Input value={form.referente} onChange={(e) => set('referente', e.target.value)} />
          </Field>
          <Field label="Indirizzo">
            <Input value={form.indirizzo} onChange={(e) => set('indirizzo', e.target.value)} />
          </Field>
          <div className="grid grid-cols-3 gap-2">
            <Field label="CAP">
              <Input value={form.cap} onChange={(e) => set('cap', e.target.value)} maxLength={5} />
            </Field>
            <Field label="Comune">
              <Input value={form.comune} onChange={(e) => set('comune', e.target.value)} />
            </Field>
            <Field label="Prov.">
              <Input value={form.provincia} onChange={(e) => set('provincia', e.target.value.toUpperCase())} maxLength={2} />
            </Field>
          </div>
        </div>
      </section>

      {/* Studio */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Gestione Studio</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Collaboratore Assegnato">
            <Input value={form.collaboratoreAssegnato} onChange={(e) => set('collaboratoreAssegnato', e.target.value)} />
          </Field>
          <Field label="Data Inizio Rapporto">
            <Input type="date" value={form.dataInizioRapporto} onChange={(e) => set('dataInizioRapporto', e.target.value)} />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Note">
            <textarea
              value={form.note}
              onChange={(e) => set('note', e.target.value)}
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
