const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
}

export function getUsers() {
  return request('/auth/users');
}

export function login(smb_id) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ smb_id }),
  });
}

export function sendMessage(smb_id, message) {
  return request('/chat', {
    method: 'POST',
    body: JSON.stringify({ smb_id, message }),
  });
}

export function getChatHistory(smb_id) {
  return request(`/chat/${smb_id}/history?limit=50`);
}

export function getLeads(status) {
  const qs = status ? `?status=${status}` : '';
  return fetch(`/banker/leads${qs}`).then(r => r.json());
}

export function submitDecision(leadId, body) {
  return fetch(`/banker/leads/${leadId}/decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(r => r.json());
}

export function getSMBProfile(smbId) {
  return fetch(`/smb/${smbId}/profile`).then(r => r.json());
}
