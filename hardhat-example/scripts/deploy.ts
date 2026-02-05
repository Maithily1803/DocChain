import { ethers } from "hardhat";

async function main() {
  const DocChain = await ethers.getContractFactory("DocChain");
  const docChain = await DocChain.deploy();
  await docChain.waitForDeployment();

  console.log("Deployed at:", await docChain.getAddress());
}

main();
