"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { connectWallet } from "@/lib/contractUtils";
import { fetchCertificatesForAddress, type CertificateRecord } from "@/lib/indexerUtils";
import { generateQRCodeDataURL, buildVerifyURL } from "@/lib/qrUtils";
import { CertStatus } from "@/lib/contractUtils";
import {
  Wallet,
  RefreshCw,
  QrCode,
  Share2,
  ExternalLink,
  ShieldCheck,
  ShieldOff,
  Search,
  Filter,
  X,
  Copy,
  Check,
} from "lucide-react";

const ALL_CATEGORIES = ["All", "Degree", "Marksheet", "Certificate", "Transcript", "Other"];

const STATUS_STYLES: Record<CertStatus, string> = {
  [CertStatus.Active]: "bg-emerald-100 text-emerald-800 border-emerald-300",
  [CertStatus.Revoked]: "bg-red-100 text-red-800 border-red-300",
  [CertStatus.NotExists]: "bg-gray-100 text-gray-500 border-gray-300",
};

const STATUS_LABELS: Record<CertStatus, string> = {
  [CertStatus.Active]: "Active",
  [CertStatus.Revoked]: "Revoked",
  [CertStatus.NotExists]: "Unknown",
};

function QRModal({
  cert,
  onClose,
}: {
  cert: CertificateRecord;
  onClose: () => void;
}) {
  const [qrDataURL, setQrDataURL] = useState("");
  const [copied, setCopied] = useState(false);
  const verifyURL = buildVerifyURL(cert.hash);

  useEffect(() => {
    generateQRCodeDataURL(verifyURL).then(setQrDataURL);
  }, [verifyURL]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(verifyURL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `DocChain – ${cert.docType} Certificate`,
        text: `Verify my ${cert.docType} certificate on DocChain`,
        url: verifyURL,
      });
    } else {
      handleCopy();
    }
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

        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{cert.docType}</span>
          {cert.issuedAt && (
            <span className="ml-2">· Issued {cert.issuedAt.toLocaleDateString()}</span>
          )}
        </div>

        <div className="flex justify-center">
          {qrDataURL ? (
            <img
              src={qrDataURL}
              alt="QR code for certificate verification"
              className="w-48 h-48 rounded-lg border border-border"
            />
          ) : (
            <div className="w-48 h-48 rounded-lg border border-border flex items-center justify-center animate-pulse bg-muted">
              <QrCode className="w-10 h-10 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
          <span className="text-xs font-mono truncate flex-1 text-muted-foreground">
            {verifyURL}
          </span>
          <button onClick={handleCopy} className="shrink-0 text-muted-foreground hover:text-foreground">
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={handleCopy}>
            <Copy className="w-4 h-4 mr-2" />
            {copied ? "Copied!" : "Copy Link"}
          </Button>
          <Button size="sm" className="flex-1" onClick={handleNativeShare}>
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </div>
    </div>
  );
}

function CertCard({
  cert,
  onQR,
}: {
  cert: CertificateRecord;
  onQR: (cert: CertificateRecord) => void;
}) {
  const ipfsURL = cert.ipfsCID
    ? `https://gateway.pinata.cloud/ipfs/${cert.ipfsCID}`
    : null;

  const explorerURL = cert.txHash
    ? `https://sepolia.etherscan.io/tx/${cert.txHash}`
    : null;

  return (
    <div
      className={`rounded-xl border bg-card p-5 space-y-3 shadow-sm transition-shadow hover:shadow-md ${
        cert.status === CertStatus.Revoked ? "opacity-70" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <p className="font-semibold text-sm">{cert.docType}</p>
          {cert.issuedAt && (
            <p className="text-xs text-muted-foreground">
              Issued {cert.issuedAt.toLocaleDateString("en-IN", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
          )}
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 ${STATUS_STYLES[cert.status]}`}
        >
          {cert.status === CertStatus.Active ? (
            <>
              <ShieldCheck className="inline w-3 h-3 mr-1" />
              {STATUS_LABELS[cert.status]}
            </>
          ) : (
            <>
              <ShieldOff className="inline w-3 h-3 mr-1" />
              {STATUS_LABELS[cert.status]}
            </>
          )}
        </span>
      </div>

      <p className="text-xs font-mono text-muted-foreground truncate">
        {cert.hash.slice(0, 16)}…{cert.hash.slice(-8)}
      </p>

      {cert.revokedAt && (
        <p className="text-xs text-red-600">
          Revoked on {cert.revokedAt.toLocaleDateString()}
        </p>
      )}

      <div className="flex items-center gap-2 pt-1">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 text-xs"
          onClick={() => onQR(cert)}
        >
          <QrCode className="w-3 h-3 mr-1.5" />
          QR / Share
        </Button>

        {ipfsURL && (
          <a href={ipfsURL} target="_blank" rel="noreferrer">
            <Button size="sm" variant="ghost" className="text-xs px-2">
              <ExternalLink className="w-3 h-3" />
            </Button>
          </a>
        )}

        {explorerURL && (
          <a href={explorerURL} target="_blank" rel="noreferrer">
            <Button size="sm" variant="ghost" className="text-xs px-2">
              <ExternalLink className="w-3 h-3 text-muted-foreground" />
            </Button>
          </a>
        )}
      </div>
    </div>
  );
}

