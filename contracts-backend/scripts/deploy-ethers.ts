import hre from "hardhat";

async function main() {
  console.log("🚀 Starting deployment...");

  // Get the contract factory
  const DocChain = await hre.ethers.getContractFactory("DocChain");

  // Deploy the contract
  console.log("Deploying DocChain contract...");
  const docChain = await DocChain.deploy();

  // Wait for deployment to finish
  await docChain.waitForDeployment();

  // Get the contract address
  const address = await docChain.getAddress();

  console.log("✅ Deployment successful!");
  console.log("📄 Contract address:", address);
  console.log("\nSave this address for your frontend configuration!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });