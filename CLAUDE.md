# CLAUDE.md — ISET eTR MiniApp

Notes for anyone (human or AI) working on this repo.

## What this is
A MiniPay/Celo Mini App that lets users **verify** and **issue** ISET electronic
transferable records (eTRs) — starting with the ePN (electronic promissory note).
It is a thin front end over ISET's existing record engine; it does **not**
re-implement issuance, signing, or the registry.

## Architecture rules (keep these intact)
1. **The registry is the source of truth.** Issuance, post-quantum (ML-DSA-65)
   signing, and the record registry live on the ISET engine. This app calls that
   API — it never signs records itself.
2. **Signatures stay off-chain.** Celo only ever stores a SHA-256 commitment +
   audit id. The legal signature is never reduced to an EVM signature.
3. **The token is a mirror, not the asset.** `eTRNote` references the canonical
   record id + hash; control of the record stays in the registry. It ships
   **soulbound** (non-transferable) and **testnet-first**, with transfers and any
   mainnet deploy gated on legal review.
4. **Be honest in the UI.** No fake "verified" states — show an honest "server
   verified" status when client-side re-verification can't be completed.

## Stack
- Front end: Vite + React + wagmi/viem → static `dist/` → Cloudflare Pages.
- Auth: wallet sign-in (SIWE) against the ISET engine.
- Contracts: Hardhat + OpenZeppelin v5 (`contracts/`), Celo Alfajores → mainnet (gated).

## Contributing
Work on a branch; conventional commits; open a PR. Don't commit secrets or `.env`.
