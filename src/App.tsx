import { useEffect, useState } from 'react'
import Connect from './components/Connect'
import Home from './components/Home'
import Verify from './components/Verify'
import Issue from './components/Issue'
import { IS_TESTNET, ACTIVE_CHAIN } from './lib/chain'

type Tab = 'home' | 'issue' | 'verify'

export default function App() {
  const [tab, setTab] = useState<Tab>('home')
  const [signedIn, setSignedIn] = useState(false)
  const [, setSubject] = useState('')
  const [deepId, setDeepId] = useState<string | undefined>(undefined)

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const id = p.get('id'); const t = p.get('tab')
    if (id) { setDeepId(id); setTab('verify') }
    else if (t === 'issue') setTab('issue')
    else if (t === 'verify') setTab('verify')
  }, [])

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="mark">ISET</span>
          <span className="sub">eINV · invoice advance</span>
        </div>
        <Connect
          signedIn={signedIn}
          onSignIn={(s) => { setSignedIn(true); setSubject(s) }}
          onSignOut={() => { setSignedIn(false); setSubject('') }}
        />
      </header>

      {IS_TESTNET && <div className="banner">Testnet · {ACTIVE_CHAIN.name} — demo records only</div>}

      <nav className="tabs">
        <button className={tab === 'home' ? 'on' : ''} onClick={() => setTab('home')}>Home</button>
        <button className={tab === 'issue' ? 'on' : ''} onClick={() => setTab('issue')}>Issue</button>
        <button className={tab === 'verify' ? 'on' : ''} onClick={() => setTab('verify')}>Verify</button>
      </nav>

      <main>
        {tab === 'home' && <Home onIssue={() => setTab('issue')} onVerify={() => setTab('verify')} />}
        {tab === 'issue' && <Issue signedIn={signedIn} />}
        {tab === 'verify' && <Verify initialId={deepId} />}
      </main>

      <footer className="foot">
        Issuer &amp; registry: ISET · signatures ML-DSA-65 (post-quantum). Celo is a settlement &amp; notarisation bridge — the registry is the point of control.
      </footer>
    </div>
  )
}
