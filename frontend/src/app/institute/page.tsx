"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  connectWallet,
  getUserRole,
  issueToStudent,
  getInstituteName,
  revokeDocumentOnChain,
  storeDocumentOnChain,
} from "@/lib/contractUtils";
import { generateFileHash } from "@/lib/hashUtils";
import { uploadToIPFS } from "@/lib/ipfsUtils";
import { generateQRCodeDataURL, buildVerifyURL } from "@/lib/qrUtils";
import {
  Wallet, Upload, ShieldOff, Loader2, AlertCircle,
  CheckCircle, Building2, BarChart3, FileCheck,
  FileX, TrendingUp, ExternalLink, QrCode, Copy, Check,
  RefreshCw,
} from "lucide-react";

const DOC_TYPES = ["Degree", "Marksheet", "Certificate", "Transcript", "Other"];

type Step = "idle" | "hashing" | "ipfs" | "qr" | "blockchain" | "done";

interface IssuedDoc {
  hash: string;
  docType: string;
  studentAddr: string;
  txHash: string;
  issuedAt: Date;
  status: "Active" | "Revoked";
  qrDataURL?: string;
}

export default function InstitutePage() {
  const [walletAddress, setWalletAddress] = useState("");
  const [instituteName, setInstituteName] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState("Degree");
  const [studentAddr, setStudentAddr] = useState("");
  const [studentName, setStudentName] = useState("");
  const [step, setStep] = useState<Step>("idle");
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [revokeHash, setRevokeHash] = useState("");
  const [revokeLoading, setRevokeLoading] = useState(false);
  const [revokeMsg, setRevokeMsg] = useState("");

  const [issuedDocs, setIssuedDocs] = useState<IssuedDoc[]>([]);
  const [activeTab, setActiveTab] = useState<"issue" | "dashboard" | "revoke">("issue");
  const [qrPreview, setQrPreview] = useState<IssuedDoc | null>(null);
  const [copied, setCopied] = useState(false);

  const stepLabel: Record<Step, string> = {
    idle: "",
    hashing: "Generating SHA-256 hash…",
    ipfs: "Uploading to IPFS via Pinata…",
    qr: "Generating QR code…",
    blockchain: "Confirm transaction in MetaMask…",
    done: "Done!",
  };

  const handleConnect = async () => {
    setError("");
    try {
      const addr = await connectWallet();
      setWalletAddress(addr);
      const role = await getUserRole(addr);
      if (role !== "institute" && role !== "admin") {
        setAuthorized(false);
        setAuthChecked(true);
        return;
      }
      setAuthorized(true);
      setAuthChecked(true);
      const name = await getInstituteName(addr);
      setInstituteName(name || "Your Institute");

      const saved = localStorage.getItem(`docchain_issued_${addr}`);
      if (saved) setIssuedDocs(JSON.parse(saved));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Connection failed");
    }
  };

  const saveDocs = useCallback((docs: IssuedDoc[]) => {
    if (walletAddress) {
      localStorage.setItem(`docchain_issued_${walletAddress}`, JSON.stringify(docs));
    }
  }, [walletAddress]);

  const handleIssue = async () => {
    if (!file) return setError("Select a file first");
    if (!studentAddr) return setError("Enter the student wallet address");
    if (!walletAddress) return setError("Connect your wallet first");
    if (!authorized) return setError("Your wallet is not an authorised institute");

    setError("");
    setSuccess("");
    setLoading(true);
    setStep("hashing");

    try {
      const hash = await generateFileHash(file);

      setStep("ipfs");
      const cid = await uploadToIPFS(file);

      setStep("qr");
      const verifyURL = buildVerifyURL(hash);
      const qrDataURL = await generateQRCodeDataURL(verifyURL);

      setStep("blockchain");
      const tx = await issueToStudent(hash, cid, docType, studentAddr);

      setTxHash(tx);
      setStep("done");
      setSuccess(`Certificate issued! Tx: ${tx.slice(0, 12)}...`);

      const newDoc: IssuedDoc = {
        hash,
        docType,
        studentAddr,
        txHash: tx,
        issuedAt: new Date(),
        status: "Active",
        qrDataURL,
      };

      const updated = [newDoc, ...issuedDocs];
      setIssuedDocs(updated);
      saveDocs(updated);

      setFile(null);
      setStudentAddr("");
      setStudentName("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Issuing failed");
      setStep("idle");
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!revokeHash) return;
    setRevokeLoading(true);
    setRevokeMsg("");
    try {
      const tx = await revokeDocumentOnChain(revokeHash);
      setRevokeMsg(`Revoked! Tx: ${tx.slice(0, 12)}...`);
      const updated = issuedDocs.map((d) =>
        d.hash === revokeHash ? { ...d, status: "Revoked" as const } : d
      );
      setIssuedDocs(updated);
      saveDocs(updated);
      setRevokeHash("");
    } catch (err: unknown) {
      setRevokeMsg(err instanceof Error ? err.message : "Revoke failed");
    } finally {
      setRevokeLoading(false);
    }
  };

  const copyLink = async (hash: string) => {
    await navigator.clipboard.writeText(buildVerifyURL(hash));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeDocs = issuedDocs.filter((d) => d.status === "Active").length;
  const revokedDocs = issuedDocs.filter((d) => d.status === "Revoked").length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Institute Dashboard</h1>
              {instituteName && (
                <p className="text-sm text-muted-foreground">{instituteName}</p>
              )}
            </div>
          </div>

          <Button
            variant={walletAddress ? "outline" : "default"}
            onClick={handleConnect}
          >
            <Wallet className="w-4 h-4 mr-2" />
            {walletAddress
              ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`
              : "Connect Wallet"}
          </Button>
        </div>

        {authChecked && !authorized && (
          <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            This wallet is not registered as an institute. Ask the admin to register it.
          </div>
        )}

        {walletAddress && (
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border bg-card p-4 space-y-1">
              <p className="text-xs text-muted-foreground">Total Issued</p>
              <p className="text-2xl font-bold">{issuedDocs.length}</p>
            </div>
            <div className="rounded-xl border bg-card p-4 space-y-1">
              <p className="text-xs text-muted-foreground">Active</p>
              <p className="text-2xl font-bold text-emerald-600">{activeDocs}</p>
            </div>
            <div className="rounded-xl border bg-card p-4 space-y-1">
              <p className="text-xs text-muted-foreground">Revoked</p>
              <p className="text-2xl font-bold text-red-500">{revokedDocs}</p>
            </div>
          </div>
        )}

        <div className="flex gap-1 border-b border-border">
          {(["issue", "dashboard", "revoke"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "issue" ? "Issue Certificate" : tab === "dashboard" ? "My Certificates" : "Revoke"}
            </button>
          ))}
        </div>

        {activeTab === "issue" && (
          <div className="border border-border rounded-xl p-6 space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Student Wallet Address *</label>
                <Input
                  placeholder="0x…"
                  value={studentAddr}
                  onChange={(e) => setStudentAddr(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Student Name (optional)</label>
                <Input
                  placeholder="e.g. Jane Doe"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Document Type *</label>
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

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Upload Document (PDF/Image) *</label>
              <div
                className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-foreground/40 transition-colors"
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
                {file ? (
                  <div className="space-y-1">
                    <FileCheck className="w-8 h-8 mx-auto text-emerald-500" />
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click to select file</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">What happens when you issue:</p>
              <p>① SHA-256 hash generated from document</p>
              <p>② File uploaded to IPFS (Pinata)</p>
              <p>③ QR code generated for verification link</p>
              <p>④ Hash + metadata stored on Sepolia blockchain</p>
            </div>

            {loading && step !== "idle" && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" />
                {stepLabel[step]}
              </div>
            )}

            {error && (
              <div className="flex gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            {success && (
              <div className="flex gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  {success}{" "}
                  {txHash && (
                    <a
                      href={`https://sepolia.etherscan.io/tx/${txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      View on Etherscan
                    </a>
                  )}
                </span>
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleIssue}
              disabled={loading || !authorized || !file || !studentAddr}
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing…</>
              ) : (
                <><Upload className="w-4 h-4 mr-2" />Issue Certificate</>
              )}
            </Button>
          </div>
        )}

        {activeTab === "dashboard" && (
          <div className="space-y-4">
            {issuedDocs.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground border border-dashed rounded-xl">
                <FileCheck className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No certificates issued yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {issuedDocs.map((doc) => (
                  <div
                    key={doc.hash}
                    className="border border-border rounded-xl p-4 space-y-3 bg-card"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm">{doc.docType}</p>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">
                          {doc.studentAddr.slice(0, 10)}…{doc.studentAddr.slice(-6)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(doc.issuedAt).toLocaleDateString("en-IN", {
                            year: "numeric", month: "short", day: "numeric"
                          })}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                        doc.status === "Active"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }`}>
                        {doc.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => setQrPreview(doc)}
                      >
                        <QrCode className="w-3 h-3 mr-1" />QR Code
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => copyLink(doc.hash)}
                      >
                        {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                        Share Link
                      </Button>
                      <a
                        href={`https://sepolia.etherscan.io/tx/${doc.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Button size="sm" variant="ghost" className="text-xs">
                          <ExternalLink className="w-3 h-3 mr-1" />Etherscan
                        </Button>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "revoke" && (
          <div className="border border-border rounded-xl p-6 space-y-4">
            <div className="space-y-1">
              <p className="font-semibold">Revoke a Certificate</p>
              <p className="text-sm text-muted-foreground">
                Enter the document hash to revoke it on the blockchain. This action cannot be undone.
              </p>
            </div>
            <Input
              placeholder="Document hash (SHA-256)…"
              value={revokeHash}
              onChange={(e) => setRevokeHash(e.target.value)}
            />
            {revokeMsg && (
              <p className={`text-sm ${revokeMsg.startsWith("Revoked") ? "text-green-700" : "text-red-700"}`}>
                {revokeMsg}
              </p>
            )}
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleRevoke}
              disabled={revokeLoading || !authorized || !revokeHash}
            >
              {revokeLoading
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Revoking…</>
                : <><ShieldOff className="w-4 h-4 mr-2" />Revoke Certificate</>}
            </Button>

            {issuedDocs.filter(d => d.status === "Active").length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Quick Revoke from Active Certificates
                </p>
                {issuedDocs.filter(d => d.status === "Active").map((doc) => (
                  <div
                    key={doc.hash}
                    className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2"
                  >
                    <div>
                      <p className="text-xs font-medium">{doc.docType}</p>
                      <p className="text-xs text-muted-foreground font-mono">{doc.hash.slice(0, 16)}…</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setRevokeHash(doc.hash)}
                    >
                      Select
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {qrPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setQrPreview(null)}
        >
          <div
            className="bg-card border border-border rounded-2xl shadow-2xl p-6 w-full max-w-sm space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center space-y-1">
              <p className="font-semibold">{qrPreview.docType} Certificate</p>
              <p className="text-xs text-muted-foreground font-mono">
                {qrPreview.studentAddr.slice(0, 10)}…{qrPreview.studentAddr.slice(-6)}
              </p>
            </div>
            {qrPreview.qrDataURL && (
              <div className="flex justify-center">
                <img
                  src={qrPreview.qrDataURL}
                  alt="QR Code"
                  className="w-48 h-48 rounded-lg border border-border"
                />
              </div>
            )}
            <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
              <span className="text-xs font-mono truncate flex-1 text-muted-foreground">
                {buildVerifyURL(qrPreview.hash)}
              </span>
              <button onClick={() => copyLink(qrPreview.hash)}>
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => copyLink(qrPreview.hash)}>
                <Copy className="w-3 h-3 mr-1.5" />{copied ? "Copied!" : "Copy Link"}
              </Button>
              <Button size="sm" className="flex-1" onClick={() => setQrPreview(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
