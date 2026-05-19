import axios from 'axios';

const BASE = '/api/anagrafica';

function headers(token) {
  return { Authorization: `Bearer ${token}` };
}

export const anagraficaApi = {
  list: (token) => axios.get(BASE, { headers: headers(token) }).then((r) => r.data),
  get: (token, id) => axios.get(`${BASE}/${id}`, { headers: headers(token) }).then((r) => r.data),
  create: (token, data) => axios.post(BASE, data, { headers: headers(token) }).then((r) => r.data),
  update: (token, id, data) => axios.put(`${BASE}/${id}`, data, { headers: headers(token) }).then((r) => r.data),
  remove: (token, id) => axios.delete(`${BASE}/${id}`, { headers: headers(token) }).then((r) => r.data),
};
