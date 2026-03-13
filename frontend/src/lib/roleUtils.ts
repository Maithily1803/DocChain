import { ethers } from "ethers";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";

const ROLE_ABI = [
  "function getUserRole(address _user) external view returns (string)",
  "function instituteName(address) external view returns (string)"
];

export type UserRole = "admin" | "institute" | "student" | "none";

async function getReadProvider(): Promise<ethers.BrowserProvider | ethers.JsonRpcProvider> {
  if (typeof window !== "undefined" && window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum);
  }
  const rpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC || "https://rpc.sepolia.org";
  return new ethers.JsonRpcProvider(rpcUrl);
}

export async function getUserRole(address: string): Promise<UserRole> {
  if (!CONTRACT_ADDRESS) throw new Error("Contract address not set");
  const provider = await getReadProvider();
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ROLE_ABI, provider);
  const role = await contract.getUserRole(address) as string;
  return role as UserRole;
}

export async function getInstituteName(address: string): Promise<string> {
  if (!CONTRACT_ADDRESS) return "";
  try {
    const provider = await getReadProvider();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ROLE_ABI, provider);
    return await contract.instituteName(address) as string;
  } catch {
    return "";
  }
}

export async function detectRoleAndRedirect(
  address: string,
  push: (path: string) => void
): Promise<UserRole> {
  const role = await getUserRole(address);
  if (role === "admin") push("/admin");
  if (role === "institute") push("/institute");
  if (role === "student") push("/student");
  return role;
}