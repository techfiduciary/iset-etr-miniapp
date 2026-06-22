import { IconClock, IconTrendingUp, IconShield } from '@tabler/icons-react'

interface Listing { debtor: string; sector: string; amount: number; currency: string; term: string; advancePct: number; yieldApr: string }

// Sample listings — illustrative only. Live funding is gated to verified funders, pending compliance.
const SAMPLES: Listing[] = [
  { debtor: 'Dela Cruz Trading', sector: 'Wholesale', amount: 250000, currency: 'PHP', term: 'due in 60 days', advancePct: 95, yieldApr: '~18% p.a.' },
  { debtor: 'Metro Hotel Group', sector: 'Hospitality', amount: 480000, currency: 'PHP', term: 'due in 45 days', advancePct: 96, yieldApr: '~16% p.a.' },
  { debtor: 'Cebu Logistics Inc.', sector: 'Trucking', amount: 120000, currency: 'PHP', term: 'due in 30 days', advancePct: 97, yieldApr: '~20% p.a.' },
]

function fmt(n: number) { return n.toLocaleString() }

export default function Marketplace() {
  return (
    <section className="card">
      <div className="mkt-banner">Pilot · financing not enabled yet — verified funders only, pending compliance. Sample listings below.</div>
      <h2>Invoice marketplace</h2>
      <p className="muted">Funders advance cash against a verified invoice and earn the discount when the customer pays. Non-custodial — the funder pays the seller directly; ISET only signs and attests. Capital is at risk; returns are not guaranteed.</p>

      <div className="ledger-h" style={{ marginTop: '14px' }}>Sample listings (preview)</div>
      {SAMPLES.map((l, i) => {
        const advance = Math.round(l.amount * l.advancePct / 100)
        return (
          <div className="mcard" key={i}>
            <div className="mtop">
              <div>
                <div className="mdebtor">{l.debtor}</div>
                <div className="mamt">{fmt(l.amount)} {l.currency}</div>
              </div>
              <span className="msector">{l.sector}</span>
            </div>
            <div className="mrow">
              <span><IconClock size={13} stroke={1.75} /> {l.term}</span>
              <span><IconTrendingUp size={13} stroke={1.75} /> est. {l.yieldApr}</span>
              <span><IconShield size={13} stroke={1.75} /> signed eINV</span>
            </div>
            <div className="mrow"><span>Advance now: <strong style={{ color: 'var(--ink)' }}>{fmt(advance)} {l.currency}</strong> ({l.advancePct}%) · collect {fmt(l.amount)} at due date</span></div>
            <button className="btn full mfund" disabled>Fund — verified funders, pilot</button>
          </div>
        )
      })}

      <a className="btn cta" href="mailto:fiduciary@iset.finance?subject=eInvoice%20funder%20access&body=I%27d%20like%20to%20be%20a%20verified%20funder%20on%20eInvoice.">Request funder access</a>

      <div className="mdisc">
        How it works: you fund a verified invoice at a discount and are repaid in full when the customer pays — your profit is the discount, your risk is non-payment. eInvoice is non-custodial and never guarantees returns. Funding opens to verified (KYC'd) funders once compliance clears; nothing here is an offer to invest.
      </div>
    </section>
  )
}
