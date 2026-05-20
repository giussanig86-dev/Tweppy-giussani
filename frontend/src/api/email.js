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
  rispondi: (token, messageId, testo, mailbox) =>
    axios.post(`${BASE}/rispondi/${messageId}`, { testo, mailbox }, { headers: h(token) }).then(r => r.data),
  taskDaMail: (token, data) =>
    axios.post(`${BASE}/task-da-mail`, data, { headers: h(token) }).then(r => r.data),
  allegati: (token, messageId, mailbox) =>
    axios.get(`${BASE}/allegati/${messageId}`, { params: { mailbox }, headers: h(token) }).then(r => r.data),
};
