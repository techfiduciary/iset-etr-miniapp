import { useEffect, useState } from 'react'
import { getSubscriber, saveSubscriber, claimHandle, hasSession } from '../lib/iset'
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
  const [handle, setHandle] = useState('')
  const [acct, setAcct] = useState<'individual' | 'institution'>('individual')
  const [busy, setBusy] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (signedIn && hasSession() && !loaded) {
      getSubscriber()
        .then((p) => {
          const x = p?.profile || p || {}
          setName(x.name || ''); setColor(x.color || '#2456C8'); setVerify(x.verify || '')
          setTin(x.tin || ''); setAddress(x.address || ''); setEmail(x.email || ''); setLogo(x.logo || null)
          setHandle(x.handle || ''); if (x.acct === 'institution') setAcct('institution')
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

  async function claim() {
    if (!signedIn || !hasSession()) { notify('Sign in (bind your wallet) first', 'err'); return }
    const h = handle.trim().replace(/^@/, '').toLowerCase()
    if (!/^[a-z0-9_]{3,30}$/.test(h)) { notify('Handle: 3–30 chars — letters, numbers, underscore', 'err'); return }
    setClaiming(true)
    try { const r = await claimHandle(h, acct); setHandle((r.handle || '@' + h).replace(/^@/, '')); notify(`Claimed @${h}`) }
    catch (e: any) { notify(e?.message || 'Could not claim that handle', 'err') }
    finally { setClaiming(false) }
  }

  async function save() {
    if (!signedIn || !hasSession()) { notify('Sign in (bind your wallet) first', 'err'); return }
    setBusy(true)
    try { await saveSubscriber({ name, color, verify, tin, address, email, logo, acct }); notify('Brand & details saved') }
    catch (e: any) { notify(e?.message || 'Save failed', 'err') }
    finally { setBusy(false) }
  }

  return (
    <section className="card">
      <h2>Your identity &amp; brand</h2>
      <p className="muted">Claim a handle, add your logo and details — they appear on every invoice your customers open.</p>

      <div className="brandprev" style={{ borderColor: color }}>
        {logo ? <img src={logo} alt="" className="brandprev-logo" /> : <div className="brandprev-ph">logo</div>}
        <div>
          <div className="brandprev-name" style={{ color }}>{name || 'Your business'}</div>
          <div className="brandprev-sub">{handle ? '@' + handle : (acct === 'institution' ? 'company' : 'individual')}{tin ? ` · TIN ${tin}` : ''}</div>
        </div>
      </div>

      <label className="lbl">Your handle</label>
      <div className="row">
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: 'var(--muted)' }}>@</span>
          <input className="input" placeholder="yourname" value={handle} onChange={(e) => setHandle(e.target.value.replace(/^@/, ''))} />
        </div>
        <button className="btn" onClick={claim} disabled={claiming}>{claiming ? '…' : 'Claim'}</button>
      </div>
      <div className="seg" style={{ marginTop: '8px' }}>
        <button className={acct === 'individual' ? 'on' : ''} onClick={() => setAcct('individual')}>Individual</button>
        <button className={acct === 'institution' ? 'on' : ''} onClick={() => setAcct('institution')}>Company</button>
      </div>
      <p className="note" style={{ marginTop: '6px' }}>A company handle is its own identity, separate from your personal one. This is a friendly handle — not the authoritative fID rail.</p>

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
      <p className="note">Stored with your account and applied to the customer-facing record. ISET stays only in the signature and provenance.</p>
    </section>
  )
}
