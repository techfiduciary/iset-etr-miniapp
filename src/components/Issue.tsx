import { useState } from 'react'
import { useAccount, useWriteContract } from 'wagmi'
import { issueEtr, hasSession, canonicalVerifyUrl, type IssueResult } from '../lib/iset'
import { ANCHOR_ADDRESS, ANCHOR_ABI, explorerTx } from '../lib/chain'

function hashToBytes32(h: string): `0x${string}` {
  return `0x${h.replace(/^sha-256:/, '')}` as `0x${string}`
}
function money(n: string): string {
  const v = Number(n)
  return isFinite(v) && n !== '' ? v.toLocaleString() : n
}

export default function Issue({ signedIn }: { signedIn: boolean }) {
  const { address } = useAccount()
  const { writeContractAsync } = useWriteContract()

  const [invoiceNo, setInvoiceNo] = useState('')
  const [customer, setCustomer] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('PHP')
  const [dueDate, setDueDate] = useState('')
  const [memo, setMemo] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [result, setResult] = useState<IssueResult | null>(null)
  const [tx, setTx] = useState<string | null>(null)
  const [actErr, setActErr] = useState('')

  async function handleIssue() {
    setErr(''); setResult(null); setTx(null); setActErr('')
    if (!signedIn || !hasSession()) { setErr('Sign in (bind your wallet) first.'); return }
    if (!amount || !customer) { setErr('Enter the customer and amount.'); return }
    setBusy(true)
    try {
      const r = await issueEtr('eINV', {
        amount, currency,
        holder_ref: address || '',
        memo: memo || undefined,
        fields: { invoice_no: invoiceNo, debtor: customer, due_date: dueDate },
      })
      setResult(r)
    } catch (e: any) {
      setErr(e?.message || 'Issuance failed')
    } finally { setBusy(false) }
  }

  function anchor() {
    if (!ANCHOR_ADDRESS) { setActErr('Anchor contract not deployed yet — set VITE_ANCHOR_ADDRESS.'); return }
    if (!result) return
    writeContractAsync({
      address: ANCHOR_ADDRESS as `0x${string}`, abi: ANCHOR_ABI, functionName: 'anchor',
      args: [result.etr_id, hashToBytes32(result.record_hash), result.audit_id],
    }).then((h) => setTx(h)).catch((e: any) => setActErr(e?.shortMessage || e?.message || 'failed'))
  }

  const advance = result && isFinite(Number(result.amount)) ? Math.round(Number(result.amount) * 0.95) : null

  return (
    <section className="card">
      <h2>Issue an invoice (eINV)</h2>
      <p className="muted">Record an unpaid invoice as a signed eINV. You stay the holder; your customer is the one who owes.</p>

      <label className="lbl">Invoice no.</label>
      <input className="input" placeholder="INV-1042" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} />
      <label className="lbl">Customer — who owes you</label>
      <input className="input" placeholder="Dela Cruz Trading" value={customer} onChange={(e) => setCustomer(e.target.value)} />
      <label className="lbl">Amount</label>
      <div className="row">
        <input className="input" inputMode="decimal" placeholder="250000" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <select className="input narrow" value={currency} onChange={(e) => setCurrency(e.target.value)}>
          <option>PHP</option><option>USD</option><option>cUSD</option>
        </select>
      </div>
      <label className="lbl">Due date</label>
      <input className="input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      <label className="lbl">Memo (optional)</label>
      <input className="input" placeholder="e.g. delivery DR-88" value={memo} onChange={(e) => setMemo(e.target.value)} />

      <button className="btn full" onClick={handleIssue} disabled={busy}>{busy ? 'Issuing…' : 'Issue eINV'}</button>
      {err && <p className="err">{err}</p>}

      {result && (
        <div className="result">
          <div className="badge verified">✓ Issued &amp; signed · {result.signature_alg}</div>
          <dl>
            <dt>eINV id</dt><dd className="mono">{result.etr_id}</dd>
            <dt>Amount</dt><dd>{money(result.amount)} {result.currency}</dd>
            <dt>Status</dt><dd>{result.status}{result.sandbox ? ' · sandbox' : ''}</dd>
            <dt>Record hash</dt><dd className="mono small">{result.record_hash}</dd>
          </dl>
          <a className="link" href={canonicalVerifyUrl(result.etr_id)} target="_blank" rel="noreferrer">Open record →</a>

          {advance != null && (
            <div className="advcall">
              <div style={{ fontSize: 12, color: '#9fb4d4' }}>advance available (pilot)</div>
              <div style={{ fontSize: 20, fontWeight: 600, marginTop: 2 }}>{advance.toLocaleString()} {result.currency}</div>
              <button className="btn full" disabled style={{ marginTop: 8, opacity: 0.6 }}>Request advance — after legal clearance</button>
            </div>
          )}

          <div className="actions"><button className="btn ghost" onClick={anchor}>Anchor on Celo</button></div>
          {tx && <p className="ok">Anchored · <a className="link" href={explorerTx(tx)} target="_blank" rel="noreferrer">view tx →</a></p>}
          {actErr && <p className="err">{actErr}</p>}
          <p className="note">The Celo record is a notarisation of this invoice — the eINV itself stays in the ISET registry, which remains the point of control.</p>
        </div>
      )}
    </section>
  )
}
