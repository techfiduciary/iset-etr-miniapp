import { celo, celoAlfajores } from 'wagmi/chains'

const CHAIN_ID = Number(import.meta.env.VITE_CELO_CHAIN_ID ?? 44787)
export const ACTIVE_CHAIN = CHAIN_ID === 42220 ? celo : celoAlfajores
export const IS_TESTNET = ACTIVE_CHAIN.id !== celo.id

// Mento stablecoin used for the optional settlement demo (cUSD).
const CUSD: Record<number, `0x${string}`> = {
  44787: '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1', // Alfajores cUSD
  42220: '0x765DE816845861e75A25fCA122bb6898B8B1282a', // Mainnet cUSD
}
export const SETTLE_TOKEN: `0x${string}` =
  (import.meta.env.VITE_SETTLE_TOKEN_ADDRESS as `0x${string}`) || CUSD[ACTIVE_CHAIN.id] || CUSD[44787]

export const ANCHOR_ADDRESS = (import.meta.env.VITE_ANCHOR_ADDRESS || '') as `0x${string}` | ''
export const ETRNOTE_ADDRESS = (import.meta.env.VITE_ETRNOTE_ADDRESS || '') as `0x${string}` | ''

export function explorerTx(hash: string): string {
  const base = ACTIVE_CHAIN.id === celo.id ? 'https://celoscan.io' : 'https://alfajores.celoscan.io'
  return `${base}/tx/${hash}`
}

// ── ABIs (only the functions the MiniApp calls) ───────────────────────────────
export const ANCHOR_ABI = [
  {
    type: 'function', name: 'anchor', stateMutability: 'nonpayable',
    inputs: [
      { name: 'etrId', type: 'string' },
      { name: 'recordHash', type: 'bytes32' },
      { name: 'auditId', type: 'string' },
    ],
    outputs: [],
  },
  {
    type: 'function', name: 'getAnchor', stateMutability: 'view',
    inputs: [{ name: 'etrId', type: 'string' }],
    outputs: [
      { name: 'recordHash', type: 'bytes32' },
      { name: 'auditId', type: 'string' },
      { name: 'anchoredBy', type: 'address' },
      { name: 'anchoredAt', type: 'uint64' },
    ],
  },
] as const

export const ETRNOTE_ABI = [
  {
    type: 'function', name: 'mint', stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'etrId', type: 'string' },
      { name: 'recordHash', type: 'bytes32' },
    ],
    outputs: [{ name: 'tokenId', type: 'uint256' }],
  },
] as const

export const ERC20_ABI = [
  { type: 'function', name: 'transfer', stateMutability: 'nonpayable', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }] },
  { type: 'function', name: 'decimals', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'uint8' }] },
  { type: 'function', name: 'balanceOf', stateMutability: 'view', inputs: [{ name: 'a', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
] as const
