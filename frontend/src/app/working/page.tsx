"use client";

import { Card, CardContent } from "@/components/ui/card";
import { FileUp, ShieldCheck, Database, CheckCircle } from "lucide-react";

export default function WorkingPage() {
  return (
    <div className="min-h-screen bg-background text-center py-16 px-6">
      <div className="max-w-5xl mx-auto text-center">
        
        <h1 className="text-4xl  font-bold mb-4">
          How DocChain Works
        </h1>

        <p className="text-muted-foreground mb-12 max-w-2xl mx-auto">
          DocChain is a blockchain-based document verification system 
          that ensures secure, tamper-proof, and transparent authentication 
          of digital documents.
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Step 1 */}
          <Card className="rounded-2xl shadow-lg">
            <CardContent className="p-6 text-left">
              <FileUp className="h-8 w-8 text-primary mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                1. Document Upload
              </h2>
              <p className="text-muted-foreground">
                The issuer uploads a document to the system. 
                The file is converted into a secure cryptographic hash.
              </p>
            </CardContent>
          </Card>

          {/* Step 2 */}
          <Card className="rounded-2xl shadow-lg">
            <CardContent className="p-6 text-left">
              <Database className="h-8 w-8 text-primary mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                2. Blockchain Storage
              </h2>
              <p className="text-muted-foreground">
                The generated hash is stored on the blockchain, 
                ensuring immutability and tamper-proof security.
              </p>
            </CardContent>
          </Card>

          {/* Step 3 */}
          <Card className="rounded-2xl shadow-lg">
            <CardContent className="p-6 text-left">
              <ShieldCheck className="h-8 w-8 text-primary mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                3. Verification Request
              </h2>
              <p className="text-muted-foreground">
                A verifier uploads the document again. 
                The system generates a new hash and compares it 
                with the blockchain record.
              </p>
            </CardContent>
          </Card>

          {/* Step 4 */}
          <Card className="rounded-2xl shadow-lg">
            <CardContent className="p-6 text-left">
              <CheckCircle className="h-8 w-8 text-primary mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                4. Result
              </h2>
              <p className="text-muted-foreground">
                If the hashes match, the document is verified as authentic. 
                If not, the document has been modified or is invalid.
              </p>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}