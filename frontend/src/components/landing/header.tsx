"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_LINKS: Record<string, { href: string; label: string }[]> = {
  admin: [
    { href: "/admin", label: "Admin Panel" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/working", label: "How it works" },
  ],
  institute: [
    { href: "/institute", label: "Issue Document" },
    { href: "/verify", label: "Verify" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/working", label: "How it works" },
  ],
  student: [
    { href: "/student", label: "My Documents" },
    { href: "/locker", label: "Locker" },
    { href: "/verify", label: "Verify" },
    { href: "/working", label: "How it works" },
  ],
};

interface HeaderProps {
  role?: "admin" | "institute" | "student" | "none" | null;
  walletAddress?: string;
}

export default function Header({ role, walletAddress }: HeaderProps) {
  const pathname = usePathname();

  if (!role || role === "none" || !walletAddress) {
    return null;
  }

  const links = NAV_LINKS[role] ?? [];
  const shortAddr = `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`;

  const roleLabel: Record<string, string> = {
    admin: "Admin",
    institute: "Institute",
    student: "Student",
  };

  return (
    <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-bold text-base tracking-tight">
          DocChain
        </Link>

        <nav className="flex gap-1 items-center">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "px-3 py-1.5 text-sm rounded-md transition-colors",
                pathname === href
                  ? "bg-foreground text-background font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {label}
            </Link>
          ))}

          <span className="ml-3 px-3 py-1 text-xs rounded-full border border-border bg-muted text-muted-foreground font-mono">
            {roleLabel[role]} · {shortAddr}
          </span>
        </nav>
      </div>
    </header>
  );
}
