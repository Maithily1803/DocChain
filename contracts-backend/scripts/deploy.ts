import { network } from "hardhat";

async function main() {
  console.log("Starting deployment...");
  
  const { viem } = await network.connect();
  
  console.log("Deploying DocChain contract...");
  const contract = await viem.deployContract("DocChain");
  
  console.log("\n=================================");
  console.log("✅ Deployment successful!");
  console.log("=================================");
  console.log(`Contract address: ${contract.address}`);
  console.log(`Network: hardhat`);
  console.log("=================================\n");
  
  console.log("📝 Next steps:");
  console.log("1. Add this to frontend .env.local:");
  console.log(`   NEXT_PUBLIC_CONTRACT_ADDRESS=${contract.address}`);
  console.log("\n");
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});