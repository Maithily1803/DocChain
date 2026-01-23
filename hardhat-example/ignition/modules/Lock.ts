// ignition/modules/DocumentVerification.ts
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DocumentVerificationModule = buildModule("DocumentVerificationModule", (m) => {
  // Deploy the contract
  const documentVerification = m.contract("DocumentVerification");

  return { documentVerification };
});

export default DocumentVerificationModule;