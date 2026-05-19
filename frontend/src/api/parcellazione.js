const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function headers(token) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

async function req(method, path, token, body) {
  const res = await fetch(`${BASE}/api/parcellazione${path}`, {
    method,
    headers: headers(token),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export const parcellazioneApi = {
  tariffario: (token) => req('GET', '/tariffario', token),
  listAttivita: (token, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req('GET', `/attivita${qs ? '?' + qs : ''}`, token);
  },
  createAttivita: (token, data) => req('POST', '/attivita', token, data),
  updateAttivita: (token, id, data) => req('PUT', `/attivita/${id}`, token, data),
  deleteAttivita: (token, id) => req('DELETE', `/attivita/${id}`, token),
  fattura: (token, ids) => req('POST', '/attivita/fattura', token, { ids }),
  taskCompletati: (token) => req('GET', '/task-completati', token),
  importaTask: (token, taskIds, voceId) => req('POST', '/importa-task', token, { taskIds, voceId }),
  dashboard: (token, anno) => {
    const qs = anno ? `?anno=${anno}` : '';
    return req('GET', `/dashboard${qs}`, token);
  },
};
