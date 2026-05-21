import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../auth/useAuth';
import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || '';
const DEMO = import.meta.env.VITE_DEMO_MODE === 'true';

// Matrice permessi: cosa può fare ogni ruolo
const PERMESSI = {
  admin: null, // null = tutto
  collaboratore: new Set([
    'task.write',
    'comunicazioni.write',
    'calendario.write',
    'checklist.stato',
    'templates.usa',
    'documenti.genera',
    'workflow.avvia',
    'ocr.usa',
    'anagrafica.cartelle',
  ]),
  visualizzatore: new Set([]),
};

function puoFare(ruolo, azione) {
  if (!ruolo || ruolo === 'admin') return true;
  const set = PERMESSI[ruolo];
  if (!set) return false;
  return set.has(azione);
}

const RuoloContext = createContext({ ruolo: 'admin', utente: null, puoFare: () => true });

export function RuoloProvider({ children }) {
  const { getToken, account } = useAuth();
  const [ruolo, setRuolo] = useState('admin');
  const [utente, setUtente] = useState(null);

  useEffect(() => {
    if (!account) return;
    (async () => {
      try {
        const token = await getToken();
        const { data } = await axios.get(`${BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRuolo(data.ruolo || 'admin');
        setUtente(data);
      } catch {
        setRuolo('admin');
      }
    })();
  }, [account]);

  return (
    <RuoloContext.Provider value={{ ruolo, utente, puoFare: (azione) => puoFare(ruolo, azione) }}>
      {children}
    </RuoloContext.Provider>
  );
}

export function useRuolo() {
  return useContext(RuoloContext);
}
