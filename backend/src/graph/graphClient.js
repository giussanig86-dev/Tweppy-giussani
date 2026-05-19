const { Client } = require('@microsoft/microsoft-graph-client');

function createGraphClient(accessToken) {
  return Client.init({
    authProvider: (done) => done(null, accessToken),
  });
}

module.exports = { createGraphClient };
