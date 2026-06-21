import { useState } from 'react'
import { useAccount, useWriteContract } from 'wagmi'
import { parseUnits } from 'viem'
import { issueEpn, hasSession, canonicalVerifyUrl, type IssueResult } from '../lib/iset'
import {
  ANCHOR_ADDRESS, ETRNOTE_ADDRESS, SETTLE_TOKEN, ANCHOR_ABI, ETRNOTE_ABI, ERC20_ABI,
  explorerTx, IS_TESTNET,
} from '../lib/chain'

function hashToBytes32(record_hash: string): `0x${string}` {
  return `0x${record_hash.replace(/^sha-256:/, '')}` as `0x${string}`
}

export default function Issue({ signedIn }: { signedIn: boolean }) {
  const { address } = useAccount()
  const { writeContractAsync } = useWriteContract()

  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('PHP')
  const [payee, setPayee] = useState('')
  const [memo, setMemo] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [result, setResult] = useState<IssueResult | null>(null)

  const [settleTo, setSettleTo] = useState('')
  const [tx, setTx] = useState<{ label: string; hash: string } | null>(null)
  const [actErr, setActErr] = useState('')

  async function handleIssue() {
    setErr(''); setResult(null); setTx(null); setActErr('')
    if (!signedIn || !hasSession()) { setErr('Sign in (bind your wallet) first.'); return }
    if (!amount) { setErr('Enter an amount.'); return }
    setBusy(true)
    try {
      const r = await issueEpn({
        amount, currency,
        holder_ref: address || '',
        memo: memo || undefined,
        fields: { maker: address || '', payee: payee || '' },
      })
      setResult(r)
    } catch (e: any) {
      setErr(e?.message || 'Issuance failed')
    } finally { setBusy(false) }
  }

  async function runAction(label: string, fn: () => Promise<`0x${string}`>) {
    setActErr(''); setTx(null)
    try { setTx({ label, hash: await fn() }) }
    catch (e: any) { setActErr(`${label}: ${e?.shortMessage || e?.message || 'failed'}`) }
  }

  function anchor() {
    if (!ANCHOR_ADDRESS) { setActErr('Anchor contract not deployed yet — set VITE_ANCHOR_ADDRESS.'); return }
    if (!result) return
    return runAction('Anchor', () => writeContractAsync({
      address: ANCHOR_ADDRESS as `0x${string}`, abi: ANCHOR_ABI, functionName: 'anchor',
      args: [result.etr_id, hashToBytes32(result.record_hash), result.audit_id],
    }))
  }

  function mintNote() {
    if (!ETRNOTE_ADDRESS) { setActErr('Note contract not deployed yet — set VITE_ETRNOTE_ADDRESS.'); return }
    if (!result || !address) return
    return runAction('Mint note', () => writeContractAsync({
      address: ETRNOTE_ADDRESS as `0x${string}`, abi: ETRNOTE_ABI, functionName: 'mint',
      args: [address, result.etr_id, hashToBytes32(result.record_hash)],
    }))
  }

  function settle() {
    if (!settleTo) { setActErr('Enter a payee wallet address to settle.'); return }
    if (!result) return
    return runAction('Settle', () => writeContractAsync({
      address: SETTLE_TOKEN, abi: ERC20_ABI, functionName: 'transfer',
      args: [settleTo as `0x${string}`, parseUnits(result.amount, 18)],
    }))
  }

  return (
    <section className="card">
      <h2>Issue an ePN</h2>
      <p className="muted">Electronic promissory note · signed ML-DSA-65 · registered on ISET. Holder is bound to your wallet.</p>

      <label className="lbl">Amount</label>
      <div className="row">
        <input className="input" inputMode="decimal" placeholder="2500000" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <select className="input narrow" value={currency} onChange={(e) => setCurrency(e.target.value)}>
          <option>PHP</option><option>USD</option><option>cUSD</option>
        </select>
      </div>
      <label className="lbl">Payee (name or address)</label>
      <input className="input" placeholder="Juan Dela Cruz" value={payee} onChange={(e) => setPayee(e.target.value)} />
      <label className="lbl">Memo (optional)</label>
      <input className="input" placeholder="Narrative" value={memo} onChange={(e) => setMemo(e.target.value)} />

      <button className="btn full" onClick={handleIssue} disabled={busy}>{busy ? 'Issuing…' : 'Issue ePN'}</button>
      {err && <p className="err">{err}</p>}

      {result && (
        <div className="result">
          <div className="badge verified">✓ Issued &amp; signed · {result.signature_alg}</div>
          <dl>
            <dt>eTR id</dt><dd className="mono">{result.etr_id}</dd>
            <dt>Amount</dt><dd>{result.amount} {result.currency}</dd>
            <dt>Status</dt><dd>{result.status}{result.sandbox ? ' · sandbox' : ''}</dd>
            <dt>Record hash</dt><dd className="mono small">{result.record_hash}</dd>
          </dl>
          <a className="link" href={canonicalVerifyUrl(result.etr_id)} target="_blank" rel="noreferrer">Open record →</a>

          <div className="actions">
            <button className="btn ghost" onClick={anchor}>Anchor on Celo</button>
            <button className="btn ghost" onClick={mintNote}>Mint note {IS_TESTNET ? '(testnet)' : ''}</button>
          </div>
          <div className="row">
            <input className="input" placeholder="Settle to 0x… (cUSD)" value={settleTo} onChange={(e) => setSettleTo(e.target.value)} />
            <button className="btn ghost" onClick={settle}>Settle</button>
          </div>

          {tx && <p className="ok">{tx.label} sent · <a className="link" href={explorerTx(tx.hash)} target="_blank" rel="noreferrer">view tx →</a></p>}
          {actErr && <p className="err">{actErr}</p>}
          <p className="note">The Celo token is a <strong>mirror</strong> of the registry record. Control of the eTR stays in the ISET registry — minting needs the registry's reconciler role, and notes are non-transferable on-chain until the registry authorises it.</p>
        </div>
      )}
    </section>
  )
}
