import axios from 'axios';

const BASE = '/api/workflow';
const h = (token) => ({ Authorization: `Bearer ${token}` });

export const workflowApi = {
  list:    (token) =>             axios.get(BASE, { headers: h(token) }).then(r => r.data),
  create:  (token, data) =>       axios.post(BASE, data, { headers: h(token) }).then(r => r.data),
  update:  (token, id, data) =>   axios.put(`${BASE}/${id}`, data, { headers: h(token) }).then(r => r.data),
  remove:  (token, id) =>         axios.delete(`${BASE}/${id}`, { headers: h(token) }).then(r => r.data),
  esegui:  (token, id, cliente) =>
    axios.post(`${BASE}/${id}/esegui`, { cliente }, { headers: h(token) }).then(r => r.data),
};
