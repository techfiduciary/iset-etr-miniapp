import { useEffect, useState } from 'react'
import { IconSettings } from '@tabler/icons-react'
import Connect from './components/Connect'
import Home from './components/Home'
import Verify from './components/Verify'
import Issue from './components/Issue'
import Invoices from './components/Invoices'
import Brand from './components/Brand'
import { IS_TESTNET, ACTIVE_CHAIN } from './lib/chain'

type Tab = 'home' | 'issue' | 'invoices' | 'verify' | 'brand'

export default function App() {
  const [tab, setTab] = useState<Tab>('home')
  const [signedIn, setSignedIn] = useState(false)
  const [, setSubject] = useState('')
  const [deepId, setDeepId] = useState<string | undefined>(undefined)

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const id = p.get('id'); const t = p.get('tab') as Tab | null
    if (id) { setDeepId(id); setTab('verify') }
    else if (t && ['issue', 'invoices', 'verify', 'brand'].includes(t)) setTab(t)
  }, [])

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <img className="logo" src="/icon.png" alt="" width="26" height="26" />
          <div className="brandtext">
            <span className="mark">eInvoice</span>
            <span className="sub">by ISET · on MiniPay</span>
          </div>
        </div>
        <div className="topactions">
          <button className="iconbtn" aria-label="Your brand" onClick={() => setTab('brand')}><IconSettings size={18} stroke={1.75} /></button>
          <Connect
            signedIn={signedIn}
            onSignIn={(s) => { setSignedIn(true); setSubject(s) }}
            onSignOut={() => { setSignedIn(false); setSubject('') }}
          />
        </div>
      </header>

      {IS_TESTNET && <div className="banner">Testnet · {ACTIVE_CHAIN.name} — demo records only</div>}

      <nav className="tabs">
        <button className={tab === 'home' ? 'on' : ''} onClick={() => setTab('home')}>Home</button>
        <button className={tab === 'issue' ? 'on' : ''} onClick={() => setTab('issue')}>Issue</button>
        <button className={tab === 'invoices' ? 'on' : ''} onClick={() => setTab('invoices')}>Invoices</button>
        <button className={tab === 'verify' ? 'on' : ''} onClick={() => setTab('verify')}>Verify</button>
      </nav>

      <main>
        {tab === 'home' && <Home onIssue={() => setTab('issue')} onVerify={() => setTab('verify')} />}
        {tab === 'issue' && <Issue signedIn={signedIn} />}
        {tab === 'invoices' && <Invoices signedIn={signedIn} />}
        {tab === 'verify' && <Verify initialId={deepId} />}
        {tab === 'brand' && <Brand signedIn={signedIn} />}
      </main>

      <footer className="foot">
        Issuer &amp; registry: ISET · signatures ML-DSA-65 (post-quantum). Celo is a settlement &amp; notarisation bridge — the registry is the point of control.
      </footer>
    </div>
  )
}
