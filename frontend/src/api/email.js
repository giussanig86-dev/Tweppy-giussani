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
  rispondi: (token, messageId, testo, mailbox, files = []) => {
    if (!files || files.length === 0) {
      return axios.post(`${BASE}/rispondi/${messageId}`, { testo, mailbox }, { headers: h(token) }).then(r => r.data);
    }
    const fd = new FormData();
    fd.append('testo', testo);
    fd.append('mailbox', mailbox);
    files.forEach(f => fd.append('files', f));
    return axios.post(`${BASE}/rispondi/${messageId}`, fd, { headers: h(token) }).then(r => r.data);
  },
  taskDaMail: (token, data) =>
    axios.post(`${BASE}/task-da-mail`, data, { headers: h(token) }).then(r => r.data),
  listNote: (token, messageId) =>
    axios.get(`${BASE}/note/${messageId}`, { headers: h(token) }).then(r => r.data),
  addNota: (token, messageId, data) =>
    axios.post(`${BASE}/note/${messageId}`, data, { headers: h(token) }).then(r => r.data),
};
