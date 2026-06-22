import { useEffect, useState } from 'react'
import { useReadContract } from 'wagmi'
import QRCode from 'qrcode'
import { IconLock, IconDatabase, IconLink, IconBuilding, IconAt } from '@tabler/icons-react'
import { verifyRecord, fetchPublicKey, canonicalVerifyUrl, getAudit } from '../lib/iset'
import { verifyEtr, type VerifyOutcome } from '../lib/mldsa'
import { ANCHOR_ADDRESS, ANCHOR_ABI } from '../lib/chain'

const STATUS_LABEL: Record<string, string> = {
  verified: '✓ Post-quantum signature verified',
  failed: '✗ Signature did NOT verify',
  'needs-canonical': '◐ Server-verified · client re-check pending',
  'no-pubkey': '◐ Public key not published yet',
}

function fmt(at?: string): string { if (!at) return ''; try { return new Date(at).toLocaleString() } catch { return at } }
function money(n: any): string { const v = Number(n); return isFinite(v) && n != null && n !== '' ? v.toLocaleString() : String(n ?? '') }

export default function Verify({ initialId }: { initialId?: string }) {
  const [id, setId] = useState(initialId || '')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [resp, setResp] = useState<any>(null)
  const [outcome, setOutcome] = useState<VerifyOutcome | null>(null)
  const [qr, setQr] = useState('')
  const [audits, setAudits] = useState<Record<string, 'ok' | 'bad' | 'loading'>>({})

  useEffect(() => { if (initialId) { setId(initialId); void run(initialId) } /* eslint-disable-next-line */ }, [initialId])

  async function run(theId: string) {
    const rid = theId.trim(); if (!rid) return
    setLoading(true); setErr(''); setResp(null); setOutcome(null); setQr(''); setAudits({})
    try {
      const r = await verifyRecord(rid)
      setResp(r)
      const record = r?.record || r
      try { setOutcome(verifyEtr(record, await fetchPublicKey())) } catch { setOutcome({ status: 'no-pubkey' }) }
      try { setQr(await QRCode.toDataURL(canonicalVerifyUrl(rid), { margin: 1, width: 170 })) } catch { /* noop */ }
    } catch (e: any) { setErr(e?.message || 'Lookup failed') } finally { setLoading(false) }
  }

  async function verifyEvent(auditId: string) {
    if (!auditId) return
    setAudits((a) => ({ ...a, [auditId]: 'loading' }))
    try {
      const d = await getAudit(auditId)
      const ok = d?.signature_valid === true || d?.verified === true || d?.valid === true
      setAudits((a) => ({ ...a, [auditId]: ok ? 'ok' : 'bad' }))
    } catch { setAudits((a) => ({ ...a, [auditId]: 'bad' })) }
  }

  const rec = resp?.record || resp
  const brand = resp?.brand || null

  // Real on-chain signal: is this record anchored on Celo?
  const { data: anchorData } = useReadContract({
    address: ANCHOR_ADDRESS ? (ANCHOR_ADDRESS as `0x${string}`) : undefined,
    abi: ANCHOR_ABI, functionName: 'getAnchor',
    args: rec?.etr_id ? [rec.etr_id] : undefined,
    query: { enabled: Boolean(ANCHOR_ADDRESS && rec?.etr_id) },
  })
  const anchored = Array.isArray(anchorData) && Number(anchorData[3] || 0) > 0

  const events: Array<{ action: string; at?: string; audit_id?: string }> = []
  if (rec) {
    events.push({ action: 'Issued', at: rec.timestamp, audit_id: rec.audit_id })
    for (const h of (rec.history || [])) events.push({ action: h.action || h.type || 'Event', at: h.at || h.timestamp, audit_id: h.audit_id })
  }

  return (
    <section className="card">
      <h2>Verify &amp; track</h2>
      <p className="muted">Check any record's status, signature, trust signals, and full ledger.</p>
      <div className="row">
        <input className="input" placeholder="fvt_xxxxxxxx_xxxxxxxx" value={id} onChange={(e) => setId(e.target.value)} />
        <button className="btn" onClick={() => run(id)} disabled={loading}>{loading ? 'Checking…' : 'Verify'}</button>
      </div>
      {err && <p className="err">{err}</p>}

      {rec && (
        <div className="result">
          <div className="statushdr">
            <span className="statusbig">{rec.status || 'registered'}</span>
            <span className={`badge ${outcome?.status}`} style={{ margin: 0 }}>{outcome ? STATUS_LABEL[outcome.status] : '…'}</span>
          </div>

          <div className="vbadges">
            <span className="vbadge ok"><IconLock size={12} stroke={2} /> {rec.signature_alg || 'ML-DSA-65'} signed</span>
            <span className="vbadge ok"><IconDatabase size={12} stroke={2} /> ISET registry</span>
            {anchored && <span className="vbadge ok"><IconLink size={12} stroke={2} /> anchored on Celo</span>}
            {(rec.issuer || brand?.name) && <span className="vbadge"><IconBuilding size={12} stroke={2} /> {rec.issuer || brand.name}</span>}
            {brand?.handle && <span className="vbadge"><IconAt size={12} stroke={2} /> {brand.handle}</span>}
            <span className="vbadge">{rec.sandbox ? 'sandbox' : 'production'}</span>
          </div>

          <dl>
            <dt>Instrument</dt><dd>{rec.instrument} {rec.instrument_name ? `· ${rec.instrument_name}` : ''}</dd>
            <dt>Amount</dt><dd>{money(rec.amount)} {rec.currency}</dd>
            <dt>Holder</dt><dd>{rec.holder_ref || '—'}</dd>
            <dt>Record hash</dt><dd className="mono small">{rec.record_hash}</dd>
          </dl>

          <div className="ledger">
            <div className="ledger-h">Ledger</div>
            {events.map((e, i) => (
              <div className="levent" key={i}>
                <div className="ldot" />
                <div className="lbody">
                  <div className="laction">{e.action}</div>
                  <div className="lmeta">{fmt(e.at)}{e.audit_id ? ' · ' : ''}<span className="mono">{e.audit_id || ''}</span></div>
                  {e.audit_id && (
                    audits[e.audit_id] === 'ok' ? <span className="lverify ok">✓ event verified</span>
                      : audits[e.audit_id] === 'bad' ? <span className="lverify err">✗ could not verify</span>
                        : <button className="btn ghost sm" onClick={() => verifyEvent(e.audit_id!)} disabled={audits[e.audit_id] === 'loading'}>{audits[e.audit_id] === 'loading' ? 'verifying…' : 'verify event'}</button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {qr && <img className="qr" src={qr} alt="record QR" />}
        </div>
      )}
    </section>
  )
}
