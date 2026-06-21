import { useEffect, useState } from 'react'
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain, useSignMessage } from 'wagmi'
import { ACTIVE_CHAIN } from '../lib/chain'
import { isMiniPay } from '../wagmi'
import { siweSignIn, signOut } from '../lib/siwe'

function short(a?: string) { return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '' }

export default function Connect({
  signedIn, onSignIn, onSignOut,
}: { signedIn: boolean; onSignIn: (subject: string) => void; onSignOut: () => void }) {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const { switchChainAsync } = useSwitchChain()
  const { signMessageAsync } = useSignMessage()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  // Inside MiniPay the wallet is injected — auto-connect, no button needed.
  useEffect(() => {
    if (isMiniPay() && !isConnected && connectors[0]) {
      try { connect({ connector: connectors[0] }) } catch { /* noop */ }
    }
  }, [isConnected])

  function handleConnect() {
    setErr('')
    const c = connectors[0]
    if (!c) { setErr('No wallet found. Open in MiniPay or install a Celo wallet.'); return }
    connect({ connector: c })
  }

  async function handleSignIn() {
    if (!address) return
    setBusy(true); setErr('')
    try {
      if (chainId !== ACTIVE_CHAIN.id) await switchChainAsync({ chainId: ACTIVE_CHAIN.id })
      const { subject } = await siweSignIn(address, ACTIVE_CHAIN.id, signMessageAsync)
      onSignIn(subject)
    } catch (e: any) { setErr(e?.message || 'Sign-in failed') } finally { setBusy(false) }
  }

  function handleSignOut() { signOut(); onSignOut(); disconnect() }

  if (!isConnected) {
    return (
      <div className="connect">
        <button className="btn" onClick={handleConnect} disabled={isPending}>{isPending ? 'Connecting…' : 'Connect wallet'}</button>
        {err && <p className="err">{err}</p>}
      </div>
    )
  }

  return (
    <div className="connect">
      <span className="pill" title={address}>{short(address)}</span>
      {signedIn
        ? <button className="btn ghost" onClick={handleSignOut}>Sign out</button>
        : <button className="btn" onClick={handleSignIn} disabled={busy}>{busy ? 'Signing…' : 'Sign in'}</button>}
      {err && <p className="err">{err}</p>}
    </div>
  )
}
