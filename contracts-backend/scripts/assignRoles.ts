import { ethers } from "hardhat";

const INSTITUTES: { address: string; name: string }[] = [
  { address: "0xD4D19A5de776c425121935dcB49B4AE77566218C", name: "sathaye_college_demo" },
  { address: "0x46Fc4C44bFbD3e3e358D1741C205cE04AdA0c6bd", name: "singhania_college_demo" },
  { address: "0xAb8931f9AF218D1FE0ddcbFa4b046fDf7F26Bd3C", name: "xavier_college_demo" },
  { address: "0xA5067d4fE59756157d290582F15fAA20d204E09f", name: "St. Joseph's Convent_demo"},
];

const STUDENTS: string[] = [
  "0xAd453cE6582f1eBc7bcb94c0B7B657C376FcE4bB",
  "0x09B2A089A38EB7Cb0c4485bbfdB4c58d22Ae53B3",
];

const CONTRACT_ADDRESS = "0x98AE6af7B4B54212c6B8A588CC52BE2ad9060589";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Admin wallet:", deployer.address);

  const DocChain = await ethers.getContractAt("DocChain", CONTRACT_ADDRESS);

  console.log("\nRegistering institutes");
  for (const inst of INSTITUTES) {
    console.log(`Registering ${inst.name} (${inst.address})`);
    const tx = await DocChain.registerInstitute(inst.address, inst.name);
    await tx.wait();
    console.log(`Done tx: ${tx.hash}`);
  }

  console.log("\nAssigning student roles");
  for (const addr of STUDENTS) {
    console.log(`Assigning student role to ${addr}`);
    const tx = await DocChain.assignStudentRole(addr);
    await tx.wait();
    console.log(`Done tx: ${tx.hash}`);
  }

  console.log("\nAll roles assigned successfully.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Failed:", err);
    process.exit(1);
  });