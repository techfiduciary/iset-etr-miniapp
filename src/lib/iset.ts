// Thin client for the EXISTING ISET eTR engine. The MiniApp never signs records
// itself — issuance, ML-DSA-65 signing and the registry of record all live here.
const BASE = (import.meta.env.VITE_ISET_API_BASE || 'https://iset.finance').replace(/\/$/, '')

// Session token from SIWE sign-in (kept in memory only; also set as a cookie by the API).
let sessionToken: string | null = null
export function setSession(t: string | null) { sessionToken = t }
export function hasSession() { return Boolean(sessionToken) }

function authHeaders(): Record<string, string> {
  return sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}
}

async function asJson(res: Response) {
  const text = await res.text()
  let body: any = null
  try { body = text ? JSON.parse(text) : null } catch { /* non-json */ }
  if (!res.ok) throw new Error(body?.error || body?.isp_name || `HTTP ${res.status}`)
  return body
}

export interface EpnInput {
  amount: string
  currency: string
  holder_ref: string
  memo?: string
  fields?: Record<string, string>
}

export interface IssueResult {
  etr_id: string
  instrument: string
  instrument_name?: string
  amount: string
  currency: string
  status: string
  sandbox?: boolean
  signature: string
  signature_alg: string
  record_hash: string
  audit_id: string
  court_admissible?: boolean
  verify_path?: string
}

export async function issueEpn(input: EpnInput): Promise<IssueResult> {
  return issueEtr('ePN', input)
}

// Generic issuance for any eTR instrument (ePN, eINV, eBL, eWR, eLC, eBE).
export async function issueEtr(type: string, input: EpnInput): Promise<IssueResult> {
  const res = await fetch(`${BASE}/api/etr/issue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ type, ...input }),
  })
  return asJson(res)
}

export async function verifyRecord(id: string): Promise<any> {
  const res = await fetch(`${BASE}/api/etr/verify/${encodeURIComponent(id)}`)
  return asJson(res)
}

export async function fetchPublicKey(): Promise<any> {
  const res = await fetch(`${BASE}/.well-known/ml-dsa65-public.json`)
  return asJson(res)
}

// ── SIWE (wallet sign-in) — backend endpoints added per BACKEND-PATCH.md ───────
export async function siweNonce(address: string): Promise<string> {
  const res = await fetch(`${BASE}/api/auth/siwe/nonce`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address }),
  })
  const body = await asJson(res)
  return body.nonce
}

export async function siweVerify(message: string, signature: string): Promise<{ subject: string; session_token: string }> {
  const res = await fetch(`${BASE}/api/auth/siwe/verify`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, signature }),
  })
  const body = await asJson(res)
  if (body?.session_token) setSession(body.session_token)
  return body
}

export function canonicalVerifyUrl(id: string): string {
  return `${BASE}/record/?id=${encodeURIComponent(id)}`
}

// ── Subscriber profile (white-label branding) ─────────────────────────────────
export interface SubscriberProfile { name?: string; logo?: string | null; color?: string; verify?: string }

export async function getSubscriber(): Promise<any> {
  const res = await fetch(`${BASE}/api/subscriber`, { headers: authHeaders() })
  return asJson(res)
}
export async function saveSubscriber(p: SubscriberProfile): Promise<any> {
  const res = await fetch(`${BASE}/api/subscriber`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(p),
  })
  return asJson(res)
}

// ── My records ────────────────────────────────────────────────────────────────
export async function listEtr(): Promise<any[]> {
  const res = await fetch(`${BASE}/api/etr/list`, { headers: authHeaders() })
  const body = await asJson(res)
  return body?.records || body?.out || body?.items || (Array.isArray(body) ? body : [])
}

// Re-verify a single ledger event against the audit trail (court-admissible).
export async function getAudit(id: string): Promise<any> {
  const res = await fetch(`${BASE}/api/audit/${encodeURIComponent(id)}`)
  return asJson(res)
}
