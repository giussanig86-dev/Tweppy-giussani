import axios from 'axios';

const BASE = '/api/documenti';
const h = (token) => ({ Authorization: `Bearer ${token}` });

export const documentiApi = {
  templates: (token) =>
    axios.get(`${BASE}/templates`, { headers: h(token) }).then((r) => r.data),
  genera: (token, clienteId, templateId, salvaSharePoint = false) =>
    axios.post(
      `${BASE}/genera`,
      { clienteId, templateId, salvaSharePoint },
      { headers: h(token), responseType: 'blob' }
    ).then((r) => r.data),
};
