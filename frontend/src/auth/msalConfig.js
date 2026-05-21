const isAddin = typeof window !== 'undefined' && window.location.pathname.startsWith('/outlook');

export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID || 'fake-client-id',
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID || 'fake-tenant-id'}`,
    redirectUri: isAddin
      ? `${window.location.origin}/outlook`
      : (import.meta.env.VITE_REDIRECT_URI || 'http://localhost:5173'),
  },
  cache: {
    cacheLocation: 'localStorage',
  },
};

export const loginScopes = {
  scopes: ['User.Read', 'Mail.ReadWrite', 'Calendars.ReadWrite', 'Sites.ReadWrite.All', 'Files.ReadWrite.All'],
};
