# ISET eTR — Celo contracts

Two contracts, both **testnet-first**:

| Contract | Role | Sovereignty rule |
|---|---|---|
| `ETRAnchor` | Notarises a record commitment (`hash` + `auditId`) on Celo | Stores **no contents, no ML-DSA signature** — just a timestamped commitment |
| `eTRNote` | ERC-721 *mirror* of an eTR | **Soulbound** (non-transferable) + mint gated by `MINTER_ROLE`; control stays in the ISET registry |

## Deploy (Celo Sepolia testnet)

1. `cd contracts && npm install`
2. `cp .env.example .env` and set `PRIVATE_KEY` (a **test** wallet) — fund it at <https://faucet.celo.org/celo-sepolia> (or the Google Cloud Web3 faucet)
3. `npm run build`
4. `npm run deploy:celosepolia`
5. Copy the printed `VITE_ANCHOR_ADDRESS` / `VITE_ETRNOTE_ADDRESS` into `../.env`

Celo Sepolia: chain id **11142220**, RPC `https://forno.celo-sepolia.celo-testnet.org`, explorer <https://sepolia.celoscan.io>. (Alfajores is deprecated.)

## Mainnet
`npm run deploy:celo` — **do not run until counsel signs off** (see repo `CLAUDE.md`). `transfersEnabled` must stay `false` until then.
