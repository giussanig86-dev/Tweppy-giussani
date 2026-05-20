import { app, authentication } from '@microsoft/teams-js';

let _promise = null;
let _inTeams = false;
let _account = null;

export async function initTeams() {
  if (_promise) return _promise;
  _promise = new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), 2000);
    app
      .initialize()
      .then(() => app.getContext())
      .then((ctx) => {
        clearTimeout(timer);
        _inTeams = true;
        _account = {
          name: ctx.user?.displayName || ctx.user?.loginHint || 'Utente',
          username: ctx.user?.loginHint || '',
        };
        resolve(true);
      })
      .catch(() => {
        clearTimeout(timer);
        resolve(false);
      });
  });
  return _promise;
}

export function isInTeams() { return _inTeams; }
export function getTeamsAccount() { return _account; }
export async function getTeamsToken() { return authentication.getAuthToken(); }
