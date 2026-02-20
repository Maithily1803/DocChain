import { ethers } from "ethers";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";

const CONTRACT_ABI = [
  "function storeDocument(string memory _hash, string memory _ipfsCID, string memory _docType) public",
  "function verifyDocument(string memory _hash) public view returns (bool, address, uint256, string memory, string memory)",
  "event DocumentStored(string hash, address owner, string ipfsCID)",
];

async function getProvider(): Promise<ethers.BrowserProvider> {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask not found. Please install MetaMask from metamask.io");
  }
  return new ethers.BrowserProvider(window.ethereum);
}

async function assertSepoliaNetwork(provider: ethers.BrowserProvider) {
  const network = await provider.getNetwork();
  const SEPOLIA_CHAIN_ID = BigInt(11155111);
  if (network.chainId !== SEPOLIA_CHAIN_ID) {
    throw new Error(
      "Wrong network! Please switch MetaMask to Sepolia testnet (Chain ID: 11155111)"
    );
  }
}

export async function connectWallet(): Promise<string> {
  const provider = await getProvider();
  await provider.send("eth_requestAccounts", []);
  await assertSepoliaNetwork(provider);
  const signer = await provider.getSigner();
  return await signer.getAddress();
}

export async function storeDocumentOnChain(
  fileHash: string,
  ipfsCID: string,
  docType: string
): Promise<string> {
  if (!CONTRACT_ADDRESS) {
    throw new Error(
      "Contract address not set. Add NEXT_PUBLIC_CONTRACT_ADDRESS to .env.local"
    );
  }
  const provider = await getProvider();
  await assertSepoliaNetwork(provider);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  const tx = await contract.storeDocument(fileHash, ipfsCID, docType);
  await tx.wait();
  return tx.hash as string;
}

export interface VerificationResult {
  exists: boolean;
  owner: string;
  timestamp: Date | null;
  ipfsCID: string;
  docType: string;
}

export async function verifyDocumentOnChain(
  fileHash: string
): Promise<VerificationResult> {
  if (!CONTRACT_ADDRESS) {
    throw new Error("Contract address not set.");
  }
  const provider = await getProvider();
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  const [exists, owner, timestamp, ipfsCID, docType] =
    await contract.verifyDocument(fileHash);

  return {
    exists: exists as boolean,
    owner: exists ? (owner as string) : "",
    timestamp: exists ? new Date(Number(timestamp) * 1000) : null,
    ipfsCID: exists ? (ipfsCID as string) : "",
    docType: exists ? (docType as string) : "",
  };
}