// Alternative deployment script using @nomicfoundation/hardhat-ethers
// This works if you have the plugin installed and configured

import hre from "hardhat";

async function main() {
  console.log("Starting deployment...");
  
  // Get the contract factory
  const factory = await hre.ethers.getContractFactory("DocChain");
  console.log("Contract factory created");

  // Deploy the contract
  console.log("Deploying contract...");
  const contract = await factory.deploy();

  // Wait for deployment
  await contract.waitForDeployment();

  // Get the deployed address
  const address = await contract.getAddress();
  
  console.log("\n=================================");
  console.log("✅ Deployment successful!");
  console.log("=================================");
  console.log(`Contract address: ${address}`);
  console.log(`Network: ${hre.network.name}`);
  console.log("=================================\n");
  
  console.log("📝 Next steps:");
  console.log("1. Copy the contract address above");
  console.log("2. Add it to your frontend .env.local:");
  console.log(`   NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`);
  console.log("3. If on Sepolia, verify the contract:");
  console.log(`   npx hardhat verify --network ${hre.network.name} ${address}`);
  console.log("\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });