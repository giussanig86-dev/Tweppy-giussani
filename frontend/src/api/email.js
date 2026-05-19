import axios from 'axios';

const BASE = '/api/email';
const h = (token) => ({ Authorization: `Bearer ${token}` });

export const emailApi = {
  scansiona: (token, ore = 24) =>
    axios.get(`${BASE}/scansiona`, { params: { ore }, headers: h(token) }).then(r => r.data),
  storico: (token, clienteId) =>
    axios.get(`${BASE}/storico/${clienteId}`, { headers: h(token) }).then(r => r.data),
};
