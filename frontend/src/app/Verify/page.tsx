"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { generateFileHash } from "@/lib/hashUtils";
import { uploadToIPFS, testPinataConnection } from "@/lib/ipfsUtils";
import {
  storeDocumentOnChain,
  verifyDocumentOnChain,
  revokeDocumentOnChain,
  connectWallet,
  isIssuer,
  getAdmin,
  CertStatus,
  certStatusLabel,
  type VerificationResult,
} from "@/lib/contractUtils";
import { Check, Copy, Upload, Shield, Wallet, AlertCircle, Ban } from "lucide-react";

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
  const [walletIsIssuer, setWalletIsIssuer] = useState(false);
  const [walletIsAdmin, setWalletIsAdmin] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
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
      const [issuer, adminAddr] = await Promise.all([isIssuer(addr), getAdmin()]);
      setWalletIsIssuer(issuer);
      setWalletIsAdmin(adminAddr.toLowerCase() === addr.toLowerCase());
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
    if (!walletIsIssuer) return setError("Your wallet is not an authorised issuer. Ask the admin to grant access.");

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

  const handleRevoke = async () => {
    if (!hash) return setError("Verify the document first to get its hash.");
    if (!walletAddress) return setError("Connect your wallet first.");

    setError("");
    setLoading(true);

    try {
      await revokeDocumentOnChain(hash);
      const result = await verifyDocumentOnChain(hash);
      setVerificationResult(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Revoke failed");
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

  const statusBadge = (status: CertStatus) => {
    const styles: Record<CertStatus, string> = {
      [CertStatus.Active]: "bg-green-100 text-green-800 border-green-300",
      [CertStatus.Revoked]: "bg-red-100 text-red-800 border-red-300",
      [CertStatus.NotExists]: "bg-gray-100 text-gray-600 border-gray-300",
    };

    return (
      <span className={`inline-block px-3 py-1 rounded-full border text-sm font-semibold ${styles[status]}`}>
        {certStatusLabel(status)}
      </span>
    );
  };

  const canRevoke =
    verificationResult?.status === CertStatus.Active &&
    (walletIsAdmin || walletIsIssuer);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <div className="p-8 rounded-xl shadow-lg bg-card w-full max-w-2xl border border-border space-y-6">

        <div className="text-center">
          <h2 className="text-3xl font-bold">Document Verification</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Store or verify academic documents on blockchain
          </p>
        </div>

        <div className={`text-xs px-3 py-2 rounded-md font-medium ${
          pinataOk === null ? "bg-yellow-100 text-yellow-700"
          : pinataOk ? "bg-green-100 text-green-700"
          : "bg-red-100 text-red-700"
        }`}>
          {pinataOk === null ? "Checking Pinata IPFS connection..."
          : pinataOk ? "Pinata IPFS connected"
          : "Pinata connection failed — check NEXT_PUBLIC_PINATA_JWT in .env.local"}
        </div>

        <div className="flex items-center justify-between p-4 bg-muted rounded-lg flex-wrap gap-2">
          <span className="text-sm font-mono">
            {walletAddress
              ? `${walletAddress.slice(0,6)}...${walletAddress.slice(-4)}`
              : "Wallet not connected"}
            {walletIsAdmin && <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Admin</span>}
            {walletIsIssuer && !walletIsAdmin && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Issuer</span>}
          </span>

          <Button variant="outline" size="sm" onClick={handleConnectWallet}>
            <Wallet className="w-4 h-4 mr-2" />
            {walletAddress ? "Connected" : "Connect Wallet"}
          </Button>
        </div>

        <div>
          <Input
            type="file"
            accept="image/*,.pdf,.doc,.docx"
            onChange={handleFileChange}
            className="block w-full text-sm border border-border rounded-lg cursor-pointer"
          />
          {file && (
            <p className="text-xs text-muted-foreground mt-1">Selected: {file.name}</p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Document Type</label>
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm"
          >
            {DOC_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 flex-wrap">
          <Button onClick={handleStore} className="flex-1" disabled={!file || loading}>
            <Upload className="w-4 h-4 mr-2" />
            {loading && step !== "blockchain" ? stepLabel[step] : "Store on Blockchain"}
          </Button>

          <Button onClick={handleVerify} variant="outline" className="flex-1" disabled={!file || loading}>
            <Shield className="w-4 h-4 mr-2" />
            {loading && step === "blockchain" ? "Verifying..." : "Verify Document"}
          </Button>
        </div>

        {loading && step !== "idle" && (
          <div className="text-sm text-center text-muted-foreground animate-pulse">
            {stepLabel[step]}
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 bg-red-50 text-red-700 p-3 rounded-md text-sm border border-red-200">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {hash && (
          <div className="bg-muted rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">SHA-256 Hash</p>

            <div className="flex items-center gap-2">
              <code className="text-xs break-all flex-1">{hash}</code>

              <Button size="sm" variant="ghost" onClick={handleCopy}>
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </Button>
            </div>

            {ipfsCID && (
              <p className="text-xs mt-2 text-muted-foreground">
                IPFS CID:
                <a
                  href={`https://gateway.pinata.cloud/ipfs/${ipfsCID}`}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  {ipfsCID}
                </a>
              </p>
            )}
          </div>
        )}

        {verificationResult && (
          <div className={`rounded-xl border p-5 space-y-3 ${
            verificationResult.status === CertStatus.Active
              ? "border-green-300 bg-green-50"
              : verificationResult.status === CertStatus.Revoked
              ? "border-red-300 bg-red-50"
              : "border-gray-300 bg-gray-50"
          }`}>

            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-semibold text-base">Verification Result</h3>
              {statusBadge(verificationResult.status)}
            </div>

            {verificationResult.status !== CertStatus.NotExists && (
              <dl className="text-sm space-y-1">

                <div className="flex gap-2">
                  <dt className="font-medium w-28 shrink-0">Doc Type</dt>
                  <dd>{verificationResult.docType}</dd>
                </div>

                <div className="flex gap-2">
                  <dt className="font-medium w-28 shrink-0">Issued By</dt>
                  <dd className="font-mono text-xs break-all">{verificationResult.issuedBy}</dd>
                </div>

                <div className="flex gap-2">
                  <dt className="font-medium w-28 shrink-0">Issued At</dt>
                  <dd>{verificationResult.issuedAt?.toLocaleString()}</dd>
                </div>

                {verificationResult.revokedAt && (
                  <div className="flex gap-2">
                    <dt className="font-medium w-28 shrink-0 text-red-700">Revoked At</dt>
                    <dd className="text-red-700">{verificationResult.revokedAt.toLocaleString()}</dd>
                  </div>
                )}

                <div className="flex gap-2">
                  <dt className="font-medium w-28 shrink-0">IPFS CID</dt>
                  <dd>
                    <a
                      href={`https://gateway.pinata.cloud/ipfs/${verificationResult.ipfsCID}`}
                      target="_blank"
                      rel="noreferrer"
                      className="underline text-xs font-mono"
                    >
                      {verificationResult.ipfsCID.slice(0,20)}...
                    </a>
                  </dd>
                </div>

              </dl>
            )}

            {canRevoke && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRevoke}
                disabled={loading}
                className="mt-2"
              >
                <Ban className="w-4 h-4 mr-2" />
                Revoke This Document
              </Button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

