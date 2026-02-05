"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";


export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Add login logic (API call, validation, etc.)
    alert(`Logged in as ${name} <${email}>`);
    router.push("/"); // redirect after login
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="p-8 rounded-xl shadow-lg w-[350px] bg-card">
        <h2 className="text-3xl font-bold mb-6 text-center">Issuer</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          
          <Input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" className="w-full">Login</Button>
        </form>
      </div>
    </div>
  );
}
