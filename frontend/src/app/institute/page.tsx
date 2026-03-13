"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  connectWallet,
  getUserRole,
  issueToStudent,
  getInstituteName,
  revokeDocumentOnChain
} from "@/lib/contractUtils";
import { generateFileHash } from "@/lib/hashUtils";
import { uploadToIPFS } from "@/lib/ipfsUtils";
import {
  Wallet,
  Upload,
  ShieldOff,
  Loader2,
  AlertCircle,
  CheckCircle,
  Building2
} from "lucide-react";

const DOC_TYPES = ["Degree", "Marksheet", "Certificate", "Transcript", "Other"];

type Step = "idle" | "hashing" | "ipfs" | "blockchain" | "done";

export default function InstitutePage() {
  const [walletAddress, setWalletAddress] = useState("");
  const [instituteName, setInstituteName] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState("Degree");
  const [studentAddr, setStudentAddr] = useState("");
  const [step, setStep] = useState<Step>("idle");
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [revokeHash, setRevokeHash] = useState("");
  const [revokeLoading, setRevokeLoading] = useState(false);
  const [revokeMsg, setRevokeMsg] = useState("");

  const stepLabel: Record<Step, string> = {
    idle: "",
    hashing: "Generating SHA-256 hash…",
    ipfs: "Uploading to IPFS via Pinata…",
    blockchain: "Confirm transaction in MetaMask…",
    done: "Done!"
  };

  const handleConnect = async () => {
    setError("");
    try {
      const addr = await connectWallet();
      setWalletAddress(addr);
      const role = await getUserRole(addr);

      if (role !== "institute") {
        setAuthorized(false);
        setAuthChecked(true);
        return;
      }

      setAuthorized(true);
      setAuthChecked(true);

      const name = await getInstituteName(addr);
      setInstituteName(name);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Connection failed");
    }
  };

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

      setStep("blockchain");
      const tx = await issueToStudent(hash, cid, docType, studentAddr);

      setTxHash(tx);
      setStep("done");
      setSuccess(`Certificate issued! Tx: ${tx.slice(0, 12)}...`);

      setFile(null);
      setStudentAddr("");
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
      setRevokeHash("");
    } catch (err: unknown) {
      setRevokeMsg(err instanceof Error ? err.message : "Revoke failed");
    } finally {
      setRevokeLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-background text-foreground p-4 py-10">
      <div className="w-full max-w-xl space-y-6">

        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold">Institute Dashboard</h1>
          </div>
          {instituteName && (
            <p className="text-sm text-muted-foreground">{instituteName}</p>
          )}
        </div>

        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <span className="text-sm font-mono">
            {walletAddress
              ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
              : "Not connected"}
            {authorized && (
              <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                Institute
              </span>
            )}
          </span>

          <Button variant="outline" size="sm" onClick={handleConnect}>
            <Wallet className="w-4 h-4 mr-2" />
            {walletAddress ? "Reconnect" : "Connect"}
          </Button>
        </div>

        {authChecked && !authorized && (
          <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3 flex gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            This wallet is not registered as an institute. Ask the admin to register it.
          </div>
        )}

        <div className="border border-border rounded-xl p-5 space-y-4">
          <p className="font-semibold">Issue Certificate to Student</p>

          <div>
            <label className="text-sm font-medium mb-1 block">
              Student Wallet Address
            </label>
            <Input
              placeholder="0x…"
              value={studentAddr}
              onChange={(e) => setStudentAddr(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              Document Type
            </label>

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

          <div>
            <label className="text-sm font-medium mb-1 block">
              Upload Document
            </label>

            <input
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm border border-border rounded-lg cursor-pointer p-2"
            />

            {file && (
              <p className="text-xs text-muted-foreground mt-1">{file.name}</p>
            )}
          </div>

          {loading && step !== "idle" && (
            <p className="text-xs text-muted-foreground animate-pulse">
              {stepLabel[step]}
            </p>
          )}

          {error && (
            <div className="flex gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {success && (
            <div className="flex gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md p-3">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {success}

              {txHash && (
                <a
                  href={`https://sepolia.etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="underline ml-1"
                >
                  View on Etherscan
                </a>
              )}
            </div>
          )}

          <Button
            className="w-full"
            onClick={handleIssue}
            disabled={loading || !authorized || !file || !studentAddr}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing…
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Issue Certificate
              </>
            )}
          </Button>
        </div>

        <div className="border border-border rounded-xl p-5 space-y-4">
          <p className="font-semibold">Revoke a Certificate</p>

          <Input
            placeholder="Document hash (SHA-256)"
            value={revokeHash}
            onChange={(e) => setRevokeHash(e.target.value)}
          />

          {revokeMsg && (
            <p className={`text-sm ${
              revokeMsg.startsWith("Revoked")
                ? "text-green-700"
                : "text-red-700"
            }`}>
              {revokeMsg}
            </p>
          )}

          <Button
            variant="destructive"
            className="w-full"
            onClick={handleRevoke}
            disabled={revokeLoading || !authorized || !revokeHash}
          >
            {revokeLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Revoking…
              </>
            ) : (
              <>
                <ShieldOff className="w-4 h-4 mr-2" />
                Revoke Certificate
              </>
            )}
          </Button>
        </div>

      </div>
    </div>
  );
}
