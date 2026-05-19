import axios from 'axios';

const BASE = '/api/checklist';
const h = (token) => ({ Authorization: `Bearer ${token}` });

export const checklistApi = {
  get: (token, clienteId, anno) =>
    axios.get(`${BASE}/${clienteId}/${anno}`, { headers: h(token) }).then((r) => r.data),
  genera: (token, cliente, anno) =>
    axios.post(`${BASE}/genera`, { cliente, anno }, { headers: h(token) }).then((r) => r.data),
  updateStato: (token, id, stato, note) =>
    axios.put(`${BASE}/${id}`, { stato, note }, { headers: h(token) }).then((r) => r.data),
};
