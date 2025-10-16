"use client";

import Image from "next/image";
// import { Image } from "image/doc.png";
import { IconCloud } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation";
// import {
//   Empty,
//   EmptyContent,
//   EmptyDescription,
//   EmptyHeader,
//   EmptyMedia,
//   EmptyTitle,
// } from "@/components/ui/empty"

export default function Hero() {
  const router = useRouter();
  return (
    <section className="w-full max-w-6xl mx-auto p-4 px-6 py-20 flex flex-col items-center justify-center text-center gap-12 min-h-[60vh]">
      <div className="max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-extrabold leading-tight text-center">
          Decentralized Document Verification
        </h1>
        
  <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
          Verify authenticity of documents instantly using tamper-proof blockchain attestations. Share a verification link or check a file hash — no central authority required.
        </p>

  <div className="mt-6 flex items-center gap-4 justify-center">
          <Button onClick={() =>router.push("/Verifiy")}>Verify a Document</Button>
          <a
            href="#how-it-works"
            className="inline-flex items-center px-5 py-3 rounded-md border border-border text-sm text-muted-foreground"
          >
            How it works
          </a>
        </div>
      </div>

      
    </section>
  );
}
