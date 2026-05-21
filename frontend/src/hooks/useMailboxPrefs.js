import { useState, useCallback } from 'react';
import { useAuth } from '../auth/useAuth';

const DEFAULT = { visibile: true, notifiche: true };

function storageKey(email) {
  return `mailbox_prefs_${email || 'demo'}`;
}

export function useMailboxPrefs(caselle = []) {
  const { account } = useAuth();
  const email = account?.username || 'demo';

  function load() {
    try {
      return JSON.parse(localStorage.getItem(storageKey(email)) || '{}');
    } catch { return {}; }
  }

  const [prefs, setPrefs] = useState(load);

  function getPref(casella) {
    return prefs[casella] ?? DEFAULT;
  }

  const setPref = useCallback((casella, campo, valore) => {
    setPrefs(prev => {
      const next = { ...prev, [casella]: { ...(prev[casella] ?? DEFAULT), [campo]: valore } };
      localStorage.setItem(storageKey(email), JSON.stringify(next));
      return next;
    });
  }, [email]);

  const caselleVisibili = caselle.filter(c => getPref(c).visibile);
  const caselleNotifiche = caselle.filter(c => getPref(c).notifiche);

  return { getPref, setPref, caselleVisibili, caselleNotifiche };
}
