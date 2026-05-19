const { ConfidentialClientApplication } = require('@azure/msal-node');

const msalConfig = {
  auth: {
    clientId: process.env.AZURE_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
    clientSecret: process.env.AZURE_CLIENT_SECRET,
  },
};

const msalClient = new ConfidentialClientApplication(msalConfig);

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token mancante' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const result = await msalClient.acquireTokenOnBehalfOf({
      oboAssertion: token,
      scopes: [
        'https://graph.microsoft.com/Sites.ReadWrite.All',
        'https://graph.microsoft.com/Files.ReadWrite.All',
      ],
    });

    req.graphToken = result.accessToken;
    next();
  } catch {
    // In sviluppo con token fittizi, bypassa la verifica
    if (process.env.NODE_ENV === 'development') {
      req.graphToken = 'dev-token';
      return next();
    }
    return res.status(401).json({ error: 'Token non valido' });
  }
}

module.exports = authMiddleware;
