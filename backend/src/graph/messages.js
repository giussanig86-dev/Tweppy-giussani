const { createGraphClient } = require('./graphClient');

async function getInboxMessages(accessToken, since) {
  const client = createGraphClient(accessToken);
  const filter = encodeURIComponent(`receivedDateTime gt ${since.toISOString()}`);
  const select = 'id,subject,from,receivedDateTime,bodyPreview,hasAttachments';
  const res = await client
    .api(`/me/mailFolders/inbox/messages?$filter=${filter}&$select=${select}&$top=50`)
    .get();
  return res.value;
}

async function getMessageWithAttachments(accessToken, messageId) {
  const client = createGraphClient(accessToken);
  return client.api(`/me/messages/${messageId}?$expand=attachments`).get();
}

async function getClientMessages(accessToken, clientEmail, top = 20) {
  const client = createGraphClient(accessToken);
  const filter = encodeURIComponent(`from/emailAddress/address eq '${clientEmail}'`);
  const select = 'id,subject,from,receivedDateTime,bodyPreview';
  const res = await client.api(`/me/messages?$filter=${filter}&$select=${select}&$top=${top}`).get();
  return res.value;
}

module.exports = { getInboxMessages, getMessageWithAttachments, getClientMessages };
