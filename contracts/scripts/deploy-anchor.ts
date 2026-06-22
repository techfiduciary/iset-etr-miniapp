import hre from "hardhat";

// Deploys ONLY ETRAnchor (safe notarisation contract — no money, no token).
// Used for Celo MAINNET (Proof of Ship eligibility). eTRNote stays testnet/gated.
async function main() {
  const [wallet] = await hre.viem.getWalletClients();
  console.log("Deployer:", wallet.account.address);

  const anchor = await hre.viem.deployContract("ETRAnchor");
  console.log("\n✅ ETRAnchor deployed on Celo mainnet:");
  console.log(anchor.address);
  console.log("\nPaste this into Talent (Chain: Celo) and view on https://celoscan.io/address/" + anchor.address);
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
