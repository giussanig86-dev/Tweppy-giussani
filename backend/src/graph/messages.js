const axios = require('axios');
const { createGraphClient } = require('./graphClient');

function mailboxPath(mailbox) {
  return mailbox && mailbox !== 'me' ? `/users/${mailbox}` : '/me';
}

async function getInboxMessages(accessToken, since, mailbox = 'me') {
  const client = createGraphClient(accessToken);
  const base = mailboxPath(mailbox);
  const filter = encodeURIComponent(`receivedDateTime gt ${since.toISOString()}`);
  const select = 'id,subject,from,receivedDateTime,bodyPreview,hasAttachments';
  const res = await client
    .api(`${base}/mailFolders/inbox/messages?$filter=${filter}&$select=${select}&$top=50`)
    .get();
  return res.value;
}

async function getMessageWithAttachments(accessToken, messageId, mailbox = 'me') {
  const client = createGraphClient(accessToken);
  const base = mailboxPath(mailbox);
  return client.api(`${base}/messages/${messageId}?$expand=attachments`).get();
}

async function getClientMessages(accessToken, clientEmail, top = 20, mailbox = 'me') {
  const client = createGraphClient(accessToken);
  const base = mailboxPath(mailbox);
  const filter = encodeURIComponent(`from/emailAddress/address eq '${clientEmail}'`);
  const select = 'id,subject,from,receivedDateTime,bodyPreview';
  const res = await client.api(`${base}/messages?$filter=${filter}&$select=${select}&$top=${top}`).get();
  return res.value;
}

async function getMessage(accessToken, messageId, mailbox = 'me') {
  const client = createGraphClient(accessToken);
  const base = mailboxPath(mailbox);
  const select = 'id,subject,from,toRecipients,receivedDateTime,body,conversationId';
  return client.api(`${base}/messages/${messageId}?$select=${select}`).get();
}

async function replyToMessage(accessToken, messageId, comment, mailbox = 'me') {
  const client = createGraphClient(accessToken);
  const base = mailboxPath(mailbox);
  await client.api(`${base}/messages/${messageId}/reply`).post({ comment });
}

async function streamAttachment(accessToken, messageId, attachmentId, mailbox = 'me') {
  const base = mailbox && mailbox !== 'me' ? `/users/${mailbox}` : '/me';
  const url = `https://graph.microsoft.com/v1.0${base}/messages/${messageId}/attachments/${attachmentId}/$value`;
  return axios.get(url, { headers: { Authorization: `Bearer ${accessToken}` }, responseType: 'stream' });
}

async function createReplyDraft(accessToken, messageId, comment, mailbox = 'me') {
  const client = createGraphClient(accessToken);
  const base = mailboxPath(mailbox);
  return client.api(`${base}/messages/${messageId}/createReply`).post({ comment });
}

async function addAttachmentToDraft(accessToken, draftId, attachment, mailbox = 'me') {
  const client = createGraphClient(accessToken);
  const base = mailboxPath(mailbox);
  await client.api(`${base}/messages/${draftId}/attachments`).post({
    '@odata.type': '#microsoft.graph.fileAttachment',
    ...attachment,
  });
}

async function sendDraft(accessToken, draftId, mailbox = 'me') {
  const client = createGraphClient(accessToken);
  const base = mailboxPath(mailbox);
  await client.api(`${base}/messages/${draftId}/send`).post({});
}

async function getSentToClient(accessToken, clientEmail, top = 20, mailbox = 'me') {
  const client = createGraphClient(accessToken);
  const base = mailboxPath(mailbox);
  const filter = encodeURIComponent(
    `toRecipients/any(r: r/emailAddress/address eq '${clientEmail}')`
  );
  const select = 'id,subject,toRecipients,sentDateTime,bodyPreview';
  const res = await client
    .api(`${base}/mailFolders/sentItems/messages?$filter=${filter}&$select=${select}&$top=${top}`)
    .get();
  return res.value;
}

module.exports = {
  getInboxMessages,
  getMessageWithAttachments,
  getClientMessages,
  getSentToClient,
  getMessage,
  replyToMessage,
  streamAttachment,
  createReplyDraft,
  addAttachmentToDraft,
  sendDraft,
};
