"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Check, AlertCircle, Wallet } from "lucide-react"

// Mock Abstract Global Wallet SDK
interface AbstractWallet {
  address: string
  balance: {
    eth: number
    usdt: number
  }
  isConnected: boolean
  isConnecting: boolean
  error: string | null
}

interface AbstractWalletContextType {
  wallet: AbstractWallet | null
  connect: (method: "email" | "social" | "passkey") => Promise<void>
  disconnect: () => void
  sendTransaction: (to: string, amount: number, token: "eth" | "usdt") => Promise<boolean>
  openWalletModal: () => void
}

const AbstractWalletContext = createContext<AbstractWalletContextType | null>(null)

export const useAbstractWallet = () => {
  const context = useContext(AbstractWalletContext)
  if (!context) {
    throw new Error("useAbstractWallet must be used within an AbstractWalletProvider")
  }
  return context
}

interface AbstractWalletProviderProps {
  children: ReactNode
}

export function AbstractWalletProvider({ children }: AbstractWalletProviderProps) {
  const [wallet, setWallet] = useState<AbstractWallet | null>(null)
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionMethod, setConnectionMethod] = useState<"email" | "social" | "passkey" | null>(null)
  const [email, setEmail] = useState("")
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false)
  const [transactionDetails, setTransactionDetails] = useState<{
    to: string
    amount: number
    token: "eth" | "usdt"
  } | null>(null)
  const [isTransactionPending, setIsTransactionPending] = useState(false)
  const [transactionSuccess, setTransactionSuccess] = useState<boolean | null>(null)

  // Check for existing wallet connection on mount
  useEffect(() => {
    const savedWallet = localStorage.getItem("abstract-wallet")
    if (savedWallet) {
      try {
        setWallet(JSON.parse(savedWallet))
      } catch (e) {
        localStorage.removeItem("abstract-wallet")
      }
    }
  }, [])

  // Save wallet to localStorage when it changes
  useEffect(() => {
    if (wallet) {
      localStorage.setItem("abstract-wallet", JSON.stringify(wallet))
    }
  }, [wallet])

  const connect = async (method: "email" | "social" | "passkey") => {
    setIsConnecting(true)
    setConnectionMethod(method)
    setConnectionError(null)

    try {
      // Simulate connection delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Simulate random connection error (10% chance)
      if (Math.random() < 0.1) {
        throw new Error("Connection failed. Please try again.")
      }

      // Create mock wallet with random address and balance
      const mockWallet: AbstractWallet = {
        address: `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
        balance: {
          eth: Number.parseFloat((Math.random() * 10).toFixed(4)),
          usdt: Number.parseFloat((Math.random() * 10000).toFixed(2)),
        },
        isConnected: true,
        isConnecting: false,
        error: null,
      }

      setWallet(mockWallet)
      setIsWalletModalOpen(false)
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : "Unknown error occurred")
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnect = () => {
    setWallet(null)
    localStorage.removeItem("abstract-wallet")
  }

  const sendTransaction = async (to: string, amount: number, token: "eth" | "usdt"): Promise<boolean> => {
    if (!wallet) return false

    setTransactionDetails({ to, amount, token })
    setIsTransactionModalOpen(true)
    setIsTransactionPending(false)
    setTransactionSuccess(null)

    return new Promise((resolve) => {
      // This will be resolved when the user confirms or cancels the transaction
      window.transactionResolve = resolve
    })
  }

  const confirmTransaction = async () => {
    if (!transactionDetails || !wallet) return

    setIsTransactionPending(true)

    try {
      // Simulate transaction delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Simulate random transaction failure (10% chance)
      if (Math.random() < 0.1) {
        throw new Error("Transaction failed. Please try again.")
      }

      // Update wallet balance
      const { amount, token } = transactionDetails
      setWallet((prev) => {
        if (!prev) return null
        return {
          ...prev,
          balance: {
            ...prev.balance,
            [token]: prev.balance[token] - amount,
          },
        }
      })

      setTransactionSuccess(true)

      // Close modal after showing success for 1.5 seconds
      setTimeout(() => {
        setIsTransactionModalOpen(false)
        if (window.transactionResolve) {
          window.transactionResolve(true)
          delete window.transactionResolve
        }
      }, 1500)
    } catch (error) {
      setTransactionSuccess(false)

      // Close modal after showing error for 1.5 seconds
      setTimeout(() => {
        setIsTransactionModalOpen(false)
        if (window.transactionResolve) {
          window.transactionResolve(false)
          delete window.transactionResolve
        }
      }, 1500)
    } finally {
      setIsTransactionPending(false)
    }
  }

  const cancelTransaction = () => {
    setIsTransactionModalOpen(false)
    if (window.transactionResolve) {
      window.transactionResolve(false)
      delete window.transactionResolve
    }
  }

  const openWalletModal = () => {
    setIsWalletModalOpen(true)
  }

  return (
    <AbstractWalletContext.Provider
      value={{
        wallet,
        connect,
        disconnect,
        sendTransaction,
        openWalletModal,
      }}
    >
      {children}

      {/* Wallet Connection Modal */}
      <Dialog open={isWalletModalOpen} onOpenChange={setIsWalletModalOpen}>
        <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>Connect with Abstract Global Wallet</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Connect once and use your wallet across all Abstract-powered applications.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-zinc-800">
              <TabsTrigger value="email" className="data-[state=active]:bg-zinc-700">
                Email
              </TabsTrigger>
              <TabsTrigger value="social" className="data-[state=active]:bg-zinc-700">
                Social
              </TabsTrigger>
              <TabsTrigger value="passkey" className="data-[state=active]:bg-zinc-700">
                Passkey
              </TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-300">
                  Email address
                </Label>
                <Input
                  id="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isConnecting}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>

              {connectionError && connectionMethod === "email" && (
                <div className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {connectionError}
                </div>
              )}

              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => connect("email")}
                disabled={isConnecting || !email.includes("@")}
              >
                {isConnecting && connectionMethod === "email" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Connect with Email"
                )}
              </Button>
            </TabsContent>

            <TabsContent value="social" className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="w-full border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-white"
                  onClick={() => connect("social")}
                  disabled={isConnecting}
                >
                  {isConnecting && connectionMethod === "social" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Google"
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-white"
                  onClick={() => connect("social")}
                  disabled={isConnecting}
                >
                  {isConnecting && connectionMethod === "social" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Twitter"
                  )}
                </Button>
              </div>

              {connectionError && connectionMethod === "social" && (
                <div className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {connectionError}
                </div>
              )}
            </TabsContent>

            <TabsContent value="passkey" className="space-y-4 py-4">
              <div className="text-center p-4 border border-zinc-700 rounded-md bg-zinc-800">
                <Wallet className="h-12 w-12 mx-auto mb-2 text-zinc-400" />
                <p className="text-sm text-zinc-400">Use your device's biometric authentication to connect securely.</p>
              </div>

              {connectionError && connectionMethod === "passkey" && (
                <div className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {connectionError}
                </div>
              )}

              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => connect("passkey")}
                disabled={isConnecting}
              >
                {isConnecting && connectionMethod === "passkey" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  "Use Passkey"
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Transaction Confirmation Modal */}
      <Dialog
        open={isTransactionModalOpen}
        onOpenChange={(open) => {
          if (!open) cancelTransaction()
          setIsTransactionModalOpen(open)
        }}
      >
        <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>
              {isTransactionPending
                ? "Processing Transaction"
                : transactionSuccess === true
                  ? "Transaction Successful"
                  : transactionSuccess === false
                    ? "Transaction Failed"
                    : "Confirm Transaction"}
            </DialogTitle>
          </DialogHeader>

          {transactionDetails && (
            <div className="space-y-4">
              {transactionSuccess === null && !isTransactionPending && (
                <>
                  <div className="grid grid-cols-2 gap-2 py-2">
                    <div className="text-sm text-zinc-400">From:</div>
                    <div className="text-sm font-mono truncate text-zinc-300">{wallet?.address}</div>

                    <div className="text-sm text-zinc-400">To:</div>
                    <div className="text-sm font-mono truncate text-zinc-300">{transactionDetails.to}</div>

                    <div className="text-sm text-zinc-400">Amount:</div>
                    <div className="text-sm font-medium text-zinc-300">
                      {transactionDetails.amount} {transactionDetails.token.toUpperCase()}
                    </div>

                    <div className="text-sm text-zinc-400">Network:</div>
                    <div className="text-sm text-zinc-300">Abstract Testnet</div>
                  </div>

                  <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
                    <Button
                      variant="outline"
                      onClick={cancelTransaction}
                      className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-white"
                    >
                      Cancel
                    </Button>
                    <Button onClick={confirmTransaction} className="bg-blue-600 hover:bg-blue-700">
                      Confirm Transaction
                    </Button>
                  </DialogFooter>
                </>
              )}

              {isTransactionPending && (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
                  <p className="text-center text-zinc-300">Processing your transaction...</p>
                  <p className="text-sm text-zinc-400 text-center mt-2">
                    Please wait while we confirm your transaction on the Abstract Testnet.
                  </p>
                </div>
              )}

              {transactionSuccess === true && (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="h-12 w-12 rounded-full bg-green-900/30 flex items-center justify-center mb-4">
                    <Check className="h-6 w-6 text-green-500" />
                  </div>
                  <p className="text-center font-medium text-zinc-300">Transaction Successful!</p>
                  <p className="text-sm text-zinc-400 text-center mt-2">
                    Your transaction has been confirmed on the Abstract Testnet.
                  </p>
                </div>
              )}

              {transactionSuccess === false && (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="h-12 w-12 rounded-full bg-red-900/30 flex items-center justify-center mb-4">
                    <AlertCircle className="h-6 w-6 text-red-500" />
                  </div>
                  <p className="text-center font-medium text-zinc-300">Transaction Failed</p>
                  <p className="text-sm text-zinc-400 text-center mt-2">
                    There was an error processing your transaction. Please try again.
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AbstractWalletContext.Provider>
  )
}

// Add this to the global Window interface
declare global {
  interface Window {
    transactionResolve?: (value: boolean) => void
  }
}

