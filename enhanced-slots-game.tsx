"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, RotateCw, ChevronUp, ChevronDown, Volume2, VolumeX } from "lucide-react"
import Image from "next/image"
import { useAbstractWallet } from "./abstract-wallet-provider"

// Slot symbols
type Symbol = "seven" | "cherry" | "lemon" | "bar" | "diamond"

interface SlotSymbol {
  id: Symbol
  image: string
  value: number
}

export default function EnhancedSlotsGame() {
  // Wallet integration
  const { wallet, sendTransaction } = useAbstractWallet()

  // Game state
  const [playerBalance, setPlayerBalance] = useState(1000)
  const [ethBalance, setEthBalance] = useState(0)
  const [betAmount, setBetAmount] = useState(10)
  const [isSpinning, setIsSpinning] = useState(false)
  const [reels, setReels] = useState<SlotSymbol[][][]>([[], [], []])
  const [visibleSymbols, setVisibleSymbols] = useState<SlotSymbol[][]>([[], [], []])
  const [winAmount, setWinAmount] = useState(0)
  const [message, setMessage] = useState("")
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [currency, setCurrency] = useState<"usd" | "eth">("usd")

  // Refs for animation
  const spinTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const spinIntervalsRef = useRef<NodeJS.Timeout[]>([])
  const reelRefs = useRef<(HTMLDivElement | null)[]>([null, null, null])

  // Define symbols
  const symbols: SlotSymbol[] = [
    { id: "seven", image: "/images/blue-berry.png", value: 5 },
    { id: "cherry", image: "/images/coin-heads.png", value: 3 },
    { id: "diamond", image: "/images/red-berry.png", value: 4 },
    { id: "bar", image: "/images/eth-token.png", value: 2 },
    { id: "lemon", image: "/images/bearish-logo.png", value: 1 },
  ]

  // Update ETH balance when wallet changes
  useEffect(() => {
    if (wallet) {
      setEthBalance(wallet.balance.eth)
    } else {
      setEthBalance(0)
    }
  }, [wallet])

  // Initialize reels
  useEffect(() => {
    initializeReels()
  }, [])

  // Initialize reels with random symbols
  const initializeReels = () => {
    // Create 3 reels with 20 symbols each
    const newReels: SlotSymbol[][][] = [[], [], []]

    // Fill each reel with symbols
    for (let i = 0; i < 3; i++) {
      const reel: SlotSymbol[][] = []

      // Each reel has 5 rows of symbols
      for (let j = 0; j < 20; j++) {
        const randomIndex = Math.floor(Math.random() * symbols.length)
        reel.push([symbols[randomIndex]])
      }

      newReels[i] = reel
    }

    setReels(newReels)

    // Set initial visible symbols (3 rows per reel)
    const initialVisible: SlotSymbol[][] = [
      [newReels[0][0][0], newReels[0][1][0], newReels[0][2][0]],
      [newReels[1][0][0], newReels[1][1][0], newReels[1][2][0]],
      [newReels[2][0][0], newReels[2][1][0], newReels[2][2][0]],
    ]

    setVisibleSymbols(initialVisible)
  }

  // Handle bet amount change
  const changeBetAmount = (amount: number) => {
    if (isSpinning) return
    setBetAmount(Math.max(1, Math.min(100, amount)))
  }

  // Spin the reels
  const spinReels = async () => {
    if (isSpinning || betAmount <= 0) return

    // Check if player has enough balance
    if (currency === "usd" && betAmount > playerBalance) return
    if (currency === "eth" && betAmount > ethBalance) return

    // If using ETH, send transaction through wallet
    if (currency === "eth" && wallet) {
      // Random address for game contract
      const gameContractAddress = "0x7F5c764cBc14f9669B88837ca1490cCa17c31607"

      // Send transaction
      const success = await sendTransaction(gameContractAddress, betAmount, "eth")

      // If transaction failed, return
      if (!success) return

      // Update ETH balance
      setEthBalance((prev) => prev - betAmount)
    } else {
      // Deduct USD balance
      setPlayerBalance((prev) => prev - betAmount)
    }

    // Start spinning animation
    setIsSpinning(true)
    setWinAmount(0)
    setMessage("")

    // Clear previous intervals
    spinIntervalsRef.current.forEach((interval) => clearInterval(interval))
    spinIntervalsRef.current = []

    // Create new reels for this spin
    const newReels: SlotSymbol[][][] = [[], [], []]

    for (let i = 0; i < 3; i++) {
      const reel: SlotSymbol[][] = []

      // Each reel has 20 rows of symbols
      for (let j = 0; j < 20; j++) {
        const randomIndex = Math.floor(Math.random() * symbols.length)
        reel.push([symbols[randomIndex]])
      }

      newReels[i] = reel
    }

    setReels(newReels)

    // Determine final positions (rigged to sometimes match)
    const shouldWin = Math.random() < 0.3 // 30% chance to win
    const finalPositions = [
      Math.floor(Math.random() * 17),
      Math.floor(Math.random() * 17),
      Math.floor(Math.random() * 17),
    ]

    // If should win, make at least 2 reels match
    if (shouldWin) {
      const matchSymbol = Math.floor(Math.random() * symbols.length)

      // Force the first two reels to have the same symbol
      newReels[0][finalPositions[0]][0] = symbols[matchSymbol]
      newReels[1][finalPositions[1]][0] = symbols[matchSymbol]

      // 50% chance for all three to match (big win)
      if (Math.random() < 0.5) {
        newReels[2][finalPositions[2]][0] = symbols[matchSymbol]
      }
    }

    // Spin each reel with different speeds and stop times
    for (let i = 0; i < 3; i++) {
      const reelElement = reelRefs.current[i]

      if (reelElement) {
        // Reset position
        reelElement.style.transition = "none"
        reelElement.style.transform = "translateY(0)"

        // Force reflow
        void reelElement.offsetHeight

        // Start spinning with CSS animation
        const spinDuration = 2 + i * 0.5 // 2s, 2.5s, 3s for each reel
        const spinHeight = newReels[i].length * 80 // Each symbol is 80px high

        reelElement.style.transition = `transform ${spinDuration}s cubic-bezier(0.1, 0.5, 0.5, 1)`
        reelElement.style.transform = `translateY(-${spinHeight + finalPositions[i] * 80}px)`
      }

      // Stop each reel after a delay
      setTimeout(
        () => {
          if (reelElement) {
            // Snap to final position
            reelElement.style.transition = "none"
            reelElement.style.transform = `translateY(-${finalPositions[i] * 80}px)`

            // Update visible symbols
            setVisibleSymbols((prev) => {
              const newVisible = [...prev]
              newVisible[i] = [
                newReels[i][finalPositions[i]][0],
                newReels[i][(finalPositions[i] + 1) % newReels[i].length][0],
                newReels[i][(finalPositions[i] + 2) % newReels[i].length][0],
              ]
              return newVisible
            })
          }

          // If this is the last reel, check for wins
          if (i === 2) {
            setTimeout(() => {
              const finalSymbols = [
                newReels[0][finalPositions[0]][0],
                newReels[1][finalPositions[1]][0],
                newReels[2][finalPositions[2]][0],
              ]

              checkWin(finalSymbols)
              setIsSpinning(false)
            }, 500)
          }
        },
        (2 + i * 0.5) * 1000,
      )
    }
  }

  // Check for winning combinations
  const checkWin = (result: SlotSymbol[]) => {
    // Check if all symbols are the same
    const allSame = result[0].id === result[1].id && result[1].id === result[2].id

    // Check if first two symbols are the same
    const firstTwoSame = result[0].id === result[1].id

    // Check if last two symbols are the same
    const lastTwoSame = result[1].id === result[2].id

    // Check for special combinations
    const allSevens = result.every((symbol) => symbol.id === "seven")
    const allCherry = result.every((symbol) => symbol.id === "cherry")
    const allDiamonds = result.every((symbol) => symbol.id === "diamond")

    let win = 0
    let winMessage = ""

    if (allSame) {
      if (allSevens) {
        // Jackpot - all sevens
        win = betAmount * 10
        winMessage =
          "JACKPOT! Triple Sevens! You won " +
          (currency === "eth" ? win.toFixed(4) + " ETH" : "$" + win.toFixed(2)) +
          "!"
      } else if (allCherry) {
        // Triple cherry
        win = betAmount * 5
        winMessage =
          "Triple Cherry! You won " + (currency === "eth" ? win.toFixed(4) + " ETH" : "$" + win.toFixed(2)) + "!"
      } else if (allDiamonds) {
        // Triple diamond
        win = betAmount * 8
        winMessage =
          "Triple Diamond! You won " + (currency === "eth" ? win.toFixed(4) + " ETH" : "$" + win.toFixed(2)) + "!"
      } else {
        // Any three matching symbols
        win = betAmount * result[0].value
        winMessage = `Triple ${result[0].id}! You won ${currency === "eth" ? win.toFixed(4) + " ETH" : "$" + win.toFixed(2)}!`
      }
    } else if (firstTwoSame || lastTwoSame) {
      // Two matching symbols
      win = betAmount * 0.5
      winMessage =
        "Two matching symbols! You won " + (currency === "eth" ? win.toFixed(4) + " ETH" : "$" + win.toFixed(2)) + "!"
    } else {
      winMessage = "No win. Try again!"
    }

    if (win > 0) {
      if (currency === "eth") {
        setEthBalance((prev) => prev + win)
      } else {
        setPlayerBalance((prev) => prev + win)
      }
      setWinAmount(win)
    }

    setMessage(winMessage)

    // Play sound if enabled
    if (soundEnabled && win > 0) {
      // Play win sound
      const audio = new Audio("/win-sound.mp3")
      audio.play().catch((e) => console.log("Audio play failed:", e))
    }
  }

  // Clean up intervals and timeouts
  useEffect(() => {
    return () => {
      if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current)
      spinIntervalsRef.current.forEach((interval) => clearInterval(interval))
    }
  }, [])

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-4xl mx-auto overflow-hidden bg-zinc-900 border-zinc-800">
        <div className="w-full h-16 bg-zinc-800 relative overflow-hidden">
          <Image src="/images/bearish-banner.png" alt="Bearish Banner" fill className="object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20"></div>
        </div>

        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Image src="/images/bearish-logo.png" alt="Bearish Logo" width={40} height={40} />
              <CardTitle className="text-white">Bearish Slots</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-lg py-1 border-zinc-700 bg-zinc-800">
                {currency === "usd" ? (
                  <>Balance: ${playerBalance.toFixed(2)}</>
                ) : (
                  <>Balance: {ethBalance.toFixed(4)} ETH</>
                )}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
                onClick={() => setCurrency(currency === "usd" ? "eth" : "usd")}
              >
                {currency === "usd" ? (
                  <span className="flex items-center gap-1">
                    <span>USD</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Image src="/images/eth-token.png" alt="ETH" width={16} height={16} />
                    <span>ETH</span>
                  </span>
                )}
              </Button>
            </div>
          </div>
          <CardDescription className="text-zinc-400">Spin to match symbols and win big!</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col items-center">
            {/* Slot machine display */}
            <div className="w-full max-w-md bg-zinc-950 p-6 rounded-lg mb-6 relative border-2 border-zinc-800 shadow-lg">
              <div className="absolute top-2 right-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="h-8 w-8 text-white/70 hover:text-white"
                >
                  {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </Button>
              </div>

              {/* Paytable */}
              <div className="flex justify-center gap-2 mb-4">
                <div className="text-white text-xs">
                  <div className="flex items-center gap-1 mb-1">
                    <div className="w-4 h-4 relative">
                      <Image src="/images/blue-berry.png" alt="Seven" fill />
                    </div>
                    <div className="w-4 h-4 relative">
                      <Image src="/images/blue-berry.png" alt="Seven" fill />
                    </div>
                    <div className="w-4 h-4 relative">
                      <Image src="/images/blue-berry.png" alt="Seven" fill />
                    </div>
                    <span>= 10x</span>
                  </div>

                  <div className="flex items-center gap-1 mb-1">
                    <div className="w-4 h-4 relative">
                      <Image src="/images/red-berry.png" alt="Diamond" fill />
                    </div>
                    <div className="w-4 h-4 relative">
                      <Image src="/images/red-berry.png" alt="Diamond" fill />
                    </div>
                    <div className="w-4 h-4 relative">
                      <Image src="/images/red-berry.png" alt="Diamond" fill />
                    </div>
                    <span>= 8x</span>
                  </div>
                </div>

                <div className="text-white text-xs">
                  <div className="flex items-center gap-1 mb-1">
                    <div className="w-4 h-4 relative">
                      <Image src="/images/coin-heads.png" alt="Cherry" fill />
                    </div>
                    <div className="w-4 h-4 relative">
                      <Image src="/images/coin-heads.png" alt="Cherry" fill />
                    </div>
                    <div className="w-4 h-4 relative">
                      <Image src="/images/coin-heads.png" alt="Cherry" fill />
                    </div>
                    <span>= 5x</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 relative">
                      <Image src="/images/eth-token.png" alt="Bar" fill />
                    </div>
                    <div className="w-4 h-4 relative">
                      <Image src="/images/eth-token.png" alt="Bar" fill />
                    </div>
                    <span>= 0.5x</span>
                  </div>
                </div>
              </div>

              {/* Slot reels */}
              <div className="flex justify-center gap-2 mb-6 h-[240px] bg-zinc-900 rounded-lg p-2 border border-zinc-800 overflow-hidden">
                {[0, 1, 2].map((reelIndex) => (
                  <div key={reelIndex} className="relative w-[80px] h-[240px] overflow-hidden bg-zinc-800 rounded-md">
                    {/* Highlight the middle row */}
                    <div className="absolute inset-0 pointer-events-none z-10">
                      <div className="absolute top-1/3 left-0 right-0 h-1/3 border-2 border-yellow-500/50 rounded-md"></div>
                    </div>

                    {/* Reel container */}
                    <div ref={(el) => (reelRefs.current[reelIndex] = el)} className="absolute top-0 left-0 w-full">
                      {/* Initial visible symbols */}
                      {visibleSymbols[reelIndex]?.map((symbol, symbolIndex) => (
                        <div key={symbolIndex} className="w-full h-[80px] flex items-center justify-center">
                          <div className="w-[60px] h-[60px] relative">
                            <Image
                              src={symbol?.image || "/placeholder.svg"}
                              alt={symbol?.id || "symbol"}
                              width={60}
                              height={60}
                              className="object-contain"
                            />
                          </div>
                        </div>
                      ))}

                      {/* Additional symbols for animation */}
                      {isSpinning &&
                        reels[reelIndex]?.map((symbolRow, rowIndex) => (
                          <div
                            key={`spinning-${reelIndex}-${rowIndex}`}
                            className="w-full h-[80px] flex items-center justify-center"
                          >
                            <div className="w-[60px] h-[60px] relative">
                              <Image
                                src={symbolRow[0]?.image || "/placeholder.svg"}
                                alt={symbolRow[0]?.id || "symbol"}
                                width={60}
                                height={60}
                                className="object-contain"
                              />
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>

              {winAmount > 0 && (
                <div className="text-center mb-4">
                  <div className="text-yellow-500 text-2xl font-bold animate-pulse">
                    WIN: {currency === "eth" ? winAmount.toFixed(4) + " ETH" : "$" + winAmount.toFixed(2)}
                  </div>
                </div>
              )}

              <div className="flex justify-center">
                <Button
                  className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white px-8 py-6 text-xl rounded-full shadow-lg"
                  onClick={spinReels}
                  disabled={
                    isSpinning ||
                    betAmount <= 0 ||
                    (currency === "usd" ? betAmount > playerBalance : betAmount > ethBalance) ||
                    (currency === "eth" && !wallet)
                  }
                >
                  {isSpinning ? (
                    <>
                      <RotateCw className="mr-2 h-5 w-5 animate-spin" />
                      Spinning...
                    </>
                  ) : (
                    "SPIN"
                  )}
                </Button>
              </div>
            </div>

            <Separator className="mb-4" />

            {/* Bet controls */}
            <div className="w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Bet Amount</h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => changeBetAmount(betAmount - 1)}
                    disabled={isSpinning || betAmount <= 1}
                    className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-white"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>

                  <div className="w-20 h-10 bg-zinc-800 rounded flex items-center justify-center font-bold text-white">
                    {currency === "eth" ? betAmount / 100 : betAmount}
                  </div>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => changeBetAmount(betAmount + 1)}
                    disabled={
                      isSpinning ||
                      betAmount >= 100 ||
                      (currency === "usd" ? betAmount >= playerBalance : betAmount >= ethBalance)
                    }
                    className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-white"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <Button
                  variant="outline"
                  onClick={() => changeBetAmount(5)}
                  disabled={isSpinning}
                  className={`border-zinc-700 ${betAmount === 5 ? "bg-zinc-700" : "bg-zinc-800"} hover:bg-zinc-700 text-white`}
                >
                  {currency === "eth" ? "0.05" : "5"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => changeBetAmount(10)}
                  disabled={isSpinning}
                  className={`border-zinc-700 ${betAmount === 10 ? "bg-zinc-700" : "bg-zinc-800"} hover:bg-zinc-700 text-white`}
                >
                  {currency === "eth" ? "0.1" : "10"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => changeBetAmount(25)}
                  disabled={isSpinning}
                  className={`border-zinc-700 ${betAmount === 25 ? "bg-zinc-700" : "bg-zinc-800"} hover:bg-zinc-700 text-white`}
                >
                  {currency === "eth" ? "0.25" : "25"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => changeBetAmount(50)}
                  disabled={isSpinning}
                  className={`border-zinc-700 ${betAmount === 50 ? "bg-zinc-700" : "bg-zinc-800"} hover:bg-zinc-700 text-white`}
                >
                  {currency === "eth" ? "0.5" : "50"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => changeBetAmount(100)}
                  disabled={isSpinning}
                  className={`border-zinc-700 ${betAmount === 100 ? "bg-zinc-700" : "bg-zinc-800"} hover:bg-zinc-700 text-white`}
                >
                  {currency === "eth" ? "1.0" : "100"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => changeBetAmount(Math.min(currency === "usd" ? playerBalance : ethBalance * 100, 100))}
                  disabled={isSpinning}
                  className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-white"
                >
                  Max
                </Button>
              </div>

              {message && (
                <Alert
                  className={
                    message.includes("won") ? "bg-green-500/10 border-green-500/20" : "bg-zinc-800 border-zinc-700"
                  }
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="font-medium text-white">{message}</AlertDescription>
                </Alert>
              )}

              {/* Game rules */}
              <div className="mt-4 bg-zinc-800 p-3 rounded-lg border border-zinc-700">
                <h3 className="text-white font-medium mb-2">How to Win</h3>
                <ul className="text-sm text-zinc-400 space-y-1 list-disc list-inside">
                  <li>Match 3 symbols on the middle row to win big!</li>
                  <li>Triple Sevens pays 10x your bet</li>
                  <li>Triple Diamonds pays 8x your bet</li>
                  <li>Triple Cherries pays 5x your bet</li>
                  <li>Any 2 matching symbols pays 0.5x your bet</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

