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

async function rawRequest(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
}

// ── SMB Auth ──────────────────────────────────────────────────────────────────

export function getUsers()  { return request('/auth/users'); }

export function login(smb_id) {
  return request('/auth/login', { method: 'POST', body: JSON.stringify({ smb_id }) });
}

// ── Banker Auth ───────────────────────────────────────────────────────────────

export function getBankers()  { return request('/auth/bankers'); }

export function bankerLogin(banker_id) {
  return request('/auth/banker-login', { method: 'POST', body: JSON.stringify({ banker_id }) });
}

// ── SMB Chat ──────────────────────────────────────────────────────────────────

export function sendMessage(smb_id, message) {
  return request('/chat', { method: 'POST', body: JSON.stringify({ smb_id, message }) });
}

export function getChatHistory(smb_id) {
  return request(`/chat/${smb_id}/history?limit=50`);
}

// ── SMB Data ──────────────────────────────────────────────────────────────────

export function getSMBProfile(smbId)       { return rawRequest(`/smb/${smbId}/profile`); }
export function getTransactions(smbId)     { return rawRequest(`/smb/${smbId}/transactions?limit=20`); }
export function getSMBEscalations(smbId)   { return rawRequest(`/smb/${smbId}/escalations`); }

// ── Banker: Leads / Credit ────────────────────────────────────────────────────

export function getLeads(status) {
  const qs = status ? `?status=${status}` : '';
  return rawRequest(`/banker/leads${qs}`);
}

export function submitDecision(leadId, body, bankerId) {
  const qs = bankerId ? `?banker_id=${bankerId}` : '';
  return rawRequest(`/banker/leads/${leadId}/decision${qs}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ── Banker: Portfolio ─────────────────────────────────────────────────────────

export function getBankerPortfolio() { return rawRequest('/banker/portfolio'); }

// ── Banker: SMB Profile + Brief ───────────────────────────────────────────────

export function getBankerSMBBrief(smbId) { return rawRequest(`/smb/${smbId}/profile`); }

// ── Banker: Notes ─────────────────────────────────────────────────────────────

export function getBankerNotes(smbId)  { return rawRequest(`/banker/smb/${smbId}/notes`); }

export function addBankerNote(smbId, note, bankerId) {
  const qs = bankerId ? `?banker_id=${bankerId}` : '';
  return rawRequest(`/banker/smb/${smbId}/notes${qs}`, {
    method: 'POST',
    body: JSON.stringify({ note }),
  });
}

// ── RM Event Stream (SSE) ─────────────────────────────────────────────────────

export function connectRMStream(onEvent) {
  const source = new EventSource('/banker/stream');

  source.addEventListener('chat_highlight', (e) => {
    onEvent(JSON.parse(e.data));
  });

  source.addEventListener('escalation', (e) => {
    onEvent(JSON.parse(e.data));
  });

  source.addEventListener('decision', (e) => {
    onEvent(JSON.parse(e.data));
  });

  source.onerror = () => {
    source.close();
    setTimeout(() => connectRMStream(onEvent), 3000);
  };

  return source;
}
