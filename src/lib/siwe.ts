import { siweNonce, siweVerify, setSession } from './iset'

// Minimal EIP-4361 (Sign-In With Ethereum) message. The backend re-parses the
// exact string and verifies the signature with viem's verifyMessage.
export function buildSiweMessage(opts: {
  address: string
  chainId: number
  nonce: string
  issuedAt: string
  domain: string
  uri: string
}): string {
  const { address, chainId, nonce, issuedAt, domain, uri } = opts
  return [
    `${domain} wants you to sign in with your Ethereum account:`,
    address,
    '',
    'Bind this wallet to your ISET eTR identity to issue and hold records.',
    '',
    `URI: ${uri}`,
    'Version: 1',
    `Chain ID: ${chainId}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
  ].join('\n')
}

// Full sign-in: fetch nonce → build message → sign → verify → session set in iset client.
export async function siweSignIn(
  address: string,
  chainId: number,
  signMessageAsync: (args: { message: string }) => Promise<string>,
): Promise<{ subject: string }> {
  const nonce = await siweNonce(address)
  const message = buildSiweMessage({
    address,
    chainId,
    nonce,
    issuedAt: new Date().toISOString(),
    domain: window.location.host,
    uri: window.location.origin,
  })
  const signature = await signMessageAsync({ message })
  const result = await siweVerify(message, signature)
  return { subject: result.subject }
}

export function signOut() { setSession(null) }