export default function LockerPage() {
  const [walletAddress, setWalletAddress] = useState("");
  const [certs, setCerts] = useState<CertificateRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [qrCert, setQrCert] = useState<CertificateRecord | null>(null);
  const [lookupAddr, setLookupAddr] = useState("");

  const loadCerts = useCallback(async (addr: string) => {
    setLoading(true);
    setError("");
    try {
      const records = await fetchCertificatesForAddress(addr);
      setCerts(records);
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
      await loadCerts(addr);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Wallet connection failed");
    }
  };

  const handleLookup = async () => {
    if (!lookupAddr.trim()) return;
    await loadCerts(lookupAddr.trim());
  };

  const filtered = certs.filter((c) => {
    const matchCat = category === "All" || c.docType === category;
    const matchSearch =
      !search ||
      c.hash.toLowerCase().includes(search.toLowerCase()) ||
      c.docType.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const activeCerts = filtered.filter((c) => c.status === CertStatus.Active).length;
  const revokedCerts = filtered.filter((c) => c.status === CertStatus.Revoked).length;

  return (
    <>
      {qrCert && <QRModal cert={qrCert} onClose={() => setQrCert(null)} />}

      <div className="min-h-screen bg-background text-foreground p-4 max-w-3xl mx-auto space-y-6 py-10">
        <div>
          <h1 className="text-3xl font-bold">Student Locker</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View, filter, and share your verified academic certificates
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button onClick={handleConnect} variant={walletAddress ? "outline" : "default"}>
            <Wallet className="w-4 h-4 mr-2" />
            {walletAddress
              ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`
              : "Connect My Wallet"}
          </Button>
          {walletAddress && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => loadCerts(walletAddress)}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Look up any wallet address (0x…)"
            value={lookupAddr}
            onChange={(e) => setLookupAddr(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLookup()}
          />
          <Button onClick={handleLookup} disabled={loading || !lookupAddr.trim()}>
            <Search className="w-4 h-4" />
          </Button>
        </div>

        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        {certs.length > 0 && (
          <div className="flex gap-4 text-sm">
            <span className="text-muted-foreground">
              Total: <strong>{certs.length}</strong>
            </span>
            <span className="text-emerald-700">
              Active: <strong>{activeCerts}</strong>
            </span>
            {revokedCerts > 0 && (
              <span className="text-red-700">
                Revoked: <strong>{revokedCerts}</strong>
              </span>
            )}
          </div>
        )}

        {certs.length > 0 && (
          <div className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-muted-foreground self-center" />
              {ALL_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors font-medium ${
                    category === cat
                      ? "bg-foreground text-background border-foreground"
                      : "bg-muted text-muted-foreground border-border hover:border-foreground"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by type or hash…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-sm"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-xl border bg-muted h-40 animate-pulse" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map((cert) => (
              <CertCard key={cert.hash} cert={cert} onQR={setQrCert} />
            ))}
          </div>
        ) : certs.length > 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            No certificates match your filter.
            <button
              onClick={() => {
                setCategory("All");
                setSearch("");
              }}
              className="ml-2 underline"
            >
              Clear filters
            </button>
          </div>
        ) : !loading && (walletAddress || lookupAddr) ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            No certificates found for this address.
          </div>
        ) : null}
      </div>
    </>
  );
}