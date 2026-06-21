import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { verifyRecord, fetchPublicKey, canonicalVerifyUrl } from '../lib/iset'
import { verifyEtr, type VerifyOutcome } from '../lib/mldsa'

const STATUS_LABEL: Record<string, string> = {
  verified: '✓ Post-quantum signature verified (client-side)',
  failed: '✗ Signature did NOT verify',
  'needs-canonical': '◐ Server-verified · client re-check needs the canonical field',
  'no-pubkey': '◐ Public key not published yet',
}

export default function Verify({ initialId }: { initialId?: string }) {
  const [id, setId] = useState(initialId || '')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [resp, setResp] = useState<any>(null)
  const [outcome, setOutcome] = useState<VerifyOutcome | null>(null)
  const [qr, setQr] = useState('')

  useEffect(() => { if (initialId) void run(initialId) /* eslint-disable-next-line */ }, [initialId])

  async function run(theId: string) {
    const rid = theId.trim()
    if (!rid) return
    setLoading(true); setErr(''); setResp(null); setOutcome(null); setQr('')
    try {
      const r = await verifyRecord(rid)
      setResp(r)
      const record = r?.record || r
      try {
        const pk = await fetchPublicKey()
        setOutcome(verifyEtr(record, pk))
      } catch { setOutcome({ status: 'no-pubkey' }) }
      try { setQr(await QRCode.toDataURL(canonicalVerifyUrl(rid), { margin: 1, width: 180 })) } catch { /* noop */ }
    } catch (e: any) {
      setErr(e?.message || 'Lookup failed')
    } finally { setLoading(false) }
  }

  const rec = resp?.record || resp

  return (
    <section className="card">
      <h2>Verify a record</h2>
      <p className="muted">Enter an eTR id (e.g. <code>fvt_…</code>) or open a record QR.</p>
      <div className="row">
        <input className="input" placeholder="fvt_xxxxxxxx_xxxxxxxx" value={id} onChange={(e) => setId(e.target.value)} />
        <button className="btn" onClick={() => run(id)} disabled={loading}>{loading ? 'Checking…' : 'Verify'}</button>
      </div>
      {err && <p className="err">{err}</p>}

      {rec && (
        <div className="result">
          <div className={`badge ${outcome?.status}`}>{outcome ? STATUS_LABEL[outcome.status] : '…'}</div>
          <dl>
            <dt>Instrument</dt><dd>{rec.instrument} {rec.instrument_name ? `· ${rec.instrument_name}` : ''}</dd>
            <dt>Amount</dt><dd>{rec.amount} {rec.currency}</dd>
            <dt>Status</dt><dd>{rec.status}{rec.sandbox ? ' · sandbox' : ''}</dd>
            <dt>Holder</dt><dd>{rec.holder_ref || '—'}</dd>
            <dt>Audit id</dt><dd className="mono">{rec.audit_id}</dd>
            <dt>Algorithm</dt><dd>{rec.signature_alg || 'ML-DSA-65'}</dd>
            <dt>Record hash</dt><dd className="mono small">{rec.record_hash}</dd>
          </dl>
          {qr && <img className="qr" src={qr} alt="record QR" />}
        </div>
      )}
    </section>
  )
}
