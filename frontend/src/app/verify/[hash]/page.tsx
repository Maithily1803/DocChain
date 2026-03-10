"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchCertByHash, type CertificateRecord } from "@/lib/indexerUtils";
import { generateQRCodeDataURL, buildVerifyURL } from "@/lib/qrUtils";
import { CertStatus } from "@/lib/contractUtils";
import {
  ShieldCheck,
  ShieldOff,
  ShieldAlert,
  ExternalLink,
  QrCode,
  Share2,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const STATUS_CONFIG = {
  [CertStatus.Active]: {
    icon: <ShieldCheck className="w-10 h-10 text-emerald-600" />,
    label: "Document Verified",
    sublabel: "This document is authentic and has not been revoked.",
    banner: "bg-emerald-50 border-emerald-200 text-emerald-800",
  },
  [CertStatus.Revoked]: {
    icon: <ShieldOff className="w-10 h-10 text-red-500" />,
    label: "Document Revoked",
    sublabel: "This document has been revoked by the issuing institution.",
    banner: "bg-red-50 border-red-200 text-red-800",
  },
  [CertStatus.NotExists]: {
    icon: <ShieldAlert className="w-10 h-10 text-gray-400" />,
    label: "Document Not Found",
    sublabel: "No record of this document exists on the blockchain.",
    banner: "bg-gray-50 border-gray-200 text-gray-700",
  },
};

export default function PublicVerifyPage() {
  const params = useParams();
  const rawHash = params?.hash as string | undefined;
  const hash = rawHash ? decodeURIComponent(rawHash) : "";

  const [cert, setCert] = useState<CertificateRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [qrDataURL, setQrDataURL] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!hash) {
      setLoading(false);
      return;
    }

    fetchCertByHash(hash)
      .then(setCert)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Lookup failed")
      )
      .finally(() => setLoading(false));
  }, [hash]);

  useEffect(() => {
    if (!hash) return;
    const url = buildVerifyURL(hash);
    generateQRCodeDataURL(url).then(setQrDataURL);
  }, [hash]);

  const verifyURL = hash ? buildVerifyURL(hash) : "";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(verifyURL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: "DocChain Certificate Verification",
        text: `Verify this certificate on DocChain`,
        url: verifyURL,
      });
    } else {
      handleCopy();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3 animate-pulse text-muted-foreground">
          <QrCode className="w-10 h-10 mx-auto" />
          <p className="text-sm">Looking up certificate…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center text-red-600 max-w-sm space-y-2">
          <ShieldAlert className="w-10 h-10 mx-auto" />
          <p className="font-semibold">Lookup Error</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!hash) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <p className="text-muted-foreground text-sm">
          No certificate hash provided.
        </p>
      </div>
    );
  }

  const config = STATUS_CONFIG[cert?.status ?? CertStatus.NotExists];
  const ipfsURL = cert?.ipfsCID
    ? `https://gateway.pinata.cloud/ipfs/${cert.ipfsCID}`
    : null;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            DocChain · Blockchain Verification
          </p>
        </div>

        <div className={`rounded-2xl border p-6 text-center space-y-2 ${config.banner}`}>
          <div className="flex justify-center">{config.icon}</div>
          <h1 className="text-xl font-bold">{config.label}</h1>
          <p className="text-sm">{config.sublabel}</p>
        </div>

        {cert && cert.status !== CertStatus.NotExists && (
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Certificate Details
            </h2>

            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Type</dt>
                <dd className="font-medium">{cert.docType}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Issued By</dt>
                <dd className="font-mono text-xs">
                  {cert.issuedBy.slice(0, 8)}…{cert.issuedBy.slice(-6)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Issued On</dt>
                <dd>
                  {cert.issuedAt?.toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </dd>
              </div>
              {cert.revokedAt && (
                <div className="flex justify-between text-red-600">
                  <dt>Revoked On</dt>
                  <dd>{cert.revokedAt.toLocaleDateString()}</dd>
                </div>
              )}
              {ipfsURL && (
                <div className="flex justify-between items-center">
                  <dt className="text-muted-foreground">Document</dt>
                  <dd>
                    <a
                      href={ipfsURL}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs underline"
                    >
                      View on IPFS <ExternalLink className="w-3 h-3" />
                    </a>
                  </dd>
                </div>
              )}
            </dl>

            <div className="bg-muted rounded-lg px-3 py-2">
              <p className="text-xs text-muted-foreground mb-0.5">SHA-256 Hash</p>
              <p className="text-xs font-mono break-all">{hash}</p>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-border bg-card p-5 flex flex-col items-center gap-3">
          <p className="text-sm font-medium">Share this certificate</p>

          {qrDataURL ? (
            <img src={qrDataURL} alt="QR code" className="w-40 h-40 rounded-lg" />
          ) : (
            <div className="w-40 h-40 rounded-lg bg-muted animate-pulse" />
          )}

          <div className="flex w-full items-center gap-2 bg-muted rounded-lg px-3 py-2">
            <span className="text-xs font-mono truncate flex-1 text-muted-foreground">
              {verifyURL}
            </span>
            <button
              onClick={handleCopy}
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleCopy}
            >
              <Copy className="w-4 h-4 mr-2" />
              {copied ? "Copied!" : "Copy Link"}
            </Button>
            <Button size="sm" className="flex-1" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Powered by DocChain · Sepolia Testnet
        </p>
      </div>
    </div>
  );
}