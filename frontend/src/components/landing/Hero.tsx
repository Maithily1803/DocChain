"use client";

import { useRouter } from "next/navigation";
import { connectWallet, getUserRole } from "@/lib/contractUtils";
import { useState } from "react";
import { Loader2, ShieldCheck, Search, BookOpen } from "lucide-react";

function persistAuth(address: string, role: string) {
  localStorage.setItem("docchain_wallet", address);
  localStorage.setItem("docchain_role", role);
  window.dispatchEvent(new Event("docchain_auth_changed"));
}

export default function Hero() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const login = async () => {
    setLoading(true);
    setError("");
    try {
      const address = await connectWallet();
      const role = await getUserRole(address);
      persistAuth(address, role);
      if (role === "admin") router.push("/admin");
      else if (role === "institute") router.push("/institute");
      else if (role === "student") router.push("/student");
      else {
        setError("Wallet not registered. Ask the admin to assign you a role.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Wallet connection failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-10">
        <div className="space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-foreground flex items-center justify-center mx-auto">
            <ShieldCheck className="w-8 h-8 text-background" />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">DocChain</h1>
            <p className="text-muted-foreground text-base mt-2">
              Tamper-proof academic document verification on the blockchain.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={login}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 h-12 rounded-xl bg-foreground text-background font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            {loading ? "Connecting…" : "Connect Wallet"}
          </button>

          <button
            onClick={() => router.push("/verify")}
            className="w-full flex items-center justify-center gap-3 h-12 rounded-xl border border-border bg-card text-foreground font-semibold text-sm hover:bg-muted transition-colors"
          >
            <Search className="w-4 h-4" />
            Verify a Document
          </button>

          <button
            onClick={() => router.push("/working")}
            className="w-full flex items-center justify-center gap-3 h-12 rounded-xl border border-border bg-card text-foreground font-semibold text-sm hover:bg-muted transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            How it Works
          </button>
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
            {error}
          </p>
        )}

        <p className="text-xs text-muted-foreground">
          Running on Sepolia Testnet · Powered by Ethereum &amp; IPFS
        </p>
      </div>
    </main>
  );
}
