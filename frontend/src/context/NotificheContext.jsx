import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../auth/useAuth';
import axios from 'axios';

const NotificheContext = createContext({ taskCount: 0, emailCount: 0, refresh: () => {} });

const BASE = import.meta.env.VITE_API_URL || '';
const DEMO = import.meta.env.VITE_DEMO_MODE === 'true';
const POLL_MS = 60_000;

export function NotificheProvider({ children }) {
  const { getToken, account } = useAuth();
  const [taskCount, setTaskCount] = useState(0);
  const [emailCount, setEmailCount] = useState(0);
  const timerRef = useRef(null);

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
      if (e.status === 'fulfilled') setEmailCount(e.value.data.count ?? 0);
    } catch {}
  }, [account, getToken]);

  useEffect(() => {
    fetch();
    timerRef.current = setInterval(fetch, POLL_MS);
    return () => clearInterval(timerRef.current);
  }, [fetch]);

  return (
    <NotificheContext.Provider value={{ taskCount, emailCount, refresh: fetch }}>
      {children}
    </NotificheContext.Provider>
  );
}

export function useNotifiche() {
  return useContext(NotificheContext);
}
