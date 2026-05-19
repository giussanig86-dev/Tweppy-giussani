const { createGraphClient } = require('./graphClient');

async function sendMail(accessToken, { to, subject, body }) {
  const client = createGraphClient(accessToken);
  await client.api('/me/sendMail').post({
    message: {
      subject,
      body: { contentType: 'HTML', content: body },
      toRecipients: [{ emailAddress: { address: to } }],
    },
    saveToSentItems: true,
  });
}

module.exports = { sendMail };
