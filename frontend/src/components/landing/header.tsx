"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun, User } from "lucide-react";
import LogoImg from "../../images/logo.png";
import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarItem,
} from "@/components/ui/menubar";


// import{ MenubarItem } from "@/components/ui/menubar";

export default function Header() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border ">
  <div className="container mx-auto relative flex h-16 items-center justify-between px-4">
        
        {/* Logo + Brand Name */}
        <Link href="/" className="flex items-center space-x-2">
          <Image
            src={LogoImg} // place your logo inside /public folder
            alt="Logo"
            width={36}
            height={36}
            className="rounded-md"
          />
          <span className="text-lg font-semibold tracking-tight">
            DocChain
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <Link href="#features" className="hover:text-primary transition-colors">
            Features
          </Link>
          <Link href="#about" className="hover:text-primary transition-colors">
            About
          </Link>
          <Link href="#contact" className="hover:text-primary transition-colors">
            Contact
          </Link>
        </nav>

        {/* Right Section - Theme Toggle & Button */}
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle Theme"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            {theme === "light" ? (
              <Moon className="h-[1.2rem] w-[1.2rem]" />
            ) : (
              <Sun className="h-[1.2rem] w-[1.2rem]" />
            )}
          </Button>

          <Button asChild>
            <Link href="#get-started">Get Started</Link>
          </Button>
          {/* User button toggles an inline dropdown with the Menubar */}
      <div className="flex items-center gap-4">
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>
              <button
                onDoubleClick={() => router.push("/login")}
                className="p-2 rounded-full hover:bg-accent flex items-center"
                type="button"
              >
                <User className="w-5 h-5" />
              </button>
            </MenubarTrigger>
            <MenubarContent>
              <MenubarRadioGroup value="">
                <MenubarRadioItem value="andy" onClick={() =>router.push("/login/issuer")}>Issuer</MenubarRadioItem>
                <MenubarRadioItem value="benoit" onClick={() => router.push("/login/user")}>User</MenubarRadioItem>
                <MenubarRadioItem value="Luis"onClick={() => router.push("/login/verifier")}>Verifier</MenubarRadioItem>
              </MenubarRadioGroup>
             
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </div>
        </div>

        
        
        
      </div>
    </header>
  );
}
