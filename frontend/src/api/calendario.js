import axios from 'axios';

const BASE = '/api/calendario';
const h = (token) => ({ Authorization: `Bearer ${token}` });

export const calendarioApi = {
  getEventi:    (token, start, end) => axios.get(`${BASE}/eventi`, { params: { start, end }, headers: h(token) }).then(r => r.data),
  createEvento: (token, data)       => axios.post(`${BASE}/eventi`, data, { headers: h(token) }).then(r => r.data),
  updateEvento: (token, id, data)   => axios.put(`${BASE}/eventi/${id}`, data, { headers: h(token) }).then(r => r.data),
  deleteEvento: (token, id)         => axios.delete(`${BASE}/eventi/${id}`, { headers: h(token) }).then(r => r.data),

  listChat:     (token, eventoId)   => axios.get(`${BASE}/chat/${eventoId}`, { headers: h(token) }).then(r => r.data),
  sendChat:     (token, eventoId, data) => axios.post(`${BASE}/chat/${eventoId}`, data, { headers: h(token) }).then(r => r.data),
  creaRiepilogo:  (token, eventoId, data) => axios.post(`${BASE}/riepilogo/${eventoId}`, data, { headers: h(token) }).then(r => r.data),
  autoRiepilogo:  (token)               => axios.post(`${BASE}/auto-riepilogo`, {}, { headers: h(token) }).then(r => r.data),
};
