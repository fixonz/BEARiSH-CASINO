"use client"

import { ThemeProvider } from "@/components/theme-provider"
import { AbstractWalletProvider } from "./abstract-wallet-provider"
import { WalletButton } from "./wallet-button"
import { ThemeToggle } from "./theme-toggle"
import { Toaster } from "@/components/ui/toaster"
import Image from "next/image"

export default function AppLayout({ children }) {
  return (
    <ThemeProvider defaultTheme="dark" attribute="class">
      <AbstractWalletProvider>
        <div className="min-h-screen bg-zinc-950 text-white">
          <header className="border-b border-zinc-800 bg-zinc-900">
            <div className="container mx-auto p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Image src="/images/bearish-logo.png" alt="Bearish Logo" width={32} height={32} />
                <span className="font-bold text-xl">Bearish Casinos</span>
              </div>
              <div className="flex items-center gap-2">
                <WalletButton />
                <ThemeToggle />
              </div>
            </div>
          </header>

          <main>{children}</main>

          <footer className="border-t border-zinc-800 bg-zinc-900 mt-8">
            <div className="container mx-auto p-4 text-center text-zinc-500 text-sm">
              <p>Powered by Abstract Global Wallet on the Abstract Testnet</p>
              <p className="mt-1">© 2023 Bearish Casinos. All rights reserved.</p>
            </div>
          </footer>
        </div>
        <Toaster />
      </AbstractWalletProvider>
    </ThemeProvider>
  )
}

