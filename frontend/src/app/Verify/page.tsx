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
  type VerificationResult,
} from "@/lib/contractUtils";
import { buildVerifyURL } from "@/lib/qrUtils";
import {
  Check, Copy, Upload, Shield, Wallet, AlertCircle, Ban,
  FileSearch, Building2, Calendar, FileText, Hash, ExternalLink,
  ShieldCheck, ShieldOff, ShieldAlert, Award, Link,
} from "lucide-react";

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
  const [mode, setMode] = useState<"verify" | "store">("verify");

  useEffect(() => {
    testPinataConnection().then(setPinataOk);
  }, []);

  const handleConnectWallet = async () => {
    setError("");
    try {
      const addr = await connectWallet();
      setWalletAddress(addr);
      const [issuerStatus, adminAddr] = await Promise.all([isIssuer(addr), getAdmin()]);
      setWalletIsIssuer(issuerStatus);
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
    if (!walletIsIssuer) return setError("Your wallet is not an authorised issuer.");
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
    if (!hash) return setError("Verify the document first.");
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
    hashing: "Generating SHA-256 hash…",
    ipfs: "Uploading to IPFS via Pinata…",
    blockchain: "Interacting with blockchain…",
    done: "Done",
  };

  const verifyLink = hash ? buildVerifyURL(hash) : "";
  const canRevoke =
    verificationResult?.status === CertStatus.Active && (walletIsAdmin || walletIsIssuer);

  const StatusBanner = () => {
    if (!verificationResult) return null;
    const { status, issuedBy, issuedAt, revokedAt, ipfsCID: cid, docType: dt } = verificationResult;

    const configs = {
      [CertStatus.Active]: {
        icon: ShieldCheck,
        label: "Document Verified",
        labelClass: "text-emerald-700",
        bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800",
        badge: "bg-emerald-100 text-emerald-800 border-emerald-300",
        badgeText: "VALID",
      },
      [CertStatus.Revoked]: {
        icon: ShieldOff,
        label: "Certificate Revoked",
        labelClass: "text-red-700",
        bg: "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800",
        badge: "bg-red-100 text-red-800 border-red-300",
        badgeText: "REVOKED",
      },
      [CertStatus.NotExists]: {
        icon: ShieldAlert,
        label: "Document Not Found",
        labelClass: "text-gray-700",
        bg: "bg-gray-50 border-gray-200 dark:bg-gray-900/30 dark:border-gray-700",
        badge: "bg-gray-100 text-gray-600 border-gray-300",
        badgeText: "NOT FOUND",
      },
    };

    const c = configs[status];
    const Icon = c.icon;

    return (
      <div className={`rounded-xl border-2 p-5 space-y-4 ${c.bg}`}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <Icon className={`w-6 h-6 ${c.labelClass}`} />
            <h3 className={`font-bold text-lg ${c.labelClass}`}>{c.label}</h3>
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-full border tracking-wider ${c.badge}`}>
            {c.badgeText}
          </span>
        </div>

        {status !== CertStatus.NotExists && (
          <div className="space-y-2.5">
            {dt && (
              <div className="flex items-center gap-2 text-sm">
                <Award className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Type:</span>
                <span className="font-medium">{dt}</span>
              </div>
            )}
            {issuedBy && (
              <div className="flex items-start gap-2 text-sm">
                <Building2 className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <span className="text-muted-foreground shrink-0">Issued by:</span>
                <span className="font-mono text-xs break-all">{issuedBy}</span>
              </div>
            )}
            {issuedAt && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Issued:</span>
                <span className="font-medium">
                  {issuedAt.toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            )}
            {revokedAt && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <Ban className="w-4 h-4 shrink-0" />
                <span>Revoked: {revokedAt.toLocaleDateString()}</span>
              </div>
            )}
            {cid && (
              <div className="flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                <a
                  href={`https://gateway.pinata.cloud/ipfs/${cid}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  View on IPFS <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        )}

        {hash && status !== CertStatus.NotExists && (
          <div className="pt-3 border-t border-current/20 space-y-2">
            <p className="text-xs font-medium opacity-70">Shareable verification link:</p>
            <div className="flex items-center gap-2 bg-white/50 dark:bg-black/20 rounded-lg px-3 py-2">
              <Link className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs font-mono truncate flex-1 text-muted-foreground">
                {verifyLink}
              </span>
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(verifyLink);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>
        )}

        {canRevoke && (
          <Button variant="destructive" size="sm" onClick={handleRevoke} disabled={loading}>
            <Ban className="w-4 h-4 mr-2" />
            Revoke This Document
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-2xl mx-auto py-10 space-y-6">
        <div className="text-center space-y-2">
         
          <h1 className="text-3xl font-bold">Document Verification</h1>
          <p className="text-sm text-muted-foreground">
            Upload any document to check if it&apos;s registered and valid on the blockchain.
          </p>
        </div>

        <div
          className={`text-xs px-3 py-2 rounded-lg font-medium ${
            pinataOk === null
              ? "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20"
              : pinataOk
              ? "bg-green-50 text-green-700 dark:bg-green-900/20"
              : "bg-red-50 text-red-700 dark:bg-red-900/20"
          }`}
        >
          {pinataOk === null
            ? "Checking IPFS connection…"
            : pinataOk
            ? "✓ IPFS (Pinata) connected"
            : "✗ Pinata connection failed — check NEXT_PUBLIC_PINATA_JWT"}
        </div>

        <div className="flex items-center justify-between p-4 bg-muted rounded-xl flex-wrap gap-2">
          <span className="text-sm font-mono">
            {walletAddress
              ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`
              : "Wallet not connected"}
            {walletIsAdmin && (
              <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                Admin
              </span>
            )}
            {walletIsIssuer && !walletIsAdmin && (
              <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                Issuer
              </span>
            )}
          </span>
          <Button variant="outline" size="sm" onClick={handleConnectWallet}>
            <Wallet className="w-4 h-4 mr-2" />
            {walletAddress ? "Connected" : "Connect Wallet"}
          </Button>
        </div>

        <div className="flex gap-1 p-1 bg-muted rounded-xl">
          <button
            onClick={() => setMode("verify")}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              mode === "verify"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Shield className="w-4 h-4 inline mr-2" />
            Verify Document
          </button>
          {(walletIsIssuer || walletIsAdmin) && (
            <button
              onClick={() => setMode("store")}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                mode === "store"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Upload className="w-4 h-4 inline mr-2" />
              Store on Blockchain
            </button>
          )}
        </div>

        <div
          className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-foreground/40 transition-colors"
          onClick={() => document.getElementById("doc-upload")?.click()}
        >
          <input
            id="doc-upload"
            type="file"
            accept="image/*,.pdf,.doc,.docx"
            onChange={handleFileChange}
            className="hidden"
          />
          {file ? (
            <div className="space-y-1">
              <FileText className="w-8 h-8 mx-auto text-primary" />
              <p className="font-medium text-sm">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024).toFixed(1)} KB · Click to change
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Click to select a document</p>
              <p className="text-xs text-muted-foreground">PDF, images, Word documents accepted</p>
            </div>
          )}
        </div>

        {mode === "store" && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Document Type</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm"
            >
              {DOC_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex gap-3">
          {mode === "verify" ? (
            <Button onClick={handleVerify} className="flex-1" disabled={!file || loading}>
              <Shield className="w-4 h-4 mr-2" />
              {loading ? stepLabel[step] || "Verifying…" : "Verify Document"}
            </Button>
          ) : (
            <Button
              onClick={handleStore}
              className="flex-1"
              disabled={!file || loading || !walletAddress}
            >
              <Upload className="w-4 h-4 mr-2" />
              {loading ? stepLabel[step] || "Processing…" : "Store on Blockchain"}
            </Button>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-200">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {hash && (
          <div className="bg-muted rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  SHA-256 Hash
                </p>
              </div>
              <Button size="sm" variant="ghost" onClick={handleCopy} className="h-7 px-2">
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </Button>
            </div>
            <code className="text-xs break-all font-mono text-foreground/80">{hash}</code>

            {ipfsCID && (
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground mb-1">IPFS CID:</p>
                <a
                  href={`https://gateway.pinata.cloud/ipfs/${ipfsCID}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-mono text-primary hover:underline"
                >
                  {ipfsCID.slice(0, 30)}…
                </a>
              </div>
            )}
          </div>
        )}

        <StatusBanner />
      </div>
    </div>
  );
}