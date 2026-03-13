"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  connectWallet,
  getUserRole,
  getStudentDocuments,
  verifyDocumentOnChain,
  CertStatus,
  type VerificationResult
} from "@/lib/contractUtils";
import { generateQRCodeDataURL, buildVerifyURL } from "@/lib/qrUtils";
import {
  Wallet, RefreshCw, QrCode, Share2, ExternalLink,
  ShieldCheck, ShieldOff, GraduationCap, X, Copy, Check
} from "lucide-react";

interface CertRecord extends VerificationResult {
  hash: string;
}

const STATUS_STYLES: Record<CertStatus, string> = {
  [CertStatus.Active]: "bg-emerald-100 text-emerald-800 border-emerald-300",
  [CertStatus.Revoked]: "bg-red-100 text-red-800 border-red-300",
  [CertStatus.NotExists]: "bg-gray-100 text-gray-500 border-gray-300"
};

function QRModal({ cert, onClose }: { cert: CertRecord; onClose: () => void }) {
  const [qrDataURL, setQrDataURL] = useState("");
  const [copied, setCopied] = useState(false);
  const verifyURL = buildVerifyURL(cert.hash);

  useEffect(() => { generateQRCodeDataURL(verifyURL).then(setQrDataURL); }, [verifyURL]);

  const copy = async () => {
    await navigator.clipboard.writeText(verifyURL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const share = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `DocChain – ${cert.docType} Certificate`,
        text: `Verify my ${cert.docType} certificate on DocChain`,
        url: verifyURL
      });
    } else { copy(); }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-2xl shadow-2xl p-6 w-full max-w-sm space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-base">Share Certificate</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{cert.docType}</span>
          {cert.issuedAt && <span className="ml-2">· Issued {cert.issuedAt.toLocaleDateString()}</span>}
        </p>
        <div className="flex justify-center">
          {qrDataURL
            ? <img src={qrDataURL} alt="QR" className="w-48 h-48 rounded-lg border border-border" />
            : <div className="w-48 h-48 rounded-lg border border-border flex items-center justify-center bg-muted animate-pulse">
                <QrCode className="w-10 h-10 text-muted-foreground" />
              </div>}
        </div>
        <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
          <span className="text-xs font-mono truncate flex-1 text-muted-foreground">{verifyURL}</span>
          <button onClick={copy} className="shrink-0 text-muted-foreground hover:text-foreground">
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={copy}>
            <Copy className="w-4 h-4 mr-2" />{copied ? "Copied!" : "Copy Link"}
          </Button>
          <Button size="sm" className="flex-1" onClick={share}>
            <Share2 className="w-4 h-4 mr-2" />Share
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function StudentPage() {
  const [walletAddress, setWalletAddress] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [certs, setCerts] = useState<CertRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [qrCert, setQrCert] = useState<CertRecord | null>(null);

  const loadCerts = useCallback(async (addr: string) => {
    setLoading(true);
    setError("");
    try {
      const hashes = await getStudentDocuments(addr);
      const records = await Promise.all(
        hashes.map(async (hash) => {
          const result = await verifyDocumentOnChain(hash);
          return { hash, ...result } as CertRecord;
        })
      );
      setCerts(records.reverse());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load certificates");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleConnect = async () => {
    setError("");
    try {
      const addr = await connectWallet();
      setWalletAddress(addr);
      const role = await getUserRole(addr);
      setAuthorized(role === "student" || role === "admin");
      await loadCerts(addr);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Connection failed");
    }
  };

  const activeCerts = certs.filter((c) => c.status === CertStatus.Active).length;
  const revokedCerts = certs.filter((c) => c.status === CertStatus.Revoked).length;

  return (
    <>
      {qrCert && <QRModal cert={qrCert} onClose={() => setQrCert(null)} />}

      <div className="min-h-screen bg-background text-foreground p-4 max-w-3xl mx-auto space-y-6 py-10">

        <div className="flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-emerald-600" />
          <div>
            <h1 className="text-2xl font-bold">Student Dashboard</h1>
            <p className="text-sm text-muted-foreground">Your blockchain-verified certificates</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button onClick={handleConnect} variant={walletAddress ? "outline" : "default"}>
            <Wallet className="w-4 h-4 mr-2" />
            {walletAddress ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}` : "Connect My Wallet"}
          </Button>
          {walletAddress && (
            <Button size="sm" variant="ghost" onClick={() => loadCerts(walletAddress)} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          )}
        </div>

        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        {certs.length > 0 && (
          <div className="flex gap-4 text-sm">
            <span className="text-muted-foreground">Total: <strong>{certs.length}</strong></span>
            <span className="text-emerald-700">Active: <strong>{activeCerts}</strong></span>
            {revokedCerts > 0 && (
              <span className="text-red-700">Revoked: <strong>{revokedCerts}</strong></span>
            )}
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border bg-muted h-40 animate-pulse" />
            ))}
          </div>
        ) : certs.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {certs.map((cert) => {
              const ipfsURL = cert.ipfsCID ? `https://gateway.pinata.cloud/ipfs/${cert.ipfsCID}` : null;
              const isActive = cert.status === CertStatus.Active;
              return (
                <div
                  key={cert.hash}
                  className={`rounded-xl border bg-card p-5 space-y-3 shadow-sm transition-shadow hover:shadow-md ${!isActive ? "opacity-70" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm">{cert.docType}</p>
                      {cert.issuedAt && (
                        <p className="text-xs text-muted-foreground">
                          Issued {cert.issuedAt.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
                        </p>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 ${STATUS_STYLES[cert.status]}`}>
                      {isActive
                        ? <><ShieldCheck className="inline w-3 h-3 mr-1" />Active</>
                        : <><ShieldOff className="inline w-3 h-3 mr-1" />Revoked</>}
                    </span>
                  </div>

                  <p className="text-xs font-mono text-muted-foreground truncate">
                    {cert.hash.slice(0, 16)}…{cert.hash.slice(-8)}
                  </p>

                  {cert.revokedAt && (
                    <p className="text-xs text-red-600">Revoked on {cert.revokedAt.toLocaleDateString()}</p>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => setQrCert(cert)}>
                      <QrCode className="w-3 h-3 mr-1.5" />QR / Share
                    </Button>
                    {ipfsURL && (
                      <a href={ipfsURL} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="ghost" className="text-xs px-2">
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : walletAddress && !loading ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            No certificates found for this wallet.
          </div>
        ) : null}

      </div>
    </>
  );
}