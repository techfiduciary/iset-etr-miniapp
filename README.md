# ISET eTR — MiniApp (Celo / MiniPay)

Verify and issue **electronic transferable records** (eTRs) — starting with the
**ePN** (electronic promissory note) — from inside MiniPay. Built for Celo's
[Proof of Ship](https://www.celopg.eco/programs) program.

The sovereign part stays sovereign: issuance, **ML-DSA-65** (post-quantum) signing,
and the **registry of record** all live on the existing ISET engine. Celo is used
**only** as an interoperability + settlement bridge.

```
MiniPay (Celo)
  └─ this MiniApp  (Vite + React + wagmi)  → Cloudflare Pages
        ├─ Verify   → GET  /api/etr/verify/{id}  + client-side ML-DSA-65 re-check
        ├─ Issue ePN→ POST /api/etr/issue        (holder bound to wallet via SIWE)
        ├─ Anchor   → ETRAnchor.anchor(hash)     (commitment only — no contents)
        ├─ Settle   → cUSD transfer (Mento)
        └─ Mint     → eTRNote (soulbound mirror; registry-authoritative)

ISET / Fiduciary engine (unchanged)  →  issuance · ML-DSA-65 · registry · audit ledger
```

## Run locally
```bash
npm install
cp .env.example .env       # set VITE_ISET_API_BASE, VITE_CELO_CHAIN_ID
npm run dev                # http://localhost:5173
```
> Issuing needs wallet sign-in (SIWE) on the ISET engine and CORS for
> `localhost:5173`. Verify works against any public record id.

## Contracts
See [`contracts/README.md`](contracts/README.md). Deploy to Alfajores, then paste the
printed addresses into `.env` (`VITE_ANCHOR_ADDRESS`, `VITE_ETRNOTE_ADDRESS`).

## Deploy (Cloudflare Pages)
```bash
npm run deploy             # builds dist/ and runs wrangler pages deploy
```

## Layout
| Path | What |
|---|---|
| `src/lib/iset.ts` | client for the existing ISET eTR API (issue/verify/SIWE) |
| `src/lib/mldsa.ts` | client-side post-quantum signature re-verification |
| `src/lib/chain.ts` | Celo config, contract addresses, ABIs |
| `src/components/` | Connect · Verify · Issue |
| `contracts/` | `ETRAnchor` (notarisation) · `eTRNote` (soulbound mirror) |
| `CLAUDE.md` | architecture + contribution notes |
| `docs/PROOF-OF-SHIP.md` | submission checklist |

## Status
- ✅ Verify (read) + Issue ePN wired to the real API
- ✅ Anchor / Mint / Settle wired (inert until contracts deployed)
- ⏳ Wallet SIWE binding — pending ISET engine deploy
- ⏳ Contracts — written, not yet deployed (needs test wallet + faucet)
- ⏳ Mainnet + token transfers — **blocked on counsel sign-off**
