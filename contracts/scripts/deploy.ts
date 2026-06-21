import hre from "hardhat";

// Deploys ETRAnchor + eTRNote and prints the env lines for the MiniApp.
async function main() {
  const [wallet] = await hre.viem.getWalletClients();
  const admin = wallet.account.address;
  const verifyBase = process.env.VERIFY_BASE || "https://iset.finance/record/?id=";

  console.log("Deployer / registry-reconciler:", admin);

  const anchor = await hre.viem.deployContract("ETRAnchor");
  console.log("ETRAnchor deployed:", anchor.address);

  const note = await hre.viem.deployContract("eTRNote", [admin, verifyBase]);
  console.log("eTRNote   deployed:", note.address);

  console.log("\n— Add these to ../.env (MiniApp) —");
  console.log(`VITE_ANCHOR_ADDRESS=${anchor.address}`);
  console.log(`VITE_ETRNOTE_ADDRESS=${note.address}`);
  console.log("\nReminder: transfersEnabled is FALSE (soulbound). Keep it off until counsel signs off.");
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
