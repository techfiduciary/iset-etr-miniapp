import { useEffect, useState } from 'react'
import { listEtr, hasSession, canonicalVerifyUrl, transferEtr } from '../lib/iset'
import { useToast } from '../lib/toast'

function money(n: any): string {
  const v = Number(n)
  return isFinite(v) && n != null && n !== '' ? v.toLocaleString() : String(n ?? '')
}
function statusLabel(s?: string): string { return s === 'discharged' ? 'paid' : (s || 'registered') }

export default function Invoices({ signedIn, onOpen }: { signedIn: boolean; onOpen: (id: string) => void }) {
  const notify = useToast()
  const [items, setItems] = useState<any[] | null>(null)
  const [err, setErr] = useState('')
  const [busyId, setBusyId] = useState('')

  function load() { listEtr().then(setItems).catch((e) => { setErr(e?.message || 'Could not load'); setItems([]) }) }
  useEffect(() => { if (signedIn && hasSession()) { setErr(''); load() } else { setItems(null) } }, [signedIn])

  async function markPaid(id: string) {
    setBusyId(id)
    try { await transferEtr(id, 'discharge', { note: 'Paid' }); notify('Marked as paid'); load() }
    catch (e: any) { notify(e?.shortMessage || e?.message || 'Could not update', 'err') }
    finally { setBusyId('') }
  }
  async function share(id: string) {
    const url = canonicalVerifyUrl(id)
    try { if (navigator.share) await navigator.share({ title: 'Invoice', url }); else { await navigator.clipboard.writeText(url); notify('Link copied') } }
    catch { /* cancelled */ }
  }

  if (!signedIn) return <section className="card"><h2>My invoices</h2><p className="muted">Sign in (bind your wallet) to see the invoices you've issued.</p></section>
  if (items === null) return <section className="card"><h2>My invoices</h2><p className="muted">Loading…</p></section>

  return (
    <section className="card">
      <h2>My invoices</h2>
      {err && <p className="err">{err}</p>}
      {items.length === 0 && !err && <p className="muted">No invoices yet. Issue your first one from the Issue tab.</p>}
      <div className="invlist">
        {items.map((r: any) => (
          <div className="invrow" key={r.etr_id}>
            <div className="invmain" onClick={() => onOpen(r.etr_id)} style={{ cursor: 'pointer' }}>
              <div className="invtop">
                <span className="invamt">{money(r.amount)} {r.currency || ''}</span>
                <span className={`invstatus s-${r.status || 'registered'}`}>{statusLabel(r.status)}</span>
              </div>
              <div className="invsub">{r.holder_ref || r.instrument || 'eINV'} · <span className="mono">{r.etr_id}</span></div>
            </div>
            <div className="invact">
              {r.status !== 'discharged' && (
                <button className="btn sm" onClick={() => markPaid(r.etr_id)} disabled={busyId === r.etr_id}>{busyId === r.etr_id ? '…' : 'Mark paid'}</button>
              )}
              <button className="btn ghost sm" onClick={() => share(r.etr_id)}>Share</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
