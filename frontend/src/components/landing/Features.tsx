import { Check } from "lucide-react";

const features = [
  {
    title: "Immutable Proofs",
    desc: "Generate cryptographic hashes and anchor them on-chain so document history is provable.",
  },
  {
    title: "Privacy-first",
    desc: "Only hashes are stored on the blockchain — your original files never leave your device.",
  },
  {
    title: "Easy Sharing",
    desc: "Share verifiable links or QR codes so anyone can confirm authenticity without signing up.",
  },
];

export default function Features() {
  return (
    <section id="how-it-works" className="w-full max-w-6xl mx-auto px-6 py-12">
      <h2 className="text-2xl font-bold">Why decentralized verification?</h2>
      <p className="text-muted-foreground mt-2 max-w-2xl">
        Decentralized attestations remove single points of failure and provide public, auditable proofs
        that a document existed at a given time.
      </p>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((f) => (
          <div key={f.title} className="p-6 bg-card rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-5 h-5 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold">{f.title}</h3>
            </div>
            <p className="mt-3 text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
