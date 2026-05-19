import axios from 'axios';

const BASE = '/api/calendario';
const h = (token) => ({ Authorization: `Bearer ${token}` });

export const calendarioApi = {
  getEventi:    (token, start, end) =>   axios.get(`${BASE}/eventi`, { params: { start, end }, headers: h(token) }).then(r => r.data),
  createEvento: (token, data) =>         axios.post(`${BASE}/eventi`, data, { headers: h(token) }).then(r => r.data),
  updateEvento: (token, id, data) =>     axios.put(`${BASE}/eventi/${id}`, data, { headers: h(token) }).then(r => r.data),
  deleteEvento: (token, id) =>           axios.delete(`${BASE}/eventi/${id}`, { headers: h(token) }).then(r => r.data),
};
