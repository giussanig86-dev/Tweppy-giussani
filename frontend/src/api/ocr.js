import axios from 'axios';

const h = (token) => ({ Authorization: `Bearer ${token}` });

export const ocrApi = {
  estrai: (token, file, tipoDocumento) => {
    const form = new FormData();
    form.append('documento', file);
    form.append('tipoDocumento', tipoDocumento);
    return axios.post('/api/ocr/estrai', form, { headers: h(token) }).then((r) => r.data);
  },
  salva: (token, file, { clienteId, ragioneSociale, tipoDocumento }) => {
    const form = new FormData();
    form.append('documento', file);
    form.append('clienteId', clienteId || '');
    form.append('ragioneSociale', ragioneSociale);
    form.append('tipoDocumento', tipoDocumento);
    return axios.post('/api/ocr/salva', form, { headers: h(token) }).then((r) => r.data);
  },
};
