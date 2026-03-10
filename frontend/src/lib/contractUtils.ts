import { ethers } from "ethers";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";

const CONTRACT_ABI = [
  "function admin() view returns (address)",
  "function issuers(address) view returns (bool)",
  "function grantIssuer(address _issuer) external",
  "function revokeIssuer(address _issuer) external",
  "function transferAdmin(address _newAdmin) external",
  "function storeDocument(string _hash, string _ipfsCID, string _docType) external",
  "function revokeDocument(string _hash) external",
  "function verifyDocument(string _hash) external view returns (uint8 status, address issuedBy, uint256 issuedAt, uint256 revokedAt, string ipfsCID, string docType)",
  "function getCertStatus(string _hash) external view returns (uint8)",
  "event IssuerGranted(address indexed issuer, address indexed grantedBy)",
  "event IssuerRevoked(address indexed issuer, address indexed revokedBy)",
  "event DocumentStored(string indexed hashKey, address indexed issuedBy, string ipfsCID, string docType, uint256 issuedAt)",
  "event DocumentRevoked(string indexed hashKey, address indexed revokedBy, uint256 revokedAt)",
];

export enum CertStatus {
  NotExists = 0,
  Active = 1,
  Revoked = 2,
}

export function certStatusLabel(status: CertStatus): string {
  switch (status) {
    case CertStatus.Active: return "Active";
    case CertStatus.Revoked: return "Revoked";
    default: return "Not Found";
  }
}

export interface VerificationResult {
  status: CertStatus;
  issuedBy: string;
  issuedAt: Date | null;
  revokedAt: Date | null;
  ipfsCID: string;
  docType: string;
}

async function getProvider(): Promise<ethers.BrowserProvider> {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask not found. Please install MetaMask.");
  }
  return new ethers.BrowserProvider(window.ethereum);
}

async function assertSepoliaNetwork(): Promise<void> {
  if (!window.ethereum) throw new Error("MetaMask not detected");

  const chainIdHex = await window.ethereum.request({ method: "eth_chainId" });
  const chainId = BigInt(chainIdHex as string);
  const SEPOLIA_CHAIN_ID = 11155111n;

  if (chainId !== SEPOLIA_CHAIN_ID) {
    throw new Error("Wrong network! Please switch MetaMask to Sepolia testnet (Chain ID: 11155111)");
  }
}

async function getSignerAndContract() {
  if (!CONTRACT_ADDRESS) {
    throw new Error("Contract address not set. Add NEXT_PUBLIC_CONTRACT_ADDRESS to .env.local");
  }

  const provider = await getProvider();
  await provider.send("eth_requestAccounts", []);
  await assertSepoliaNetwork();

  const signer = await provider.getSigner();
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

  return { signer, contract };
}

async function getReadContract() {
  if (!CONTRACT_ADDRESS) {
    throw new Error("Contract address not set.");
  }

  const provider = await getProvider();
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
}

export async function connectWallet(): Promise<string> {
  const provider = await getProvider();
  await provider.send("eth_requestAccounts", []);
  await assertSepoliaNetwork();
  const signer = await provider.getSigner();
  return await signer.getAddress();
}

export async function storeDocumentOnChain(
  fileHash: string,
  ipfsCID: string,
  docType: string
): Promise<string> {

  const { contract } = await getSignerAndContract();

  const tx = await contract.storeDocument(fileHash, ipfsCID, docType);
  console.log("Transaction sent:", tx.hash);

  await tx.wait();
  console.log("Transaction confirmed");

  return tx.hash as string;
}

export async function revokeDocumentOnChain(fileHash: string): Promise<string> {

  const { contract } = await getSignerAndContract();

  const tx = await contract.revokeDocument(fileHash);
  console.log("Revoke tx sent:", tx.hash);

  await tx.wait();
  console.log("Revoke confirmed");

  return tx.hash as string;
}

export async function verifyDocumentOnChain(
  fileHash: string
): Promise<VerificationResult> {

  const contract = await getReadContract();

  const [status, issuedBy, issuedAt, revokedAt, ipfsCID, docType] =
    await contract.verifyDocument(fileHash);

  const statusNum = Number(status) as CertStatus;

  return {
    status: statusNum,
    issuedBy: statusNum !== CertStatus.NotExists ? (issuedBy as string) : "",
    issuedAt: statusNum !== CertStatus.NotExists
      ? new Date(Number(issuedAt) * 1000)
      : null,
    revokedAt: statusNum === CertStatus.Revoked
      ? new Date(Number(revokedAt) * 1000)
      : null,
    ipfsCID: statusNum !== CertStatus.NotExists ? (ipfsCID as string) : "",
    docType: statusNum !== CertStatus.NotExists ? (docType as string) : "",
  };
}

export async function grantIssuer(issuerAddress: string): Promise<string> {

  const { contract } = await getSignerAndContract();

  const tx = await contract.grantIssuer(issuerAddress);
  await tx.wait();

  return tx.hash as string;
}

export async function revokeIssuerRole(issuerAddress: string): Promise<string> {

  const { contract } = await getSignerAndContract();

  const tx = await contract.revokeIssuer(issuerAddress);
  await tx.wait();

  return tx.hash as string;
}

export async function isIssuer(address: string): Promise<boolean> {

  const contract = await getReadContract();

  return await contract.issuers(address) as boolean;
}

export async function getAdmin(): Promise<string> {

  const contract = await getReadContract();

  return await contract.admin() as string;
}