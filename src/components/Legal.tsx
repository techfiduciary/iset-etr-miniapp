export default function Legal() {
  return (
    <section className="card legal">
      <h2>Terms &amp; privacy</h2>

      <h3>What eInvoice is</h3>
      <p>eInvoice is a tool by ISET for issuing and verifying electronic invoices (eINV) as post-quantum-signed records. It is <strong>non-custodial</strong>: ISET never holds, moves, or disburses your money. Any payment or advance is made directly between you and your customer or funder.</p>

      <h3>Not a substitute for an official receipt</h3>
      <p>An eINV is a signed, verifiable record. Depending on your country, a legally valid <em>tax</em> invoice or official receipt may require specific registration (e.g. a BIR Official Receipt in the Philippines). You are responsible for meeting your local invoicing and tax rules; add your TIN and address in Brand &amp; details.</p>

      <h3>Tax</h3>
      <p>You set the tax type and rate for your own jurisdiction. eInvoice does not determine, collect, or remit tax. The amounts you enter are your responsibility.</p>

      <h3>The advance / financing feature</h3>
      <p>The cash-advance marketplace is in <strong>pilot, pending legal clearance</strong>, and is not available yet. When live, it will be non-custodial and limited to verified participants.</p>

      <h3>No financial or legal advice</h3>
      <p>eInvoice provides software, not financial, tax, or legal advice. Consult a qualified professional for your situation.</p>

      <h3>Privacy</h3>
      <p>To provide the service we store the data you enter — your business details and logo, and the invoices you issue (customer name, email, amount, dates). Records are signed and kept for verification and audit. We do not sell your data. Your wallet address is used to bind your identity and authorise your actions. Don't enter data you're not authorised to share.</p>

      <h3>Security</h3>
      <p>Every record is signed with ML-DSA-65 (post-quantum) and entered in a hash-chained audit ledger; anyone can verify a record and each ledger event. Control of a record stays in the ISET registry.</p>

      <p className="note">These terms summarise how eInvoice works and will be expanded into full Terms of Service and a Privacy Policy before general availability. Questions: the issuing ISET office.</p>
    </section>
  )
}
