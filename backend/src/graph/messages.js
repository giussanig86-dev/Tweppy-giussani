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

async function createReplyAllDraft(accessToken, messageId, mailbox = 'me') {
  const client = createGraphClient(accessToken);
  const base = mailboxPath(mailbox);
  return client.api(`${base}/messages/${messageId}/createReplyAll`).post({});
}

async function createForwardDraft(accessToken, messageId, mailbox = 'me') {
  const client = createGraphClient(accessToken);
  const base = mailboxPath(mailbox);
  return client.api(`${base}/messages/${messageId}/createForward`).post({});
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

function parseRecipients(str) {
  return (str || '').split(/[,;]/).map(s => s.trim()).filter(Boolean)
    .map(addr => ({ emailAddress: { address: addr } }));
}

async function createDraftMessage(accessToken, { to, subject, body, cc = '', ccn = '' }, mailbox = 'me') {
  const client = createGraphClient(accessToken);
  const base = mailboxPath(mailbox);
  const message = {
    subject,
    body: { contentType: 'HTML', content: body },
    toRecipients: parseRecipients(to),
  };
  if (cc) message.ccRecipients = parseRecipients(cc);
  if (ccn) message.bccRecipients = parseRecipients(ccn);
  return client.api(`${base}/messages`).post(message);
}

async function updateDraft(accessToken, draftId, patch, mailbox = 'me') {
  const client = createGraphClient(accessToken);
  const base = mailboxPath(mailbox);
  await client.api(`${base}/messages/${draftId}`).patch(patch);
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
  createReplyAllDraft,
  createForwardDraft,
  addAttachmentToDraft,
  sendDraft,
  createDraftMessage,
  updateDraft,
};
