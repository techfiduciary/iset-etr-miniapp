import { useEffect, useState } from 'react'
import Connect from './components/Connect'
import Verify from './components/Verify'
import Issue from './components/Issue'
import { IS_TESTNET, ACTIVE_CHAIN } from './lib/chain'

type Tab = 'verify' | 'issue'

export default function App() {
  const [tab, setTab] = useState<Tab>('verify')
  const [signedIn, setSignedIn] = useState(false)
  const [, setSubject] = useState('')
  const [deepId, setDeepId] = useState<string | undefined>(undefined)

  // Support /?id=<etr> and /?tab=issue deep links (record QR codes).
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const id = p.get('id'); const t = p.get('tab')
    if (id) { setDeepId(id); setTab('verify') }
    else if (t === 'issue') setTab('issue')
  }, [])

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="mark">ISET</span>
          <span className="sub">eTR · MiniApp</span>
        </div>
        <Connect
          signedIn={signedIn}
          onSignIn={(s) => { setSignedIn(true); setSubject(s) }}
          onSignOut={() => { setSignedIn(false); setSubject('') }}
        />
      </header>

      {IS_TESTNET && <div className="banner">Testnet · {ACTIVE_CHAIN.name} — not legal tender, demo records only</div>}

      <nav className="tabs">
        <button className={tab === 'verify' ? 'on' : ''} onClick={() => setTab('verify')}>Verify</button>
        <button className={tab === 'issue' ? 'on' : ''} onClick={() => setTab('issue')}>Issue</button>
      </nav>

      <main>
        {tab === 'verify' ? <Verify initialId={deepId} /> : <Issue signedIn={signedIn} />}
      </main>

      <footer className="foot">
        Issuer &amp; registry: ISET · signatures ML-DSA-65 (post-quantum). Celo is a settlement &amp; notarisation bridge only — the registry is the point of control.
      </footer>
    </div>
  )
}
