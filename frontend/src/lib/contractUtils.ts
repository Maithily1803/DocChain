import { ethers } from "ethers";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";

const CONTRACT_ABI = [
  "function storeDocument(string memory _hash, string memory _ipfsCID, string memory _docType) public",
  "function verifyDocument(string memory _hash) public view returns (bool, address, uint256, string memory, string memory)",
  "event DocumentStored(string hash, address owner, string ipfsCID)",
];

// ---------- GET PROVIDER ----------
async function getProvider(): Promise<ethers.BrowserProvider> {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask not found. Please install MetaMask from metamask.io");
  }

  return new ethers.BrowserProvider(window.ethereum);
}

// ---------- NETWORK CHECK ----------
async function assertSepoliaNetwork() {
  if (!window.ethereum) {
    throw new Error("MetaMask not detected");
  }

  const chainIdHex = await window.ethereum.request({
    method: "eth_chainId",
  });

const chainId = BigInt(chainIdHex as string);  const SEPOLIA_CHAIN_ID = 11155111n;

  console.log("Connected Chain ID:", chainId);

  if (chainId !== SEPOLIA_CHAIN_ID) {
    throw new Error(
      "Wrong network! Please switch MetaMask to Sepolia testnet (Chain ID: 11155111)"
    );
  }
}

// ---------- CONNECT WALLET ----------
export async function connectWallet(): Promise<string> {
  const provider = await getProvider();

  await provider.send("eth_requestAccounts", []);

  await assertSepoliaNetwork();

  const signer = await provider.getSigner();

  return await signer.getAddress();
}

// ---------- STORE DOCUMENT ----------
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

  await provider.send("eth_requestAccounts", []);

  await assertSepoliaNetwork();

  const signer = await provider.getSigner();

  const contract = new ethers.Contract(
    CONTRACT_ADDRESS,
    CONTRACT_ABI,
    signer
  );

  const tx = await contract.storeDocument(fileHash, ipfsCID, docType);

  console.log("Transaction sent:", tx.hash);

  await tx.wait();

  console.log("Transaction confirmed");

  return tx.hash as string;
}

// ---------- VERIFICATION RESULT TYPE ----------
export interface VerificationResult {
  exists: boolean;
  owner: string;
  timestamp: Date | null;
  ipfsCID: string;
  docType: string;
}

// ---------- VERIFY DOCUMENT ----------
export async function verifyDocumentOnChain(
  fileHash: string
): Promise<VerificationResult> {
  if (!CONTRACT_ADDRESS) {
    throw new Error("Contract address not set.");
  }

  const provider = await getProvider();

  const contract = new ethers.Contract(
    CONTRACT_ADDRESS,
    CONTRACT_ABI,
    provider
  );

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