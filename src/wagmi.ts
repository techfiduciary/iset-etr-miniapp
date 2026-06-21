import { http, createConfig } from 'wagmi'
import { celo } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'
import { ACTIVE_CHAIN, celoSepolia } from './lib/chain'

// MiniPay injects an EIP-1193 provider (window.ethereum.isMiniPay) and auto-connects.
// `injected` covers MiniPay in-app and a desktop browser wallet for local testing.
export const wagmiConfig = createConfig({
  chains: [celoSepolia, celo],
  connectors: [injected({ shimDisconnect: true })],
  transports: {
    [celoSepolia.id]: http(),
    [celo.id]: http(),
  },
})

// Auto-connect when running inside the MiniPay webview.
export function isMiniPay(): boolean {
  return typeof window !== 'undefined' && Boolean((window as any).ethereum?.isMiniPay)
}

export { ACTIVE_CHAIN }
