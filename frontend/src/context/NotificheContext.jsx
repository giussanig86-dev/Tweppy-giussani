import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../auth/useAuth';
import axios from 'axios';

const NotificheContext = createContext({ taskCount: 0, emailCount: 0, refresh: () => {}, setEmailPrefs: () => {} });

const BASE = import.meta.env.VITE_API_URL || '';
const POLL_MS = 60_000;

function loadEmailPrefs(email) {
  try { return JSON.parse(localStorage.getItem(`mailbox_notifiche_${email || 'demo'}`) || '{}'); }
  catch { return {}; }
}

export function NotificheProvider({ children }) {
  const { getToken, account } = useAuth();
  const [taskCount, setTaskCount] = useState(0);
  const [emailCount, setEmailCount] = useState(0);
  // perCasella: { 'me': 3, 'info@studio.it': 5 }
  const [perCasella, setPerCasella] = useState({});
  const timerRef = useRef(null);

  const email = account?.username || 'demo';

  function calcEmailCount(pc) {
    const prefs = loadEmailPrefs(email);
    return Object.entries(pc).reduce((sum, [c, n]) => {
      const notifiche = prefs[c]?.notifiche ?? true;
      return sum + (notifiche ? n : 0);
    }, 0);
  }

  const fetch = useCallback(async () => {
    if (!account) return;
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };
      const [t, e] = await Promise.allSettled([
        axios.get(`${BASE}/api/tasks/badge`, { headers }),
        axios.get(`${BASE}/api/email/badge`, { headers }),
      ]);
      if (t.status === 'fulfilled') setTaskCount(t.value.data.count ?? 0);
      if (e.status === 'fulfilled') {
        const pc = e.value.data.perCasella ?? { me: e.value.data.count ?? 0 };
        setPerCasella(pc);
        setEmailCount(calcEmailCount(pc));
      }
    } catch {}
  }, [account, getToken]);

  // Ricalcola il badge email quando cambiano le preferenze
  function refreshEmailCount() {
    setEmailCount(calcEmailCount(perCasella));
  }

  useEffect(() => {
    fetch();
    timerRef.current = setInterval(fetch, POLL_MS);
    return () => clearInterval(timerRef.current);
  }, [fetch]);

  return (
    <NotificheContext.Provider value={{ taskCount, emailCount, perCasella, refresh: fetch, refreshEmailCount }}>
      {children}
    </NotificheContext.Provider>
  );
}

export function useNotifiche() {
  return useContext(NotificheContext);
}
