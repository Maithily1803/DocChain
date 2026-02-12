# DocChain - Deployment & Integration Guide

## 🔧 Step 1: Fix Deployment Script Error

### Problem
The original `deploy-ethers.ts` had redundant imports and incorrect error handling.

### Solution
Replace your `contracts-backend/scripts/deploy-ethers.ts` with:

```typescript
import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Starting deployment...");

  // Get the contract factory
  const DocChain = await ethers.getContractFactory("DocChain");

  // Deploy the contract
  console.log("Deploying DocChain contract...");
  const docChain = await DocChain.deploy();

  // Wait for deployment to finish
  await docChain.waitForDeployment();

  // Get the contract address
  const address = await docChain.getAddress();

  console.log("✅ Deployment successful!");
  console.log("📄 Contract address:", address);
  console.log("\nSave this address for your frontend configuration!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
```

---

## 🚀 Step 2: Deploy Your Smart Contract

### 2.1 Set Up Environment Variables

Create a `.env` file in `contracts-backend/`:

```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
SEPOLIA_PRIVATE_KEY=your_private_key_here
```

**⚠️ IMPORTANT SECURITY NOTES:**
- Never commit `.env` to Git
- Use a test wallet with small amounts of ETH
- Get Sepolia testnet ETH from: https://sepoliafaucet.com/

### 2.2 Install Dependencies

```bash
cd contracts-backend
npm install
```

### 2.3 Compile Contracts

```bash
npx hardhat compile
```

### 2.4 Deploy to Sepolia Testnet

```bash
npx hardhat run scripts/deploy-ethers.ts --network sepolia
```

**Save the contract address** that gets printed! You'll need it for the frontend.

---

## 📝 Step 3: Add IPFS Integration

Your project needs IPFS for document storage. Let's add it:

### 3.1 Install IPFS Dependencies (Frontend)

```bash
cd frontend
npm install ipfs-http-client
```

### 3.2 Create IPFS Utility

Create `frontend/src/lib/ipfsUtils.ts`:

```typescript
import { create } from 'ipfs-http-client';

// Using Infura IPFS (you can also use Pinata or your own node)
const projectId = 'YOUR_INFURA_PROJECT_ID';
const projectSecret = 'YOUR_INFURA_PROJECT_SECRET';
const auth = 'Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64');

const client = create({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
  headers: {
    authorization: auth,
  },
});

export async function uploadToIPFS(file: File): Promise<string> {
  try {
    const added = await client.add(file);
    return added.path; // This is the IPFS hash (CID)
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw error;
  }
}

export function getIPFSUrl(hash: string): string {
  return `https://ipfs.io/ipfs/${hash}`;
}
```

---

## 🔗 Step 4: Create Contract Interaction Layer

Create `frontend/src/lib/contractUtils.ts`:

```typescript
import { ethers } from 'ethers';

// Replace with your deployed contract address
const CONTRACT_ADDRESS = 'YOUR_DEPLOYED_CONTRACT_ADDRESS';

const CONTRACT_ABI = [
  "function storeDocument(string memory _hash) public",
  "function verifyDocument(string memory _hash) public view returns (bool, address, uint256)",
  "event DocumentStored(string hash, address owner)"
];

