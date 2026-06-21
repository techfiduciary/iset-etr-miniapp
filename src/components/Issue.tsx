import { useState } from 'react'
import { useAccount, useWriteContract } from 'wagmi'
import { issueEtr, hasSession, canonicalVerifyUrl, type IssueResult } from '../lib/iset'
import { ANCHOR_ADDRESS, ANCHOR_ABI, explorerTx } from '../lib/chain'
import { useToast } from '../lib/toast'

function hashToBytes32(h: string): `0x${string}` {
  return `0x${h.replace(/^sha-256:/, '')}` as `0x${string}`
}
function today(): string { return new Date().toISOString().slice(0, 10) }
function addDays(date: string, days: number): string {
  const d = new Date(date + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}
function fmt(n: number): string { return n.toLocaleString(undefined, { maximumFractionDigits: 2 }) }

const TERMS: Array<[string, string, number | null]> = [
  ['receipt', 'Due on receipt', 0], ['net7', 'Net 7', 7], ['net15', 'Net 15', 15],
  ['net30', 'Net 30', 30], ['net60', 'Net 60', 60], ['net90', 'Net 90', 90], ['custom', 'Custom', null],
]
const CURRENCIES = ['PHP', 'USD', 'cUSD', 'EUR', 'GBP', 'SGD', 'AUD', 'JPY']

export default function Issue({ signedIn }: { signedIn: boolean }) {
  const { address } = useAccount()
  const { writeContractAsync } = useWriteContract()
  const notify = useToast()

  const [invoiceNo, setInvoiceNo] = useState(`INV-${today().replace(/-/g, '')}`)
  const [issueDate, setIssueDate] = useState(today())
  const [terms, setTerms] = useState('net30')
  const [dueDate, setDueDate] = useState(addDays(today(), 30))
  const [customer, setCustomer] = useState('')
  const [email, setEmail] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('PHP')
  const [tax, setTax] = useState('none')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [result, setResult] = useState<IssueResult | null>(null)
  const [tx, setTx] = useState<string | null>(null)

  function onTerms(v: string) {
    setTerms(v)
    const days = TERMS.find((t) => t[0] === v)?.[2]
    if (days != null) setDueDate(addDays(issueDate, days))
  }
  function onIssueDate(v: string) {
    setIssueDate(v)
    const days = TERMS.find((t) => t[0] === terms)?.[2]
    if (days != null) setDueDate(addDays(v, days))
  }

  const subtotal = Number(amount) || 0
  const taxRate = tax === 'vat12' ? 0.12 : 0
  const taxAmt = subtotal * taxRate
  const total = subtotal + taxAmt

  async function handleIssue() {
    setErr(''); setResult(null); setTx(null)
    if (!signedIn || !hasSession()) { setErr('Sign in (bind your wallet) first.'); return }
    if (!customer.trim()) { setErr('Enter the customer who owes you.'); return }
    if (!(subtotal > 0)) { setErr('Enter an amount greater than zero.'); return }
    setBusy(true)
    try {
      const r = await issueEtr('eINV', {
        amount: total.toFixed(2), currency,
        holder_ref: address || '',
        memo: notes || undefined,
        fields: {
          invoice_no: invoiceNo, debtor: customer, customer_email: email,
          issue_date: issueDate, due_date: dueDate, terms: TERMS.find((t) => t[0] === terms)?.[1] || terms,
          description, subtotal: subtotal.toFixed(2),
          tax: tax === 'vat12' ? 'VAT 12%' : 'None', tax_amount: taxAmt.toFixed(2),
        },
      })
      setResult(r)
      notify('Invoice issued & signed')
    } catch (e: any) {
      setErr(e?.message || 'Issuance failed'); notify('Issuance failed', 'err')
    } finally { setBusy(false) }
  }

  function anchor() {
    if (!ANCHOR_ADDRESS) { notify('Anchor contract not deployed yet', 'err'); return }
    if (!result) return
    writeContractAsync({
      address: ANCHOR_ADDRESS as `0x${string}`, abi: ANCHOR_ABI, functionName: 'anchor',
      args: [result.etr_id, hashToBytes32(result.record_hash), result.audit_id],
    }).then((h) => { setTx(h); notify('Anchored on Celo') }).catch((e: any) => notify(e?.shortMessage || e?.message || 'Anchor failed', 'err'))
  }

  async function share() {
    if (!result) return
    const url = canonicalVerifyUrl(result.etr_id)
    try {
      if (navigator.share) await navigator.share({ title: `Invoice ${invoiceNo}`, text: 'Your invoice', url })
      else { await navigator.clipboard.writeText(url); notify('Invoice link copied') }
    } catch { /* cancelled */ }
  }

  const advance = result && isFinite(Number(result.amount)) ? Math.round(Number(result.amount) * 0.95) : null

  return (
    <section className="card">
      <h2>Issue an invoice (eINV)</h2>
      <p className="muted">For businesses and individuals — you stay the holder; your customer is the one who owes.</p>

      <div className="row">
        <div style={{ flex: 1 }}>
          <label className="lbl">Invoice no.</label>
          <input className="input" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <label className="lbl">Issue date</label>
          <input className="input" type="date" value={issueDate} onChange={(e) => onIssueDate(e.target.value)} />
        </div>
      </div>

      <div className="row">
        <div style={{ flex: 1 }}>
          <label className="lbl">Payment terms</label>
          <select className="input" value={terms} onChange={(e) => onTerms(e.target.value)}>
            {TERMS.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label className="lbl">Due date</label>
          <input className="input" type="date" value={dueDate} onChange={(e) => { setDueDate(e.target.value); setTerms('custom') }} />
        </div>
      </div>

      <label className="lbl">Customer — who owes you</label>
      <input className="input" placeholder="Dela Cruz Trading" value={customer} onChange={(e) => setCustomer(e.target.value)} />
      <label className="lbl">Customer email (optional)</label>
      <input className="input" type="email" placeholder="billing@customer.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      <label className="lbl">Description</label>
      <input className="input" placeholder="e.g. 200 units · delivery DR-88" value={description} onChange={(e) => setDescription(e.target.value)} />

      <div className="row">
        <div style={{ flex: 2 }}>
          <label className="lbl">Amount (excl. tax)</label>
          <input className="input" inputMode="decimal" placeholder="250000" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <label className="lbl">Currency</label>
          <select className="input" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <label className="lbl">Tax</label>
      <select className="input" value={tax} onChange={(e) => setTax(e.target.value)}>
        <option value="none">No tax</option>
        <option value="vat12">VAT 12% (PH)</option>
      </select>

      <div className="totals">
        <div><span>Subtotal</span><span>{fmt(subtotal)} {currency}</span></div>
        {taxRate > 0 && <div><span>VAT 12%</span><span>{fmt(taxAmt)} {currency}</span></div>}
        <div className="grand"><span>Total</span><span>{fmt(total)} {currency}</span></div>
      </div>

      <label className="lbl">Notes (optional)</label>
      <input className="input" placeholder="Thank you for your business" value={notes} onChange={(e) => setNotes(e.target.value)} />

      <button className="btn full" onClick={handleIssue} disabled={busy}>{busy ? 'Issuing…' : 'Issue eINV'}</button>
      {err && <p className="err">{err}</p>}

      {result && (
        <div className="result">
          <div className="badge verified">✓ Issued &amp; signed · {result.signature_alg}</div>
          <dl>
            <dt>eINV id</dt><dd className="mono">{result.etr_id}</dd>
            <dt>Total</dt><dd>{fmt(Number(result.amount))} {result.currency}</dd>
            <dt>Status</dt><dd>{result.status}{result.sandbox ? ' · sandbox' : ''}</dd>
            <dt>Record hash</dt><dd className="mono small">{result.record_hash}</dd>
          </dl>
          <div className="actions">
            <button className="btn" onClick={share}>Share invoice</button>
            <a className="btn ghost" href={canonicalVerifyUrl(result.etr_id)} target="_blank" rel="noreferrer">Open</a>
          </div>
          {advance != null && (
            <div className="advcall">
              <div style={{ fontSize: 12, color: '#9fb4d4' }}>advance available (pilot)</div>
              <div style={{ fontSize: 20, fontWeight: 600, marginTop: 2 }}>{advance.toLocaleString()} {result.currency}</div>
              <button className="btn full" disabled style={{ marginTop: 8, opacity: 0.6 }}>Request advance — after legal clearance</button>
            </div>
          )}
          <div className="actions"><button className="btn ghost" onClick={anchor}>Anchor on Celo</button></div>
          {tx && <p className="ok">Anchored · <a className="link" href={explorerTx(tx)} target="_blank" rel="noreferrer">view tx →</a></p>}
          <p className="note">The Celo record is a notarisation of this invoice — the eINV itself stays in the ISET registry, the point of control.</p>
        </div>
      )}
    </section>
  )
}
