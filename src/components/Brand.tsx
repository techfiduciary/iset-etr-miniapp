import { useEffect, useState } from 'react'
import { getSubscriber, saveSubscriber, hasSession } from '../lib/iset'
import { useToast } from '../lib/toast'

export default function Brand({ signedIn }: { signedIn: boolean }) {
  const notify = useToast()
  const [name, setName] = useState('')
  const [color, setColor] = useState('#2456C8')
  const [verify, setVerify] = useState('')
  const [logo, setLogo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (signedIn && hasSession() && !loaded) {
      getSubscriber()
        .then((p) => { const x = p?.profile || p || {}; setName(x.name || ''); setColor(x.color || '#2456C8'); setVerify(x.verify || ''); setLogo(x.logo || null) })
        .catch(() => {})
        .finally(() => setLoaded(true))
    }
  }, [signedIn, loaded])

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 180000) { notify('Logo too large — keep it under ~180 KB', 'err'); return }
    const r = new FileReader()
    r.onload = () => setLogo(String(r.result))
    r.readAsDataURL(f)
  }

  async function save() {
    if (!signedIn || !hasSession()) { notify('Sign in (bind your wallet) first', 'err'); return }
    setBusy(true)
    try { await saveSubscriber({ name, color, verify, logo }); notify('Brand saved — your invoices now carry it') }
    catch (e: any) { notify(e?.message || 'Save failed', 'err') }
    finally { setBusy(false) }
  }

  return (
    <section className="card">
      <h2>Your brand</h2>
      <p className="muted">Add your logo and colour. Every invoice your customers open will wear your brand — not ours.</p>

      <div className="brandprev" style={{ borderColor: color }}>
        {logo ? <img src={logo} alt="" className="brandprev-logo" /> : <div className="brandprev-ph">logo</div>}
        <div>
          <div className="brandprev-name" style={{ color }}>{name || 'Your business'}</div>
          <div className="brandprev-sub">invoice · powered by ISET</div>
        </div>
      </div>

      <label className="lbl">Business / your name</label>
      <input className="input" placeholder="Dela Cruz Trading" value={name} onChange={(e) => setName(e.target.value)} />
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

      <button className="btn full" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save brand'}</button>
      <p className="note">Your logo is stored with your account and applied to the customer-facing record. ISET stays only in the signature and provenance.</p>
    </section>
  )
}
