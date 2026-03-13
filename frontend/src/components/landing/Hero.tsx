"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { connectWallet, getUserRole } from "@/lib/contractUtils";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function Hero() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const login = async () => {
    setLoading(true);
    try {
      const address = await connectWallet();
      const role = await getUserRole(address);

      if (role === "admin") router.push("/admin");
      if (role === "institute") router.push("/institute");
      if (role === "student") router.push("/student");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="w-full max-w-6xl mt-16 mx-auto p-4 px-6 py-20 flex flex-col items-center justify-center text-center gap-12 min-h-[60vh]">
      <div>
        <h1 className="text-4xl md:text-5xl font-extrabold leading-tight text-center">
          Decentralized Document Verification
        </h1>

        <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
          Verify authenticity of documents instantly using tamper-proof blockchain attestations. Share a verification link or check a file hash with no central authority required.
        </p>

        <div className="mt-6 flex items-center gap-4 justify-center">
          <Button onClick={() => router.push("/verify")}>
            Verify a Document
          </Button>

          <Button variant="outline" onClick={() => router.push("/working")}>
            How it works
          </Button>

          <Button onClick={login} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting
              </>
            ) : (
              "Connect Wallet"
            )}
          </Button>
        </div>
      </div>
    </section>
  );
}