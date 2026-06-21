# Proof of Ship — submission checklist

Celo's Proof of Ship is a monthly builder program (now MiniPay-focused) with a
~$5K USDT pool across the top projects, scored on **shipped progress + GitHub
activity + on-chain activity**, tracked via **Karma GAP**.

## Map: what we ship → how it scores
| Judging signal | This project |
|---|---|
| Real MiniApp on MiniPay | Mobile-first Vite app, injected MiniPay wallet, deep-linkable record QR |
| On-chain activity | `ETRAnchor.anchor()` per issued eTR + optional cUSD settlement transfers |
| GitHub activity | This repo — conventional commits, milestone branches |
| Karma GAP project | Register + link this repo and the deployed contracts |
| Solves a local, practical problem | Trade-finance records (promissory notes, invoices) for emerging-market MSMEs that MiniPay already serves |

## To submit (manual steps)
1. **Push repo to GitHub** (public).
2. **Deploy contracts** to Celo Sepolia → fund a test wallet at <https://faucet.celo.org/celo-sepolia>.
3. **Deploy MiniApp** to Cloudflare Pages (`npm run deploy`).
4. **Register on Karma GAP**: <https://gap.karmahq.xyz> → create a project for the Celo Proof of Ship community; attach repo + contract addresses + live URL.
5. **List the Mini App in MiniPay**: site-tester / dev flow per <https://docs.celo.org/build/build-on-minipay>.
6. **Record a short demo** (verify a record + issue an ePN + anchor on Celo).

## What stays out of scope for the contest
- Mainnet token transfers (counsel-gated).
- Any claim of BSP supervision or that MLETR is globally in force.
