import { useEffect, useState } from 'react'
import { listEtr, hasSession, canonicalVerifyUrl } from '../lib/iset'
import { useToast } from '../lib/toast'

function money(n: any): string {
  const v = Number(n)
  return isFinite(v) && n != null && n !== '' ? v.toLocaleString() : String(n ?? '')
}

export default function Invoices({ signedIn, onOpen }: { signedIn: boolean; onOpen: (id: string) => void }) {
  const notify = useToast()
  const [items, setItems] = useState<any[] | null>(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (signedIn && hasSession()) {
      setErr('')
      listEtr().then(setItems).catch((e) => { setErr(e?.message || 'Could not load'); setItems([]) })
    } else { setItems(null) }
  }, [signedIn])

  async function share(id: string) {
    const url = canonicalVerifyUrl(id)
    try {
      if (navigator.share) await navigator.share({ title: 'Invoice', url })
      else { await navigator.clipboard.writeText(url); notify('Link copied') }
    } catch { /* cancelled */ }
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
            <div className="invmain">
              <div className="invtop">
                <span className="invamt">{money(r.amount)} {r.currency || ''}</span>
                <span className={`invstatus s-${r.status || 'registered'}`}>{r.status || 'registered'}</span>
              </div>
              <div className="invsub">{r.holder_ref || r.instrument || 'eINV'} · <span className="mono">{r.etr_id}</span></div>
            </div>
            <div className="invact">
              <button className="btn ghost sm" onClick={() => onOpen(r.etr_id)}>Open</button>
              <button className="btn ghost sm" onClick={() => share(r.etr_id)}>Share</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
