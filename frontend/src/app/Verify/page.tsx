"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { generateFileHash } from "@/lib/hashUtils";
import { uploadToIPFS, getIPFSUrl, testPinataConnection } from "@/lib/ipfsUtils";
import {
  storeDocumentOnChain,
  verifyDocumentOnChain,
  connectWallet,
  type VerificationResult,
} from "@/lib/contractUtils";
import { Check, Copy, Upload, Shield, Wallet, AlertCircle } from "lucide-react";

const DOC_TYPES = ["Degree", "Marksheet", "Certificate", "Transcript", "Other"];
type Step = "idle" | "hashing" | "ipfs" | "blockchain" | "done";

export default function VerifyPage() {
  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState("");
  const [ipfsCID, setIpfsCID] = useState("");
  const [docType, setDocType] = useState("Degree");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [verificationResult, setVerificationResult] =
    useState<VerificationResult | null>(null);
  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState("");
  const [pinataOk, setPinataOk] = useState<boolean | null>(null);

  useEffect(() => {
    testPinataConnection().then(setPinataOk);
  }, []);

  const handleConnectWallet = async () => {
    setError("");
    try {
      const addr = await connectWallet();
      setWalletAddress(addr);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Wallet connection failed");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setHash("");
      setIpfsCID("");
      setVerificationResult(null);
      setStep("idle");
      setError("");
    }
  };

  const handleStore = async () => {
    if (!file) return setError("Please select a file.");
    if (!walletAddress) return setError("Connect your wallet first.");
    setError("");
    setLoading(true);
    try {
      setStep("hashing");
      const fileHash = await generateFileHash(file);
      setHash(fileHash);

      setStep("ipfs");
      const cid = await uploadToIPFS(file);
      setIpfsCID(cid);

      setStep("blockchain");
      await storeDocumentOnChain(fileHash, cid, docType);
      setStep("done");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setStep("idle");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!file) return setError("Please select a file to verify.");
    setError("");
    setLoading(true);
    setVerificationResult(null);
    try {
      setStep("hashing");
      const fileHash = await generateFileHash(file);
      setHash(fileHash);

      setStep("blockchain");
      const result = await verifyDocumentOnChain(fileHash);
      setVerificationResult(result);
      setStep("done");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setStep("idle");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const stepLabel: Record<Step, string> = {
    idle: "",
    hashing: "Generating SHA-256 hash...",
    ipfs: "Uploading to IPFS via Pinata...",
    blockchain: "Interacting with blockchain (confirm MetaMask)...",
    done: "Done",
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <div className="p-8 rounded-xl shadow-lg bg-card w-full max-w-2xl border border-border space-y-6">

        <div className="text-center">
          <h2 className="text-3xl font-bold">Document Verification</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Store or verify academic documents on blockchain
          </p>
        </div>

        <div
          className={`text-xs px-3 py-2 rounded-md font-medium ${
            pinataOk === null
              ? "bg-yellow-100 text-yellow-700"
              : pinataOk
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {pinataOk === null
            ? "Checking Pinata IPFS connection..."
            : pinataOk
            ? "Pinata IPFS connected"
            : "Pinata connection failed — check NEXT_PUBLIC_PINATA_JWT in .env.local"}
        </div>

        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <span className="text-sm font-mono">
            {walletAddress
              ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
              : "Wallet not connected"}
          </span>
          <Button variant="outline" size="sm" onClick={handleConnectWallet}>
            <Wallet className="w-4 h-4 mr-2" />
            {walletAddress ? "Reconnect" : "Connect MetaMask"}
          </Button>
        </div>

        <div>
          <Input
            type="file"
            accept=".pdf,.doc,.docx,image/*"
            onChange={handleFileChange}
            className="cursor-pointer"
          />
          {file && (
            <p className="text-xs text-muted-foreground mt-1">
              {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Document Type</label>
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="w-full border border-border rounded-md p-2 bg-background text-sm"
          >
            {DOC_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-3">
          <Button onClick={handleStore} className="flex-1" disabled={!file || loading}>
            <Upload className="w-4 h-4 mr-2" />
            {loading && step === "ipfs" ? "Uploading..." : "Store on Blockchain"}
          </Button>
          <Button
            onClick={handleVerify}
            variant="outline"
            className="flex-1"
            disabled={!file || loading}
          >
            <Shield className="w-4 h-4 mr-2" />
            Verify Document
          </Button>
        </div>

        {step !== "idle" && stepLabel[step] && (
          <p className="text-sm text-center text-muted-foreground animate-pulse">
            {stepLabel[step]}
          </p>
        )}

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-100 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {hash && (
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex justify-between items-center mb-1">
              <strong className="text-sm">SHA-256 Hash</strong>
              <Button variant="ghost" size="sm" onClick={handleCopy}>
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-green-500 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs break-all font-mono">{hash}</p>
          </div>
        )}

        {ipfsCID && (
          <div className="bg-muted p-4 rounded-lg">
            <strong className="text-sm block mb-1">IPFS CID</strong>
            <p className="text-xs break-all font-mono">{ipfsCID}</p>
            <a
              href={getIPFSUrl(ipfsCID)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary underline mt-1 inline-block"
            >
              View file on IPFS gateway
            </a>
          </div>
        )}

        {verificationResult && (
          <div
            className={`p-4 rounded-lg border ${
              verificationResult.exists
                ? "bg-green-50 dark:bg-green-900/20 border-green-400"
                : "bg-red-50 dark:bg-red-900/20 border-red-400"
            }`}
          >
            <h3 className="font-bold mb-2 text-lg">
              {verificationResult.exists
                ? "Document Verified"
                : "Document Not Found on Blockchain"}
            </h3>
            {verificationResult.exists && (
              <div className="text-sm space-y-1">
                <p>
                  <strong>Issued By:</strong>{" "}
                  <span className="font-mono text-xs">{verificationResult.owner}</span>
                </p>
                <p>
                  <strong>Stored On:</strong>{" "}
                  {verificationResult.timestamp?.toLocaleString("en-IN")}
                </p>
                <p>
                  <strong>Type:</strong> {verificationResult.docType}
                </p>
                {verificationResult.ipfsCID && (
                  <a
                    href={getIPFSUrl(verificationResult.ipfsCID)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline block mt-1"
                  >
                    View Original Document on IPFS
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

