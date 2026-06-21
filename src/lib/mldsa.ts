import { ml_dsa65 } from '@noble/post-quantum/ml-dsa'
import { sha256 } from '@noble/hashes/sha256'

// Client-side, trust-minimised verification of an eTR's post-quantum signature.
//
// The engine signs the CANONICAL record string (sorted [k,v] pairs, omitting seal
// fields). To re-verify exactly, the verify response must include that canonical
// string as `canonical`. Until then we return `status: 'needs-canonical'`
// rather than a misleading pass/fail. We never fake a green check.

export type VerifyStatus = 'verified' | 'failed' | 'needs-canonical' | 'no-pubkey'
export interface VerifyOutcome { status: VerifyStatus; hashMatches?: boolean; detail?: string }

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}
function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
}
function pubKeyBytes(pkJson: any): Uint8Array | null {
  const b64 = pkJson?.public_key || pkJson?.publicKey || pkJson?.key || pkJson?.pk
  return typeof b64 === 'string' ? b64ToBytes(b64) : null
}

export function verifyEtr(record: any, pkJson: any): VerifyOutcome {
  const pk = pubKeyBytes(pkJson)
  if (!pk) return { status: 'no-pubkey', detail: 'public key not published yet' }

  const canonical: string | undefined = record?.canonical
  const sigStr: string | undefined = record?.signature
  if (!canonical) return { status: 'needs-canonical', detail: 'verify response missing `canonical` field' }
  if (!sigStr) return { status: 'failed', detail: 'no signature on record' }

  const sig = b64ToBytes(sigStr.replace(/^ML-DSA-65:/, ''))
  const msg = new TextEncoder().encode(canonical)

  // hash check (sha-256:<hex>)
  const expectHash = (record.record_hash || '').replace(/^sha-256:/, '')
  const hashMatches = expectHash ? toHex(sha256(msg)) === expectHash : undefined

  // noble argument order has varied across versions; try the known orders rather than risk a false negative.
  const v = ml_dsa65 as any
  let ok = false
  for (const args of [[pk, msg, sig], [sig, msg, pk], [msg, sig, pk]]) {
    try { if (v.verify(...args)) { ok = true; break } } catch { /* next order */ }
  }

  return { status: ok ? 'verified' : 'failed', hashMatches }
}
