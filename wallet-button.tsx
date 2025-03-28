"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAbstractWallet } from "./abstract-wallet-provider"
import { Wallet, LogOut, Copy, ExternalLink, RefreshCw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function WalletButton() {
  const { wallet, connect, disconnect, openWalletModal } = useAbstractWallet()
  const { toast } = useToast()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleConnect = () => {
    if (!wallet) {
      openWalletModal()
    }
  }

  const copyAddress = () => {
    if (wallet?.address) {
      navigator.clipboard.writeText(wallet.address)
      toast({
        title: "Address copied",
        description: "Wallet address copied to clipboard",
      })
    }
  }

  const refreshBalance = () => {
    setIsRefreshing(true)

    // Simulate refresh delay
    setTimeout(() => {
      setIsRefreshing(false)
      toast({
        title: "Balance refreshed",
        description: "Your wallet balance has been updated",
      })
    }, 1000)
  }

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  if (!wallet) {
    return (
      <Button onClick={handleConnect} variant="outline" className="gap-2">
        <Wallet className="h-4 w-4" />
        Connect Wallet
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Wallet className="h-4 w-4" />
          {formatAddress(wallet.address)}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>My Wallet</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="px-2 py-1.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Address</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyAddress}>
              <Copy className="h-3 w-3" />
            </Button>
          </div>
          <div className="text-xs font-mono truncate">{wallet.address}</div>
        </div>

        <DropdownMenuSeparator />

        <div className="px-2 py-1.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Balance</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={refreshBalance} disabled={isRefreshing}>
              <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs">ETH</span>
              <span className="text-xs font-medium">{wallet.balance.eth.toFixed(4)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs">USDT</span>
              <span className="text-xs font-medium">{wallet.balance.usdt.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <a
            href="https://testnet.abstract.foundation/explorer"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center cursor-pointer"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View on Explorer
          </a>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={disconnect} className="text-red-500 focus:text-red-500">
          <LogOut className="h-4 w-4 mr-2" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

