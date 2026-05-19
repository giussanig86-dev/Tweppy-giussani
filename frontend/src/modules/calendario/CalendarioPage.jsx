import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/useAuth';
import { calendarioApi } from '../../api/calendario';
import EventoForm from './EventoForm';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';

const GIORNI = ['Lun','Mar','Mer','Gio','Ven','Sab','Dom'];
const MESI_IT = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno',
                 'Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];

const TIPO_COLOR = {
  riunione:    'bg-blue-100 text-blue-800',
  appuntamento:'bg-green-100 text-green-800',
  udienza:     'bg-red-100 text-red-800',
  scadenza:    'bg-yellow-100 text-yellow-800',
  altro:       'bg-gray-100 text-gray-600',
};

function pad(n) { return String(n).padStart(2, '0'); }
function isoDate(y, m, d) { return `${y}-${pad(m+1)}-${pad(d)}`; }

function buildGrid(year, month) {
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7; // Monday=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function getEventDate(ev) {
  const dt = ev.start?.dateTime || ev.inizio || '';
  return dt.slice(0, 10);
}

function formatTime(dt) {
  if (!dt) return '';
  return new Date(dt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}

export default function CalendarioPage() {
  const { getToken } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [eventi, setEventi] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [error, setError] = useState(null);

  async function loadEventi(y, m) {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const start = isoDate(y, m, 1);
      const end   = isoDate(y, m, new Date(y, m + 1, 0).getDate());
      setEventi(await calendarioApi.getEventi(token, start, end));
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }

  useEffect(() => { loadEventi(year, month); }, [year, month]);

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }
  function goToday() { setYear(now.getFullYear()); setMonth(now.getMonth()); }

  function openNew(dateStr) { setSelectedEvent(null); setSelectedDate(dateStr); setModalOpen(true); }
  function openEdit(ev) { setSelectedEvent(ev); setSelectedDate(null); setModalOpen(true); }
  function closeModal() { setModalOpen(false); setSelectedEvent(null); setSelectedDate(null); }

  async function handleSave(data) {
    const token = await getToken();
    if (selectedEvent?.id) await calendarioApi.updateEvento(token, selectedEvent.id, data);
    else await calendarioApi.createEvento(token, data);
    closeModal();
    loadEventi(year, month);
  }

  async function handleDelete(id) {
    if (!confirm('Eliminare l\'evento?')) return;
    const token = await getToken();
    await calendarioApi.deleteEvento(token, id);
    closeModal();
    loadEventi(year, month);
  }

  const cells = buildGrid(year, month);
  const todayStr = isoDate(now.getFullYear(), now.getMonth(), now.getDate());

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Calendario Studio</h1>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={goToday}>Oggi</Button>
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-100 transition">‹</button>
          <span className="font-semibold text-lg w-44 text-center">{MESI_IT[month]} {year}</span>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-100 transition">›</button>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      {loading && <p className="text-gray-400 text-sm mb-2">Caricamento eventi...</p>}

      {/* Griglia calendario */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {/* Intestazione giorni */}
        <div className="grid grid-cols-7 border-b">
          {GIORNI.map(g => (
            <div key={g} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase">{g}</div>
          ))}
        </div>

        {/* Celle giorni */}
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            const dateStr = day ? isoDate(year, month, day) : null;
            const dayEvents = day ? eventi.filter(e => getEventDate(e) === dateStr) : [];
            const isToday = dateStr === todayStr;
            const isWeekend = idx % 7 >= 5;

            return (
              <div
                key={idx}
                onClick={() => day && openNew(dateStr)}
                className={`min-h-24 p-1.5 border-r border-b last:border-r-0 transition cursor-pointer
                  ${!day ? 'bg-gray-50 cursor-default' : isWeekend ? 'bg-gray-50/50 hover:bg-blue-50/30' : 'hover:bg-blue-50/30'}
                  ${isToday ? 'bg-blue-50' : ''}`}
              >
                {day && (
                  <>
                    <span className={`inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full
                      ${isToday ? 'bg-brand-500 text-white' : 'text-gray-700'}`}>
                      {day}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {dayEvents.slice(0, 3).map((ev, i) => {
                        const tipo = ev.categories?.[0] || 'altro';
                        return (
                          <button
                            key={i}
                            onClick={(e) => { e.stopPropagation(); openEdit(ev); }}
                            className={`block w-full text-left text-xs px-1.5 py-0.5 rounded truncate font-medium ${TIPO_COLOR[tipo] || TIPO_COLOR.altro}`}
                          >
                            {formatTime(ev.start?.dateTime)} {ev.subject || ev.titolo}
                          </button>
                        );
                      })}
                      {dayEvents.length > 3 && (
                        <p className="text-xs text-gray-400 px-1">+{dayEvents.length - 3} altri</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legenda */}
      <div className="flex gap-4 mt-3 text-xs text-gray-500">
        {Object.entries(TIPO_COLOR).map(([tipo, cls]) => (
          <div key={tipo} className="flex items-center gap-1">
            <span className={`w-2.5 h-2.5 rounded-full inline-block ${cls.split(' ')[0]}`} />
            <span className="capitalize">{tipo}</span>
          </div>
        ))}
        <span className="ml-2 text-gray-400">· Clicca su un giorno per aggiungere un evento</span>
      </div>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={selectedEvent ? 'Modifica Evento' : 'Nuovo Evento'}
      >
        <EventoForm
          initial={selectedEvent}
          selectedDate={selectedDate}
          onSave={handleSave}
          onCancel={closeModal}
          onDelete={handleDelete}
        />
      </Modal>
    </div>
  );
}
