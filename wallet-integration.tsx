"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Wallet, ArrowUpRight, ArrowDownLeft, Copy, Check, AlertCircle, RefreshCw, ExternalLink } from "lucide-react"

export default function WalletIntegration() {
  const [activeTab, setActiveTab] = useState("deposit")
  const [amount, setAmount] = useState("")
  const [address, setAddress] = useState("")
  const [copied, setCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [transactionStatus, setTransactionStatus] = useState<null | "success" | "error">(null)

  // Mock wallet address
  const walletAddress = "0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t"

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(walletAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleTransaction = () => {
    if (!amount || Number.parseFloat(amount) <= 0) return

    setIsLoading(true)

    // Simulate transaction processing
    setTimeout(() => {
      setIsLoading(false)
      setTransactionStatus(Math.random() > 0.2 ? "success" : "error")

      // Reset status after a delay
      setTimeout(() => {
        setTransactionStatus(null)
        setAmount("")
        setAddress("")
      }, 3000)
    }, 2000)
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Casino Wallet
          </CardTitle>
          <CardDescription>Manage your funds securely</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Label className="text-sm text-muted-foreground">Your Wallet Address</Label>
            <div className="flex items-center mt-1 p-2 bg-muted rounded-md">
              <code className="text-xs flex-1 truncate">{walletAddress}</code>
              <Button variant="ghost" size="sm" onClick={handleCopyAddress}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="flex justify-between mb-4">
            <div>
              <Label className="text-sm text-muted-foreground">Available Balance</Label>
              <p className="text-2xl font-bold">1,250.00 USDT</p>
            </div>
            <Button variant="outline" size="sm" className="h-9 mt-auto">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          <Tabs defaultValue="deposit" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="deposit">Deposit</TabsTrigger>
              <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
            </TabsList>

            <TabsContent value="deposit" className="space-y-4 pt-4">
              <div>
                <Label htmlFor="deposit-amount">Amount (USDT)</Label>
                <Input
                  id="deposit-amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[10, 50, 100, 500].map((value) => (
                  <Button key={value} variant="outline" onClick={() => setAmount(value.toString())}>
                    {value}
                  </Button>
                ))}
              </div>

              {transactionStatus === "success" && (
                <Alert variant="default" className="bg-green-500/10 text-green-500 border-green-500/20">
                  <Check className="h-4 w-4" />
                  <AlertTitle>Success!</AlertTitle>
                  <AlertDescription>Your deposit has been processed successfully.</AlertDescription>
                </Alert>
              )}

              {transactionStatus === "error" && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>There was a problem with your deposit. Please try again.</AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="withdraw" className="space-y-4 pt-4">
              <div>
                <Label htmlFor="withdraw-amount">Amount (USDT)</Label>
                <Input
                  id="withdraw-amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="withdraw-address">Destination Address</Label>
                <Input
                  id="withdraw-address"
                  placeholder="Enter wallet address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[10, 50, 100, 500].map((value) => (
                  <Button key={value} variant="outline" onClick={() => setAmount(value.toString())}>
                    {value}
                  </Button>
                ))}
              </div>

              {transactionStatus === "success" && (
                <Alert variant="default" className="bg-green-500/10 text-green-500 border-green-500/20">
                  <Check className="h-4 w-4" />
                  <AlertTitle>Success!</AlertTitle>
                  <AlertDescription>Your withdrawal has been initiated successfully.</AlertDescription>
                </Alert>
              )}

              {transactionStatus === "error" && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>There was a problem with your withdrawal. Please try again.</AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            onClick={handleTransaction}
            disabled={isLoading || !amount || (activeTab === "withdraw" && !address)}
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : activeTab === "deposit" ? (
              <ArrowDownLeft className="w-4 h-4 mr-2" />
            ) : (
              <ArrowUpRight className="w-4 h-4 mr-2" />
            )}
            {isLoading ? "Processing..." : activeTab === "deposit" ? "Deposit Funds" : "Withdraw Funds"}
          </Button>
        </CardFooter>
      </Card>

      <div className="max-w-md mx-auto mt-6">
        <h3 className="text-lg font-semibold mb-2">Recent Transactions</h3>
        <div className="space-y-2">
          {[
            { type: "deposit", amount: "100.00", status: "completed", date: "2023-03-27" },
            { type: "withdraw", amount: "50.00", status: "completed", date: "2023-03-25" },
            { type: "deposit", amount: "200.00", status: "completed", date: "2023-03-20" },
            { type: "withdraw", amount: "75.00", status: "pending", date: "2023-03-18" },
          ].map((tx, i) => (
            <div key={i} className="flex justify-between items-center p-3 bg-card rounded-lg border">
              <div className="flex items-center">
                {tx.type === "deposit" ? (
                  <ArrowDownLeft
                    className={`w-4 h-4 mr-2 ${tx.status === "completed" ? "text-green-500" : "text-amber-500"}`}
                  />
                ) : (
                  <ArrowUpRight
                    className={`w-4 h-4 mr-2 ${tx.status === "completed" ? "text-blue-500" : "text-amber-500"}`}
                  />
                )}
                <div>
                  <p className="font-medium capitalize">{tx.type}</p>
                  <p className="text-xs text-muted-foreground">{tx.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">{tx.amount} USDT</p>
                <p className="text-xs capitalize text-muted-foreground">{tx.status}</p>
              </div>
            </div>
          ))}
        </div>

        <Button variant="link" className="mt-2 text-sm" asChild>
          <a href="#">
            View all transactions
            <ExternalLink className="w-3 h-3 ml-1" />
          </a>
        </Button>
      </div>
    </div>
  )
}

