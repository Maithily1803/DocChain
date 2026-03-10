import { ethers } from "ethers";
import { CertStatus, type VerificationResult } from "./contractUtils";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";

const CONTRACT_ABI = [
  "function verifyDocument(string _hash) external view returns (uint8 status, address issuedBy, uint256 issuedAt, uint256 revokedAt, string ipfsCID, string docType)",
  "event DocumentStored(string indexed hashKey, address indexed issuedBy, string ipfsCID, string docType, uint256 issuedAt)",
  "event DocumentRevoked(string indexed hashKey, address indexed revokedBy, uint256 revokedAt)",
];

export interface CertificateRecord extends VerificationResult {
  hash: string;
  txHash?: string;
}

async function getReadProvider(): Promise<ethers.BrowserProvider> {
  if (typeof window !== "undefined" && window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum);
  }

  const rpcUrl =
    process.env.NEXT_PUBLIC_SEPOLIA_RPC ||
    "https://rpc.sepolia.org";

  return new ethers.JsonRpcProvider(rpcUrl) as unknown as ethers.BrowserProvider;
}

export async function fetchCertificatesForAddress(
  walletAddress: string
): Promise<CertificateRecord[]> {
  if (!CONTRACT_ADDRESS) {
    throw new Error("Contract address not set. Add NEXT_PUBLIC_CONTRACT_ADDRESS to .env.local");
  }

  const provider = await getReadProvider();
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

  const filter = contract.filters.DocumentStored(null, walletAddress);
  const events = await contract.queryFilter(filter, 0, "latest");

  const records: CertificateRecord[] = await Promise.all(
    events.map(async (event) => {
      const log = event as ethers.EventLog;
      const hashKey: string = log.args?.[0] ?? "";
      const txHash = event.transactionHash;

      try {
        const [status, issuedBy, issuedAt, revokedAt, ipfsCID, docType] =
          await contract.verifyDocument(hashKey);

        const statusNum = Number(status) as CertStatus;

        return {
          hash: hashKey,
          txHash,
          status: statusNum,
          issuedBy: issuedBy as string,
          issuedAt: new Date(Number(issuedAt) * 1000),
          revokedAt:
            statusNum === CertStatus.Revoked
              ? new Date(Number(revokedAt) * 1000)
              : null,
          ipfsCID: ipfsCID as string,
          docType: docType as string,
        } satisfies CertificateRecord;
      } catch {
        return {
          hash: hashKey,
          txHash,
          status: CertStatus.NotExists,
          issuedBy: walletAddress,
          issuedAt: null,
          revokedAt: null,
          ipfsCID: "",
          docType: "Unknown",
        } satisfies CertificateRecord;
      }
    })
  );

  return records.sort((a, b) => {
    const ta = a.issuedAt?.getTime() ?? 0;
    const tb = b.issuedAt?.getTime() ?? 0;
    return tb - ta;
  });
}

export async function fetchCertByHash(hash: string): Promise<CertificateRecord> {
  if (!CONTRACT_ADDRESS) {
    throw new Error("Contract address not set.");
  }

  const provider = await getReadProvider();
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

  const [status, issuedBy, issuedAt, revokedAt, ipfsCID, docType] =
    await contract.verifyDocument(hash);

  const statusNum = Number(status) as CertStatus;

  return {
    hash,
    status: statusNum,
    issuedBy: issuedBy as string,
    issuedAt:
      statusNum !== CertStatus.NotExists
        ? new Date(Number(issuedAt) * 1000)
        : null,
    revokedAt:
      statusNum === CertStatus.Revoked
        ? new Date(Number(revokedAt) * 1000)
        : null,
    ipfsCID: ipfsCID as string,
    docType: docType as string,
  };
}