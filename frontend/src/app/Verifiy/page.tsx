"use client";

import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { generateFileHash } from "@/lib/hashUtils";
import { Check, Copy } from "lucide-react"; // ✅ icon from lucide-react

export default function VerifyPage() {
  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setHash("");
      setCopied(false);
    }
  };

  const handleVerify = async () => {
    if (!file) {
      alert("Please upload a file first.");
      return;
    }

    alert(`Verifying: ${file.name}`);

    const hashValue = await generateFileHash(file);
    setHash(hashValue);
    setCopied(false);
    console.log("File hash:", hashValue);
  };

  const handleCopy = async () => {
    if (!hash) return;
    await navigator.clipboard.writeText(hash);
    setCopied(true);

    // Reset the "Copied!" state after 2 seconds
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <div className="p-8 rounded-xl shadow-lg bg-card w-[400px] text-center border border-border">
        <h2 className="text-2xl font-bold mb-6">Upload a Document only</h2>

        <Input
          type="file"
          accept="image/*,.pdf,.doc,.docx"
          placeholder="Upload a Document only"
          onChange={handleFileChange}
          className="block w-full mb-4 text-sm text-muted-foreground border border-border rounded-lg cursor-pointer focus:outline-none"
        />

        <Button onClick={handleVerify} className="w-full">
          Verify Document
        </Button>

        {file && (
          <p className="mt-3 text-sm text-muted-foreground">
            Selected: {file.name}
          </p>
        )}

        {hash && (
          <div className="mt-6 text-left bg-muted p-3 rounded-lg text-xs break-all relative">
            <div className="flex justify-between items-center mb-2">
              <strong>SHA-256 Hash:</strong>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="text-xs flex items-center space-x-1"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </>
                )}
              </Button>
            </div>
            <p>{hash}</p>
          </div>
        )}
      </div>
    </div>
  );
}

