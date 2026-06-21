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
  const d = new Date(date + 'T00:00:00'); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10)
}
function fmt(n: number): string { return n.toLocaleString(undefined, { maximumFractionDigits: 2 }) }

const TERMS: Array<[string, string, number | null]> = [
  ['receipt', 'Due on receipt', 0], ['net7', 'Net 7', 7], ['net15', 'Net 15', 15],
  ['net30', 'Net 30', 30], ['net60', 'Net 60', 60], ['net90', 'Net 90', 90], ['custom', 'Custom', null],
]
const CURRENCIES = ['PHP', 'USD', 'cUSD', 'EUR', 'GBP', 'SGD', 'AUD', 'JPY', 'INR', 'AED', 'NGN', 'KES']

// Tax is jurisdiction-specific. These are convenience starting points only — the
// rate stays editable and defaults to none. The issuer is responsible for the
// correct tax in their jurisdiction; eINV does not determine tax for anyone.
const TAX_PRESETS: Array<{ k: string; label: string; type: string; rate: number }> = [
  { k: 'none', label: 'No tax', type: '', rate: 0 },
  { k: 'ph', label: 'Philippines · VAT 12%', type: 'VAT', rate: 12 },
  { k: 'sg', label: 'Singapore · GST 9%', type: 'GST', rate: 9 },
  { k: 'my', label: 'Malaysia · SST 6%', type: 'SST', rate: 6 },
  { k: 'au', label: 'Australia · GST 10%', type: 'GST', rate: 10 },
  { k: 'nz', label: 'New Zealand · GST 15%', type: 'GST', rate: 15 },
  { k: 'in', label: 'India · GST 18%', type: 'GST', rate: 18 },
  { k: 'ae', label: 'UAE · VAT 5%', type: 'VAT', rate: 5 },
  { k: 'gb', label: 'United Kingdom · VAT 20%', type: 'VAT', rate: 20 },
  { k: 'za', label: 'South Africa · VAT 15%', type: 'VAT', rate: 15 },
  { k: 'eu', label: 'EU · VAT (set your rate)', type: 'VAT', rate: 0 },
  { k: 'us', label: 'US · sales tax (set your rate)', type: 'Sales tax', rate: 0 },
  { k: 'custom', label: 'Other / custom…', type: 'Tax', rate: 0 },
]

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
  const [taxKey, setTaxKey] = useState('none')
  const [taxType, setTaxType] = useState('')
  const [ratePct, setRatePct] = useState('')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [result, setResult] = useState<IssueResult | null>(null)
  const [tx, setTx] = useState<string | null>(null)

  function onTerms(v: string) { setTerms(v); const d = TERMS.find((t) => t[0] === v)?.[2]; if (d != null) setDueDate(addDays(issueDate, d)) }
  function onIssueDate(v: string) { setIssueDate(v); const d = TERMS.find((t) => t[0] === terms)?.[2]; if (d != null) setDueDate(addDays(v, d)) }
  function onTaxPreset(k: string) {
    setTaxKey(k); const p = TAX_PRESETS.find((x) => x.k === k)!
    setTaxType(p.type); setRatePct(p.rate ? String(p.rate) : '')
  }

  const subtotal = Number(amount) || 0
  const rate = Math.max(0, Number(ratePct) || 0) / 100
  const taxAmt = taxKey === 'none' ? 0 : subtotal * rate
  const total = subtotal + taxAmt
  const taxLine = taxKey !== 'none' && (taxType || ratePct) ? `${taxType || 'Tax'} ${ratePct || 0}%` : ''

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
          tax: taxAmt > 0 ? taxLine : 'None', tax_amount: taxAmt.toFixed(2),
        },
      })
      setResult(r); notify('Invoice issued & signed')
    } catch (e: any) { setErr(e?.message || 'Issuance failed'); notify('Issuance failed', 'err') } finally { setBusy(false) }
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
        <div style={{ flex: 1 }}><label className="lbl">Invoice no.</label><input className="input" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} /></div>
        <div style={{ flex: 1 }}><label className="lbl">Issue date</label><input className="input" type="date" value={issueDate} onChange={(e) => onIssueDate(e.target.value)} /></div>
      </div>
      <div className="row">
        <div style={{ flex: 1 }}><label className="lbl">Payment terms</label><select className="input" value={terms} onChange={(e) => onTerms(e.target.value)}>{TERMS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        <div style={{ flex: 1 }}><label className="lbl">Due date</label><input className="input" type="date" value={dueDate} onChange={(e) => { setDueDate(e.target.value); setTerms('custom') }} /></div>
      </div>

      <label className="lbl">Customer — who owes you</label>
      <input className="input" placeholder="Dela Cruz Trading" value={customer} onChange={(e) => setCustomer(e.target.value)} />
      <label className="lbl">Customer email (optional)</label>
      <input className="input" type="email" placeholder="billing@customer.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      <label className="lbl">Description</label>
      <input className="input" placeholder="e.g. 200 units · delivery DR-88" value={description} onChange={(e) => setDescription(e.target.value)} />

      <div className="row">
        <div style={{ flex: 2 }}><label className="lbl">Amount (excl. tax)</label><input className="input" inputMode="decimal" placeholder="250000" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
        <div style={{ flex: 1 }}><label className="lbl">Currency</label><select className="input" value={currency} onChange={(e) => setCurrency(e.target.value)}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select></div>
      </div>

      <label className="lbl">Tax (by your jurisdiction)</label>
      <select className="input" value={taxKey} onChange={(e) => onTaxPreset(e.target.value)}>
        {TAX_PRESETS.map((p) => <option key={p.k} value={p.k}>{p.label}</option>)}
      </select>
      {taxKey !== 'none' && (
        <>
          <div className="row" style={{ marginTop: 8 }}>
            {taxKey === 'custom' && <div style={{ flex: 1 }}><label className="lbl" style={{ marginTop: 0 }}>Tax name</label><input className="input" placeholder="VAT / GST / Sales tax" value={taxType} onChange={(e) => setTaxType(e.target.value)} /></div>}
            <div style={{ flex: 1 }}><label className="lbl" style={{ marginTop: 0 }}>Rate %</label><input className="input" inputMode="decimal" placeholder="0" value={ratePct} onChange={(e) => setRatePct(e.target.value)} /></div>
          </div>
          <p className="note" style={{ marginTop: 8 }}>Presets are starting points — confirm the current rate for your jurisdiction. You're responsible for the tax you apply; eINV does not determine it.</p>
        </>
      )}

      <div className="totals">
        <div><span>Subtotal</span><span>{fmt(subtotal)} {currency}</span></div>
        {taxAmt > 0 && <div><span>{taxLine}</span><span>{fmt(taxAmt)} {currency}</span></div>}
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
