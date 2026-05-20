import { useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { loginScopes } from './msalConfig';
import { initTeams, isInTeams, getTeamsAccount, getTeamsToken } from './teamsAuth';

const DEMO = import.meta.env.VITE_DEMO_MODE === 'true';

function useTeamsDetection() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initTeams().then(() => setReady(true));
  }, []);

  return ready;
}

export function useAuth() {
  const teamsReady = useTeamsDetection();
  const { instance, accounts } = useMsal();

  if (DEMO) {
    return {
      account: { name: 'Giorgio Demo', username: 'giorgio@studiogds.it' },
      getToken: async () => 'demo-token',
      login: () => {},
      logout: () => {},
    };
  }

  const inTeams = teamsReady && isInTeams();
  const msalAccount = accounts[0];
  const account = inTeams ? getTeamsAccount() : (msalAccount ?? null);

  async function getToken() {
    if (inTeams) return getTeamsToken();
    if (!msalAccount) return null;
    try {
      const result = await instance.acquireTokenSilent({ ...loginScopes, account: msalAccount });
      return result.accessToken;
    } catch {
      const result = await instance.acquireTokenPopup(loginScopes);
      return result.accessToken;
    }
  }

  function login() {
    if (!inTeams) instance.loginPopup(loginScopes);
  }

  function logout() {
    if (!inTeams) instance.logoutPopup({ account: msalAccount });
  }

  return { account, getToken, login, logout };
}
