"use client";

import { useEffect, useState } from "react";
import Header from "@/components/landing/header";

type Role = "admin" | "institute" | "student" | "none" | null;

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [role, setRole] = useState<Role>(null);
  const [walletAddress, setWalletAddress] = useState<string>("");

  useEffect(() => {
    const stored = localStorage.getItem("docchain_role") as Role;
    const addr = localStorage.getItem("docchain_wallet") ?? "";
    setRole(stored);
    setWalletAddress(addr);

    const handler = () => {
      setRole(localStorage.getItem("docchain_role") as Role);
      setWalletAddress(localStorage.getItem("docchain_wallet") ?? "");
    };

    window.addEventListener("docchain_auth_changed", handler);
    return () => window.removeEventListener("docchain_auth_changed", handler);
  }, []);

  return (
    <>
      <Header role={role} walletAddress={walletAddress} />
      {children}
    </>
  );
}
