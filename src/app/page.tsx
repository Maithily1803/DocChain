import Hero from "../components/landing/Hero";
import Headers from "@/components/landing/header";

export default function Home() {
  return (
    <main>
      <Headers/>
      <Hero />
      {/* <Features />x */}

      <section id="verify" className="w-full max-w-4xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold">Verify a document</h2>
        <p className="text-muted-foreground mt-2">Upload a file or paste a document hash to check its attestation status.</p>

        <div className="mt-6 bg-card p-6 rounded-lg border border-border">
          <label className="block mb-2 text-sm font-medium">Document hash</label>
          <div className="flex gap-2">
            <input className="flex-1 rounded-md p-2 bg-background border border-border" placeholder="Paste SHA-256 hash here" />
            <button className="px-4 py-2 rounded-md bg-primary text-primary-foreground">Check</button>
          </div>
        </div>
      </section>
    </main>
  );
}