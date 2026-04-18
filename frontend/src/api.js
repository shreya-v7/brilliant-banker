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

/** Defensive dedupe if duplicate lead rows ever slip through (e.g. before DB normalize). */
function dedupeLeadsById(rows) {
  if (!Array.isArray(rows)) return rows;
  const seen = new Set();
  return rows.filter((r) => {
    if (!r?.id || seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
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
export function getSMBEscalations(smbId) {
  return rawRequest(`/smb/${smbId}/escalations`).then(dedupeLeadsById);
}

// ── Banker: Leads / Credit ────────────────────────────────────────────────────

export function getLeads(status) {
  const qs = status ? `?status=${status}` : '';
  return rawRequest(`/banker/leads${qs}`).then(dedupeLeadsById);
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

// ── User testing surveys ─────────────────────────────────────────────────────

export function submitSurvey(payload) {
  return request('/survey/submit', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getSurveyResults(password) {
  const q = new URLSearchParams({ password });
  return request(`/survey/results?${q.toString()}`);
}

export function getSurveyExportUrl(password) {
  const q = new URLSearchParams({ password });
  return `/api/survey/export?${q.toString()}`;
}
