"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { connectWallet, getUserRole } from "@/lib/contractUtils";
import { useState } from "react";
import { Loader2 } from "lucide-react";

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
        setError(
          "This wallet is not registered on DocChain. Ask the admin to assign you a role."
        );
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Wallet connection failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="w-full max-w-6xl mx-auto px-6 py-24 flex flex-col items-center justify-center text-center gap-10 min-h-[80vh]">
      <div className="space-y-5 max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
          Decentralized Document Verification
        </h1>

        <p className="text-lg text-muted-foreground">
          Verify authenticity of documents instantly using tamper-proof
          blockchain attestations. Share a verification link or check a file
          hash with no central authority required.
        </p>

        <div className="flex items-center gap-4 justify-center pt-2">
          <Button size="lg" onClick={login} disabled={loading} className="min-w-[160px]">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting…
              </>
            ) : (
              "Connect Wallet"
            )}
          </Button>

          <Button size="lg" variant="outline" onClick={() => router.push("/working")}>
            How it works
          </Button>
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-md px-4 py-2">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
