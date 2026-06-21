import {
  IconLock, IconKey, IconArrowRight, IconFileInvoice, IconCash, IconCircleCheck,
  IconUsers, IconTruck, IconBuildingWarehouse, IconBuildingFactory2, IconTools, IconWorld,
} from '@tabler/icons-react'

const STEPS = [
  { Icon: IconFileInvoice, t: 'Issue your invoice', s: 'Recorded as a signed eINV' },
  { Icon: IconCash, t: 'Get cash now', s: 'A verified funder advances most of it' },
  { Icon: IconCircleCheck, t: 'Customer pays at due date', s: 'Funder repaid · you’re settled' },
]

const INDUSTRIES = [
  { Icon: IconUsers, t: 'Staffing & manpower', s: 'Pay workers weekly — clients pay in 30–60 days' },
  { Icon: IconTruck, t: 'Trucking & logistics', s: 'Fuel and drivers now — shippers pay in 30–90' },
  { Icon: IconBuildingWarehouse, t: 'Wholesale & distribution', s: 'Restock now — retailers buy on terms' },
  { Icon: IconBuildingFactory2, t: 'Manufacturers & suppliers', s: 'Produce now — big buyers pay net-60' },
  { Icon: IconTools, t: 'Construction subcontractors', s: 'Materials & labor now — billed over months' },
  { Icon: IconWorld, t: 'Import / export traders', s: 'Pay producers now — buyers pay later' },
]

export default function Home({ onIssue, onVerify }: { onIssue: () => void; onVerify: () => void }) {
  return (
    <div className="home">
      <section className="hero">
        <div className="eyebrow">Invoice financing · on MiniPay</div>
        <h1>Get paid now,<br />not in 90 days.</h1>
        <p>Record an unpaid invoice as a signed eINV, get a cash advance against it today, and let your customer pay on time. No new loan. No collateral.</p>
        <button className="btn full" onClick={onIssue}>Issue an invoice</button>
        <div className="trust">
          <span><IconLock size={14} stroke={1.75} /> post-quantum signed</span>
          <span><IconKey size={14} stroke={1.75} /> you keep control</span>
          <span><IconArrowRight size={14} stroke={1.75} /> funder pays you directly</span>
        </div>
      </section>

      <section className="block">
        <h2>How it works</h2>
        <div className="steps">
          {STEPS.map((s, i) => (
            <div className="step2" key={i}>
              <div className="ic"><s.Icon size={20} stroke={1.75} /></div>
              <div>
                <div className="st">{s.t}</div>
                <div className="ss">{s.s}</div>
              </div>
              <div className="num">{i + 1}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="block">
        <h2>Who uses this</h2>
        <p className="muted">Businesses that deliver first and get paid on terms.</p>
        <div className="industries">
          {INDUSTRIES.map((x, i) => (
            <div className="icard" key={i}>
              <x.Icon size={20} stroke={1.75} className="icard-i" />
              <div className="it">{x.t}</div>
              <div className="is">{x.s}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="block">
        <h2>Already have a record?</h2>
        <p className="muted">Anyone can verify a record's signature and provenance.</p>
        <button className="btn ghost" onClick={onVerify}>Verify a record</button>
      </section>

      <section className="block disclaim">
        Issuing and verifying an eINV is available now. The cash-advance marketplace is in pilot, pending legal clearance — and is non-custodial: a verified funder pays you directly, and ISET never holds your money.
      </section>
    </div>
  )
}
