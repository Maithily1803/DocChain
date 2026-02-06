import hre from "hardhat";
import "@nomicfoundation/hardhat-ethers";
import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Starting deployment...");

  const factory = await hre.ethers.getContractFactory("DocChain");

  const contract = await factory.deploy();

  await contract.waitForDeployment();

  const address = await contract.getAddress();

  console.log("✅ Deployment successful!");
  console.log("Contract address:", address);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

