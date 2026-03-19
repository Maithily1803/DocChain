"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchCertByHash, type CertificateRecord } from "@/lib/indexerUtils";
import { generateQRCodeDataURL, buildVerifyURL } from "@/lib/qrUtils";
import { CertStatus } from "@/lib/contractUtils";
import {
  ShieldCheck, ShieldOff, ShieldAlert, ExternalLink,
  QrCode, Share2, Copy, Check, Building2, Calendar,
  FileText, Hash, Eye, Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const STATUS_CONFIG = {
  [CertStatus.Active]: {
    icon: ShieldCheck,
    label: "Verified & Valid",
    sublabel: "This document is authentic and has not been revoked.",
    bannerClass: "bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200",
    iconClass: "text-emerald-600",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
    badgeLabel: "VALID",
    glowClass: "shadow-emerald-100 dark:shadow-emerald-900/20",
  },
  [CertStatus.Revoked]: {
    icon: ShieldOff,
    label: "Certificate Revoked",
    sublabel: "This document has been revoked by the issuing institution.",
    bannerClass: "bg-red-50 border-red-200 text-red-900 dark:bg-red-950/40 dark:border-red-800 dark:text-red-200",
    iconClass: "text-red-500",
    badgeClass: "bg-red-100 text-red-800 border-red-200",
    badgeLabel: "REVOKED",
    glowClass: "shadow-red-100 dark:shadow-red-900/20",
  },
  [CertStatus.NotExists]: {
    icon: ShieldAlert,
    label: "Not Found",
    sublabel: "No record of this document exists on the blockchain.",
    bannerClass: "bg-gray-50 border-gray-200 text-gray-700 dark:bg-gray-900/40 dark:border-gray-700 dark:text-gray-300",
    iconClass: "text-gray-400",
    badgeClass: "bg-gray-100 text-gray-600 border-gray-200",
    badgeLabel: "NOT FOUND",
    glowClass: "",
  },
};

function InfoRow({ icon: Icon, label, value, mono = false }: {
  icon: React.ElementType;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <div className="p-1.5 rounded-md bg-muted shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
        <p className={`text-sm font-medium break-all ${mono ? "font-mono" : ""}`}>{value}</p>
      </div>
    </div>
  );
}

export default function PublicVerifyPage() {
  const params = useParams();
  const rawHash = params?.hash as string | undefined;
  const hash = rawHash ? decodeURIComponent(rawHash) : "";

  const [cert, setCert] = useState<CertificateRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [qrDataURL, setQrDataURL] = useState("");
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    if (!hash) { setLoading(false); return; }
    fetchCertByHash(hash)
      .then(setCert)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Lookup failed")
      )
      .finally(() => setLoading(false));
  }, [hash]);

  useEffect(() => {
    if (!hash) return;
    generateQRCodeDataURL(buildVerifyURL(hash)).then(setQrDataURL);
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
    } else handleCopy();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 animate-pulse">
          <div className="w-16 h-16 rounded-2xl bg-muted mx-auto flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Querying blockchain…</p>
        </div>
      </div>
    );
  }

  if (!hash) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <p className="text-muted-foreground text-sm">No certificate hash provided.</p>
      </div>
    );
  }

  const certStatus = cert?.status ?? CertStatus.NotExists;
  const config = STATUS_CONFIG[certStatus];
  const StatusIcon = config.icon;
  const ipfsURL = cert?.ipfsCID ? `https://gateway.pinata.cloud/ipfs/${cert.ipfsCID}` : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-lg mx-auto px-4 py-10 space-y-5">

        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-xs font-medium text-muted-foreground">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            DocChain Verified
          </div>
        </div>

        <div className={`rounded-2xl border-2 p-6 text-center space-y-3 shadow-lg ${config.bannerClass} ${config.glowClass}`}>
          <div className="flex justify-center">
            <div className={`p-4 rounded-2xl ${certStatus === CertStatus.Active ? "bg-emerald-100 dark:bg-emerald-900/30" : certStatus === CertStatus.Revoked ? "bg-red-100 dark:bg-red-900/30" : "bg-gray-100 dark:bg-gray-800"}`}>
              <StatusIcon className={`w-10 h-10 ${config.iconClass}`} />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold">{config.label}</h1>
            <p className="text-sm opacity-75 mt-1">{config.sublabel}</p>
          </div>
          <span className={`inline-block px-4 py-1 rounded-full border text-xs font-bold tracking-wider ${config.badgeClass}`}>
            {config.badgeLabel}
          </span>
        </div>

        {error && (
          <div className="text-sm bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {cert && cert.status !== CertStatus.NotExists && (
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold">Certificate Details</h2>
              </div>
            </div>
            <div className="px-5">
              <InfoRow
                icon={FileText}
                label="Document Type"
                value={cert.docType}
              />
              <InfoRow
                icon={Building2}
                label="Issued By (Institution)"
                value={cert.issuedBy}
                mono
              />
              <InfoRow
                icon={Calendar}
                label="Issue Date"
                value={cert.issuedAt?.toLocaleDateString("en-IN", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }) ?? "—"}
              />
              {cert.revokedAt && (
                <InfoRow
                  icon={ShieldOff}
                  label="Revoked On"
                  value={cert.revokedAt.toLocaleDateString("en-IN", {
                    year: "numeric", month: "long", day: "numeric",
                  })}
                />
              )}
              {cert.ipfsCID && (
                <div className="flex items-start gap-3 py-3">
                  <div className="p-1.5 rounded-md bg-muted shrink-0 mt-0.5">
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Document (IPFS)</p>
                    <a
                      href={ipfsURL!}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1"
                    >
                      View original document
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-muted-foreground" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">SHA-256 Document Hash</p>
          </div>
          <p className="text-xs font-mono break-all text-foreground/80 leading-relaxed">{hash}</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Share this verification</p>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowQR(!showQR)}
            >
              <QrCode className="w-4 h-4 mr-1.5" />
              {showQR ? "Hide QR" : "Show QR"}
            </Button>
          </div>

          {showQR && (
            <div className="flex justify-center py-2">
              {qrDataURL ? (
                <img
                  src={qrDataURL}
                  alt="QR Code"
                  className="w-44 h-44 rounded-xl border border-border"
                />
              ) : (
                <div className="w-44 h-44 rounded-xl bg-muted animate-pulse" />
              )}
            </div>
          )}

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
            <Button size="sm" className="flex-1" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground py-2">
          Powered by DocChain · Sepolia Testnet · Immutable blockchain verification
        </p>
      </div>
    </div>
  );
}