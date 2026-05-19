import axios from 'axios';

const BASE = '/api/templates';
const h = (token) => ({ Authorization: `Bearer ${token}` });

export const templatesApi = {
  list:        (token) =>             axios.get(BASE, { headers: h(token) }).then(r => r.data),
  create:      (token, data) =>       axios.post(BASE, data, { headers: h(token) }).then(r => r.data),
  update:      (token, id, data) =>   axios.put(`${BASE}/${id}`, data, { headers: h(token) }).then(r => r.data),
  remove:      (token, id) =>         axios.delete(`${BASE}/${id}`, { headers: h(token) }).then(r => r.data),
  anteprima:   (token, templateId, clienteIds) =>
    axios.post(`${BASE}/anteprima`, { templateId, clienteIds }, { headers: h(token) }).then(r => r.data),
  inviaBatch:  (token, templateId, clienteIds) =>
    axios.post(`${BASE}/invia-batch`, { templateId, clienteIds }, { headers: h(token) }).then(r => r.data),
};
