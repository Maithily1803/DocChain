import hre from "hardhat";

async function main() {
  const factory = await hre.ethers.getContractFactory("DocChain");

  const contract = await factory.deploy();

  await contract.waitForDeployment();

  console.log("Deployed to:", await contract.getAddress());
}

main();

