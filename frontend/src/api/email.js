import axios from 'axios';

const BASE = '/api/email';
const h = (token) => ({ Authorization: `Bearer ${token}` });

export const emailApi = {
  scansiona: (token, ore = 24) =>
    axios.get(`${BASE}/scansiona`, { params: { ore }, headers: h(token) }).then(r => r.data),
  storico: (token, clienteId) =>
    axios.get(`${BASE}/storico/${clienteId}`, { headers: h(token) }).then(r => r.data),
  caselle: (token) =>
    axios.get(`${BASE}/caselle`, { headers: h(token) }).then(r => r.data),
  getMessage: (token, messageId, mailbox) =>
    axios.get(`${BASE}/messaggio/${messageId}`, { params: { mailbox }, headers: h(token) }).then(r => r.data),
  allegati: (token, messageId, mailbox) =>
    axios.get(`${BASE}/allegati/${messageId}`, { params: { mailbox }, headers: h(token) }).then(r => r.data),
  streamAllegato: (token, messageId, attachmentId, name, contentType, mailbox) =>
    axios.get(`${BASE}/allegati/${messageId}/${attachmentId}/stream`,
      { params: { mailbox, name, contentType }, headers: h(token), responseType: 'blob' }
    ).then(r => r.data),
  sharepointUrl: (token, clienteId) =>
    axios.get(`${BASE}/sharepoint-url/${clienteId}`, { headers: h(token) }).then(r => r.data),
  sconosciuti: (token, ore = 168) =>
    axios.get(`${BASE}/sconosciuti`, { params: { ore }, headers: h(token) }).then(r => r.data),
  rispondi: (token, messageId, { html = '', cc = '', ccn = '', mailbox = 'me', files = [] }) => {
    if (!files?.length) return axios.post(`${BASE}/rispondi/${messageId}`, { html, cc, ccn, mailbox }, { headers: h(token) }).then(r => r.data);
    const fd = new FormData();
    fd.append('html', html); fd.append('cc', cc); fd.append('ccn', ccn); fd.append('mailbox', mailbox);
    files.forEach(f => fd.append('files', f));
    return axios.post(`${BASE}/rispondi/${messageId}`, fd, { headers: h(token) }).then(r => r.data);
  },
  rispondiATutti: (token, messageId, { html = '', cc = '', ccn = '', mailbox = 'me', files = [] }) => {
    if (!files?.length) return axios.post(`${BASE}/rispondi-a-tutti/${messageId}`, { html, cc, ccn, mailbox }, { headers: h(token) }).then(r => r.data);
    const fd = new FormData();
    fd.append('html', html); fd.append('cc', cc); fd.append('ccn', ccn); fd.append('mailbox', mailbox);
    files.forEach(f => fd.append('files', f));
    return axios.post(`${BASE}/rispondi-a-tutti/${messageId}`, fd, { headers: h(token) }).then(r => r.data);
  },
  inoltra: (token, messageId, { a = '', html = '', cc = '', ccn = '', mailbox = 'me', files = [] }) => {
    if (!files?.length) return axios.post(`${BASE}/inoltra/${messageId}`, { a, html, cc, ccn, mailbox }, { headers: h(token) }).then(r => r.data);
    const fd = new FormData();
    fd.append('a', a); fd.append('html', html); fd.append('cc', cc); fd.append('ccn', ccn); fd.append('mailbox', mailbox);
    files.forEach(f => fd.append('files', f));
    return axios.post(`${BASE}/inoltra/${messageId}`, fd, { headers: h(token) }).then(r => r.data);
  },
  invia: (token, { a, cc = '', ccn = '', oggetto, html = '', mailbox = 'me', clienteId = '', files = [] }) => {
    if (!files?.length) return axios.post(`${BASE}/invia`, { a, cc, ccn, oggetto, html, mailbox, clienteId }, { headers: h(token) }).then(r => r.data);
    const fd = new FormData();
    fd.append('a', a); fd.append('cc', cc); fd.append('ccn', ccn); fd.append('oggetto', oggetto);
    fd.append('html', html); fd.append('mailbox', mailbox); fd.append('clienteId', clienteId || '');
    files.forEach(f => fd.append('files', f));
    return axios.post(`${BASE}/invia`, fd, { headers: h(token) }).then(r => r.data);
  },
  taskDaMail: (token, data) =>
    axios.post(`${BASE}/task-da-mail`, data, { headers: h(token) }).then(r => r.data),
  listNote: (token, messageId) =>
    axios.get(`${BASE}/note/${messageId}`, { headers: h(token) }).then(r => r.data),
  addNota: (token, messageId, data) =>
    axios.post(`${BASE}/note/${messageId}`, data, { headers: h(token) }).then(r => r.data),
};
