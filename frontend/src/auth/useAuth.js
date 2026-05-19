import { useMsal } from '@azure/msal-react';
import { loginScopes } from './msalConfig';

export function useAuth() {
  const { instance, accounts } = useMsal();
  const account = accounts[0];

  async function getToken() {
    if (!account) return null;
    try {
      const result = await instance.acquireTokenSilent({ ...loginScopes, account });
      return result.accessToken;
    } catch {
      const result = await instance.acquireTokenPopup(loginScopes);
      return result.accessToken;
    }
  }

  function login() {
    instance.loginPopup(loginScopes);
  }

  function logout() {
    instance.logoutPopup({ account });
  }

  return { account, getToken, login, logout };
}
