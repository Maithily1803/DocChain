import { ethers } from "hardhat";

async function main() {
  console.log("Deploying DocChain Phase 1");

  const [deployer] = await ethers.getSigners();

  console.log("Deployer address :", deployer.address);
  console.log(
    "Deployer balance :",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    "ETH"
  );

  const Factory = await ethers.getContractFactory("DocChain");
  const docChain = await Factory.deploy();
  await docChain.waitForDeployment();

  const address = await docChain.getAddress();

  console.log("DocChain deployed");
  console.log("Contract address :", address);
  console.log("Admin / Issuer :", deployer.address);

  console.log("Add this to frontend/.env.local:");
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Deployment failed:", err);
    process.exit(1);
  });