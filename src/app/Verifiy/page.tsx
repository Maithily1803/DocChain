"use client";
import { Input } from "@/components/ui/input"
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function VerifyPage() {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) setFile(selectedFile);
  };

  const handleVerify = () => {
    if (!file) {
      alert("Please upload a file first.");
      return;
    }
    // In real use case: hash file and send to blockchain verification API
    alert(`Verifying: ${file.name}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="p-8 rounded-xl shadow-lg bg-card w-[400px] text-center">
        <h2 className="text-2xl font-bold mb-6">Upload a Document only </h2>
        
        <Input
          type="file"
          accept="image/*,.pdf,.doc,.docx"
          placeholder="Upload a Document only"
          onChange={handleFileChange}
          className="block w-full mb-4 text-sm text-muted-foreground border border-border rounded-lg cursor-pointer focus:outline-none"
        />

        <Button onClick={handleVerify } className="w-full">
          Verify Document
        </Button>

        {file && (
          <p className="mt-3 text-sm text-muted-foreground">
            Selected: {file.name}
          </p>
        )}
      </div>
    </div>
  );
}
