import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import Header from "@/components/landing/header";

const inter= Inter({ subsets: ["latin"] });




export const metadata: Metadata = {
  title: "Decentralized Document Verification",
  description: "A decentralized application for verifying documents using blockchain technology.",
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className} `}
      > <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {/* <Header /> */}
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
