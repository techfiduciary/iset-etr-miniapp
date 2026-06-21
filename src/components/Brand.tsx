import { useEffect, useState } from 'react'
import { getSubscriber, saveSubscriber, hasSession } from '../lib/iset'
import { useToast } from '../lib/toast'

export default function Brand({ signedIn }: { signedIn: boolean }) {
  const notify = useToast()
  const [name, setName] = useState('')
  const [color, setColor] = useState('#2456C8')
  const [verify, setVerify] = useState('')
  const [tin, setTin] = useState('')
  const [address, setAddress] = useState('')
  const [email, setEmail] = useState('')
  const [logo, setLogo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (signedIn && hasSession() && !loaded) {
      getSubscriber()
        .then((p) => {
          const x = p?.profile || p || {}
          setName(x.name || ''); setColor(x.color || '#2456C8'); setVerify(x.verify || '')
          setTin(x.tin || ''); setAddress(x.address || ''); setEmail(x.email || ''); setLogo(x.logo || null)
        })
        .catch(() => {})
        .finally(() => setLoaded(true))
    }
  }, [signedIn, loaded])

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return
    if (f.size > 180000) { notify('Logo too large — keep it under ~180 KB', 'err'); return }
    const r = new FileReader(); r.onload = () => setLogo(String(r.result)); r.readAsDataURL(f)
  }

  async function save() {
    if (!signedIn || !hasSession()) { notify('Sign in (bind your wallet) first', 'err'); return }
    setBusy(true)
    try { await saveSubscriber({ name, color, verify, tin, address, email, logo }); notify('Brand & details saved') }
    catch (e: any) { notify(e?.message || 'Save failed', 'err') }
    finally { setBusy(false) }
  }

  return (
    <section className="card">
      <h2>Your brand &amp; details</h2>
      <p className="muted">Your logo, colour, and business details appear on every invoice your customers open — not ours.</p>

      <div className="brandprev" style={{ borderColor: color }}>
        {logo ? <img src={logo} alt="" className="brandprev-logo" /> : <div className="brandprev-ph">logo</div>}
        <div>
          <div className="brandprev-name" style={{ color }}>{name || 'Your business'}</div>
          <div className="brandprev-sub">{tin ? `TIN ${tin}` : 'invoice · powered by ISET'}</div>
        </div>
      </div>

      <label className="lbl">Business / your name</label>
      <input className="input" placeholder="Dela Cruz Trading" value={name} onChange={(e) => setName(e.target.value)} />
      <label className="lbl">Tax ID / TIN (for valid tax invoices)</label>
      <input className="input" placeholder="000-000-000-000" value={tin} onChange={(e) => setTin(e.target.value)} />
      <label className="lbl">Business address</label>
      <input className="input" placeholder="Street, City, Country" value={address} onChange={(e) => setAddress(e.target.value)} />
      <label className="lbl">Contact email</label>
      <input className="input" type="email" placeholder="you@business.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      <label className="lbl">Logo (PNG/JPG, ≤180 KB)</label>
      <input className="input" type="file" accept="image/*" onChange={onFile} />
      <div className="row" style={{ marginTop: '10px', alignItems: 'center' }}>
        <div>
          <label className="lbl" style={{ marginTop: 0 }}>Accent colour</label>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ width: '52px', height: '38px', border: 'none', background: 'none' }} />
        </div>
        <div style={{ flex: 1 }}>
          <label className="lbl" style={{ marginTop: 0 }}>Verify link (optional)</label>
          <input className="input" placeholder="https://yoursite.com" value={verify} onChange={(e) => setVerify(e.target.value)} />
        </div>
      </div>

      <button className="btn full" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save brand & details'}</button>
      <p className="note">Stored with your account and applied to the customer-facing record. ISET stays only in the signature and provenance. A valid tax invoice in many places requires your TIN and address — add them here.</p>
    </section>
  )
}
