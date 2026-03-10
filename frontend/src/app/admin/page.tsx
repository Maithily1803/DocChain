"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  connectWallet,
  getAdmin,
  isIssuer,
  grantIssuer,
  revokeIssuerRole,
} from "@/lib/contractUtils";
import { Wallet, UserPlus, UserMinus, AlertCircle, CheckCircle } from "lucide-react";

export default function AdminPage() {
  const [walletAddress, setWalletAddress] = useState("");
  const [adminAddress, setAdminAddress] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [targetAddr, setTargetAddr] = useState("");
  const [checkAddr, setCheckAddr] = useState("");
  const [checkResult, setCheckResult] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showMsg = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
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

  const handleGrant = async () => {
    if (!targetAddr) return showMsg("error", "Enter an address");
    setLoading(true);
    try {
      const txHash = await grantIssuer(targetAddr);
      showMsg("success", `Issuer granted! Tx: ${txHash.slice(0, 10)}...`);
      setTargetAddr("");
    } catch (err: unknown) {
      showMsg("error", err instanceof Error ? err.message : "Grant failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!targetAddr) return showMsg("error", "Enter an address");
    setLoading(true);
    try {
      const txHash = await revokeIssuerRole(targetAddr);
      showMsg("success", `Issuer revoked! Tx: ${txHash.slice(0, 10)}...`);
      setTargetAddr("");
    } catch (err: unknown) {
      showMsg("error", err instanceof Error ? err.message : "Revoke failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCheck = async () => {
    if (!checkAddr) return;
    try {
      const result = await isIssuer(checkAddr);
      setCheckResult(result);
    } catch {
      showMsg("error", "Check failed");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <div className="p-8 rounded-xl shadow-lg bg-card w-full max-w-xl border border-border space-y-6">

        <div className="text-center">
          <h2 className="text-3xl font-bold">Admin Panel</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage issuer roles</p>
        </div>

        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <span className="text-sm font-mono">
            {walletAddress
              ? `${walletAddress.slice(0,6)}...${walletAddress.slice(-4)}`
              : "Not connected"}
            {isAdmin && (
              <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Admin</span>
            )}
          </span>
          <Button variant="outline" size="sm" onClick={handleConnect}>
            <Wallet className="w-4 h-4 mr-2" />
            {walletAddress ? "Reconnect" : "Connect"}
          </Button>
        </div>

        {walletAddress && !isAdmin && (
          <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">
            Your wallet is not the admin. Admin address:
            <span className="font-mono text-xs"> {adminAddress}</span>
          </div>
        )}

        {message && (
          <div className={`flex gap-2 items-start p-3 rounded-md text-sm border ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border-green-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}>
            {message.type === "success"
              ? <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
              : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            }
            {message.text}
          </div>
        )}

        <div className="space-y-3">
          <label className="text-sm font-medium block">Issuer Address</label>
          <Input
            placeholder="0x..."
            value={targetAddr}
            onChange={(e) => setTargetAddr(e.target.value)}
          />

          <div className="flex gap-3">
            <Button
              onClick={handleGrant}
              disabled={loading || !isAdmin}
              className="flex-1"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Grant Issuer
            </Button>

            <Button
              onClick={handleRevoke}
              variant="destructive"
              disabled={loading || !isAdmin}
              className="flex-1"
            >
              <UserMinus className="w-4 h-4 mr-2" />
              Revoke Issuer
            </Button>
          </div>
        </div>

        <div className="space-y-3 border-t border-border pt-4">
          <label className="text-sm font-medium block">Check if Address is Issuer</label>

          <div className="flex gap-2">
            <Input
              placeholder="0x..."
              value={checkAddr}
              onChange={(e) => {
                setCheckAddr(e.target.value);
                setCheckResult(null);
              }}
            />

            <Button variant="outline" onClick={handleCheck}>
              Check
            </Button>
          </div>

          {checkResult !== null && (
            <p className={`text-sm font-medium ${checkResult ? "text-green-700" : "text-red-700"}`}>
              {checkResult ? "Is an authorised issuer" : "Not an issuer"}
            </p>
          )}
        </div>

      </div>
    </div>
  );
}