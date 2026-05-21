const { createGraphClient } = require('./graphClient');

function mailboxPath(mailbox) {
  return mailbox && mailbox !== 'me' ? `/users/${mailbox}` : '/me';
}

async function sendMail(accessToken, { to, subject, body, mailbox = 'me' }) {
  const client = createGraphClient(accessToken);
  const base = mailboxPath(mailbox);
  await client.api(`${base}/sendMail`).post({
    message: {
      subject,
      body: { contentType: 'HTML', content: body },
      toRecipients: [{ emailAddress: { address: to } }],
    },
    saveToSentItems: true,
  });
}

module.exports = { sendMail };