export async function storeDocumentOnChain(fileHash: string) {
  if (typeof window.ethereum === 'undefined') {
    throw new Error('MetaMask is not installed!');
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();

  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

  const tx = await contract.storeDocument(fileHash);
  await tx.wait();

  return tx.hash;
}

export async function verifyDocumentOnChain(fileHash: string) {
  if (typeof window.ethereum === 'undefined') {
    throw new Error('MetaMask is not installed!');
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

  const [exists, owner, timestamp] = await contract.verifyDocument(fileHash);

  return {
    exists,
    owner,
    timestamp: new Date(Number(timestamp) * 1000),
  };
}
```

---

## 🎨 Step 5: Update Frontend Components

### 5.1 Install Ethers.js

```bash
cd frontend
npm install ethers
```

### 5.2 Update Verify Page

Update `frontend/src/app/Verifiy/page.tsx`:

```typescript
"use client";

import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { generateFileHash } from "@/lib/hashUtils";
import { uploadToIPFS } from "@/lib/ipfsUtils";
import { storeDocumentOnChain, verifyDocumentOnChain } from "@/lib/contractUtils";
import { Check, Copy, Upload, Shield } from "lucide-react";

export default function VerifyPage() {
  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState<string>("");
  const [ipfsHash, setIpfsHash] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setHash("");
      setIpfsHash("");
      setCopied(false);
      setVerificationResult(null);
    }
  };

  const handleUploadAndStore = async () => {
    if (!file) {
      alert("Please upload a file first.");
      return;
    }

    try {
      setLoading(true);

      // Step 1: Generate file hash
      console.log("Generating file hash...");
      const fileHash = await generateFileHash(file);
      setHash(fileHash);

      // Step 2: Upload to IPFS
      console.log("Uploading to IPFS...");
      const cid = await uploadToIPFS(file);
      setIpfsHash(cid);

      // Step 3: Store hash on blockchain
      console.log("Storing on blockchain...");
      await storeDocumentOnChain(fileHash);

      alert("✅ Document successfully stored on blockchain!");
    } catch (error: any) {
      console.error("Error:", error);
      alert("❌ Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!hash) {
      alert("Please generate hash first or enter a hash to verify.");
      return;
    }

    try {
      setLoading(true);
      const result = await verifyDocumentOnChain(hash);
      setVerificationResult(result);
    } catch (error: any) {
      console.error("Error:", error);
      alert("❌ Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!hash) return;
    await navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <div className="p-8 rounded-xl shadow-lg bg-card w-full max-w-2xl text-center border border-border">
        <h2 className="text-3xl font-bold mb-6">Document Verification</h2>

        {/* File Upload */}
        <div className="mb-6">
          <Input
            type="file"
            accept="image/*,.pdf,.doc,.docx"
            onChange={handleFileChange}
            className="block w-full mb-4 text-sm border border-border rounded-lg cursor-pointer"
          />
          {file && (
            <p className="text-sm text-muted-foreground">
              Selected: {file.name}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <Button 
            onClick={handleUploadAndStore} 
            className="flex-1"
            disabled={!file || loading}
          >
            <Upload className="w-4 h-4 mr-2" />
            {loading ? "Processing..." : "Upload & Store"}
          </Button>
          <Button 
            onClick={handleVerify} 
            variant="outline"
            className="flex-1"
            disabled={!hash || loading}
          >
            <Shield className="w-4 h-4 mr-2" />
            Verify
          </Button>
        </div>

        {/* Hash Display */}
        {hash && (
          <div className="mt-6 text-left bg-muted p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <strong className="text-sm">SHA-256 Hash:</strong>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="text-xs"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-500 mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs break-all font-mono">{hash}</p>
          </div>
        )}

        {/* IPFS Hash */}
        {ipfsHash && (
          <div className="mt-4 text-left bg-muted p-4 rounded-lg">
            <strong className="text-sm">IPFS CID:</strong>
            <p className="text-xs break-all font-mono mt-1">{ipfsHash}</p>
            <a 
              href={`https://ipfs.io/ipfs/${ipfsHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary underline mt-2 inline-block"
            >
              View on IPFS
            </a>
          </div>
        )}

        {/* Verification Result */}
        {verificationResult && (
          <div className={`mt-6 p-4 rounded-lg ${
            verificationResult.exists ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'
          }`}>
            <h3 className="font-bold mb-2">
              {verificationResult.exists ? '✅ Document Verified' : '❌ Document Not Found'}
            </h3>
            {verificationResult.exists && (
              <div className="text-sm text-left space-y-1">
                <p><strong>Owner:</strong> {verificationResult.owner}</p>
                <p><strong>Timestamp:</strong> {verificationResult.timestamp.toLocaleString()}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 🔐 Step 6: Environment Setup

### Frontend Environment Variables

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=YOUR_DEPLOYED_CONTRACT_ADDRESS
NEXT_PUBLIC_INFURA_PROJECT_ID=your_infura_project_id
NEXT_PUBLIC_INFURA_PROJECT_SECRET=your_infura_project_secret
```

---

## 📋 Step 7: Complete Workflow

### For Users to Store Documents:

1. **Connect MetaMask** to Sepolia testnet
2. **Upload Document** via your UI
3. **Generate Hash** (SHA-256)
4. **Upload to IPFS** (get CID)
5. **Store Hash** on blockchain (costs gas)
6. **Receive Confirmation** with transaction hash

### For Users to Verify Documents:

1. **Upload Document** to verify
2. **Generate Hash**
3. **Query Blockchain** with hash
4. **Get Result**: exists/doesn't exist, owner, timestamp

---

## 🧪 Testing Checklist

- [ ] Contract compiles successfully
- [ ] Contract deploys to Sepolia
- [ ] Can connect MetaMask to frontend
- [ ] Can upload file and generate hash
- [ ] Can upload to IPFS
- [ ] Can store hash on blockchain
- [ ] Can verify document from blockchain
- [ ] UI shows proper loading states
- [ ] Error messages are clear

---

## 🚨 Common Issues & Solutions

### Issue 1: "MetaMask not installed"
**Solution:** Install MetaMask browser extension

### Issue 2: "Insufficient funds"
**Solution:** Get Sepolia ETH from https://sepoliafaucet.com/

### Issue 3: "Network mismatch"
**Solution:** Switch MetaMask to Sepolia testnet

### Issue 4: IPFS upload fails
**Solution:** Check Infura credentials or use alternative (Pinata, Web3.Storage)

### Issue 5: Contract interaction fails
**Solution:** Verify contract address is correct in frontend config

---

## 🔄 Next Steps

1. **Fix deployment script** ✅
2. **Deploy contract to Sepolia**
3. **Add IPFS integration**
4. **Update frontend with contract interaction**
5. **Test end-to-end flow**
6. **Add MetaMask connection UI**
7. **Improve error handling**
8. **Add loading indicators**
9. **Deploy frontend** (Vercel/Netlify)

---

## 📚 Useful Resources

- **Hardhat Docs:** https://hardhat.org/docs
- **Ethers.js Docs:** https://docs.ethers.org/
- **IPFS Docs:** https://docs.ipfs.tech/
- **Sepolia Faucet:** https://sepoliafaucet.com/
- **MetaMask Docs:** https://docs.metamask.io/

---

## 🎯 Project Architecture

```
DocChain Flow:
1. User uploads file → Frontend
2. Generate SHA-256 hash → hashUtils.ts
3. Upload file to IPFS → ipfsUtils.ts (get CID)
4. Store hash on blockchain → DocChain.sol (via contractUtils.ts)
5. User can verify by uploading same file
6. System generates hash and checks blockchain
7. Returns: verified/not verified + metadata
```

---

Good luck with your DocChain project! 🚀