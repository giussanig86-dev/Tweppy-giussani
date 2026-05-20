import axios from 'axios';

const BASE = '/api/checklist';
const h = (token) => ({ Authorization: `Bearer ${token}` });

export const checklistApi = {
  // Vista per-anno (tutti gli adempimenti dello studio)
  getAnno: (token, anno) =>
    axios.get(`${BASE}/anno/${anno}`, { headers: h(token) }).then(r => r.data),
  generaAnno: (token, anno) =>
    axios.post(`${BASE}/genera-anno`, { anno }, { headers: h(token) }).then(r => r.data),
  create: (token, item) =>
    axios.post(`${BASE}`, item, { headers: h(token) }).then(r => r.data),

  // Vista per-cliente
  get: (token, clienteId, anno) =>
    axios.get(`${BASE}/${clienteId}/${anno}`, { headers: h(token) }).then(r => r.data),
  genera: (token, cliente, anno) =>
    axios.post(`${BASE}/genera`, { cliente, anno }, { headers: h(token) }).then(r => r.data),

  // Aggiorna stato (condiviso)
  updateStato: (token, id, stato, note) =>
    axios.put(`${BASE}/${id}`, { stato, note }, { headers: h(token) }).then(r => r.data),
};
