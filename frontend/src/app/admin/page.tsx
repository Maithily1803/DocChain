"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  connectWallet,
  getAdmin,
  grantIssuer,
  registerInstitute,
  assignStudentRole,
  getUserRole,
} from "@/lib/contractUtils";
import {
  Wallet,
  AlertCircle,
  CheckCircle,
  Building2,
  GraduationCap,
  Search,
} from "lucide-react";

type Msg = { type: "success" | "error"; text: string };

export default function AdminPage() {
  const [walletAddress, setWalletAddress] = useState("");
  const [adminAddress, setAdminAddress] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<Msg | null>(null);

  const [instAddr, setInstAddr] = useState("");
  const [instName, setInstName] = useState("");

  const [studentAddr, setStudentAddr] = useState("");

  const [roleCheckAddr, setRoleCheckAddr] = useState("");
  const [roleResult, setRoleResult] = useState("");

  const showMsg = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 6000);
  };

  const handleConnect = async () => {
    try {
      const addr = await connectWallet();
      const admin = await getAdmin();
      setWalletAddress(addr);
      setAdminAddress(admin);
      setIsAdmin(admin.toLowerCase() === addr.toLowerCase());
    } catch (err: unknown) {
      showMsg("error", err instanceof Error ? err.message : "Connection failed");
    }
  };

  const handleRegisterInstitute = async () => {
    if (!instAddr || !instName) return showMsg("error", "Enter address and name");
    setLoading(true);
    try {
      const txHash = await registerInstitute(instAddr, instName);
      showMsg("success", `Institute registered! Tx: ${txHash.slice(0, 12)}...`);
      setInstAddr("");
      setInstName("");
    } catch (err: unknown) {
      showMsg("error", err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignStudent = async () => {
    if (!studentAddr) return showMsg("error", "Enter student address");
    setLoading(true);
    try {
      const txHash = await assignStudentRole(studentAddr);
      showMsg("success", `Student role assigned! Tx: ${txHash.slice(0, 12)}...`);
      setStudentAddr("");
    } catch (err: unknown) {
      showMsg("error", err instanceof Error ? err.message : "Assignment failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleCheck = async () => {
    if (!roleCheckAddr) return;
    try {
      const role = await getUserRole(roleCheckAddr);
      setRoleResult(role);
    } catch {
      showMsg("error", "Role check failed");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <div className="p-8 rounded-xl shadow-lg bg-card w-full max-w-xl border border-border space-y-6">

        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold">Admin Panel</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage roles & institutions</p>
        </div>

        {/* Wallet */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <span className="text-sm font-mono">
            {walletAddress
              ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
              : "Not connected"}
            {isAdmin && (
              <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                Admin
              </span>
            )}
          </span>
          <Button variant="outline" size="sm" onClick={handleConnect}>
            <Wallet className="w-4 h-4 mr-2" />
            {walletAddress ? "Reconnect" : "Connect"}
          </Button>
        </div>

        {walletAddress && !isAdmin && (
          <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">
            Your wallet is not the admin. Admin:{" "}
            <span className="font-mono text-xs">{adminAddress}</span>
          </div>
        )}

        {message && (
          <div
            className={`flex gap-2 items-start p-3 rounded-md text-sm border ${
              message.type === "success"
                ? "bg-green-50 text-green-800 border-green-200"
                : "bg-red-50 text-red-800 border-red-200"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            )}
            {message.text}
          </div>
        )}

        {/* Register Institute */}
        <div className="space-y-3 border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 font-medium text-sm">
            <Building2 className="w-4 h-4 text-blue-600" />
            Register Institute
          </div>
          <Input
            placeholder="Institute wallet address (0x…)"
            value={instAddr}
            onChange={(e) => setInstAddr(e.target.value)}
          />
          <Input
            placeholder="Institute display name (e.g. MIT)"
            value={instName}
            onChange={(e) => setInstName(e.target.value)}
          />
          <Button
            className="w-full"
            onClick={handleRegisterInstitute}
            disabled={loading || !isAdmin}
          >
            <Building2 className="w-4 h-4 mr-2" />
            Register Institute
          </Button>
        </div>

        {/* Assign Student Role */}
        <div className="space-y-3 border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 font-medium text-sm">
            <GraduationCap className="w-4 h-4 text-emerald-600" />
            Assign Student Role
          </div>
          <Input
            placeholder="Student wallet address (0x…)"
            value={studentAddr}
            onChange={(e) => setStudentAddr(e.target.value)}
          />
          <Button
            className="w-full"
            onClick={handleAssignStudent}
            disabled={loading || !isAdmin}
          >
            <GraduationCap className="w-4 h-4 mr-2" />
            Assign Student Role
          </Button>
        </div>

        {/* Check Wallet Role */}
        <div className="space-y-3 border border-border rounded-lg p-4">
          <p className="text-sm font-medium">Check Wallet Role</p>
          <div className="flex gap-2">
            <Input
              placeholder="0x…"
              value={roleCheckAddr}
              onChange={(e) => {
                setRoleCheckAddr(e.target.value);
                setRoleResult("");
              }}
            />
            <Button variant="outline" onClick={handleRoleCheck}>
              <Search className="w-4 h-4" />
            </Button>
          </div>
          {roleResult && (
            <p className="text-sm font-medium capitalize text-blue-700">
              Role: <span className="font-bold">{roleResult}</span>
            </p>
          )}
        </div>

      </div>
    </div>
  );
}