"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, RotateCw, ChevronUp, ChevronDown, Volume2, VolumeX } from "lucide-react"
import Image from "next/image"

// Slot symbols
type Symbol = "bear" | "red-berry" | "blue-berry" | "coin-heads" | "coin-tails"

interface SlotSymbol {
  id: Symbol
  image: string
  value: number
}

export default function SlotsGame() {
  // Game state
  const [playerBalance, setPlayerBalance] = useState(1000)
  const [betAmount, setBetAmount] = useState(10)
  const [isSpinning, setIsSpinning] = useState(false)
  const [reels, setReels] = useState<SlotSymbol[][]>([[], [], []])
  const [spinResult, setSpinResult] = useState<SlotSymbol[]>([])
  const [winAmount, setWinAmount] = useState(0)
  const [message, setMessage] = useState("")
  const [soundEnabled, setSoundEnabled] = useState(false)

  // Refs for animation
  const spinTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const spinIntervalsRef = useRef<NodeJS.Timeout[]>([])

  // Define symbols
  const symbols: SlotSymbol[] = [
    { id: "bear", image: "/public/images/bearish-logo.png", value: 5 },
    { id: "red-berry", image: "/public/images/red-berry.png", value: 3 },
    { id: "blue-berry", image: "/public/images/blue-berry.png", value: 3 },
    { id: "coin-heads", image: "/public/images/coin-heads.png", value: 2 },
    { id: "coin-tails", image: "/public/images/coin-tails.png", value: 2 },
  ]

  // Initialize reels
  useEffect(() => {
    initializeReels()
  }, [])

  // Initialize reels with random symbols
  const initializeReels = () => {
    const newReels = [[], [], []] as SlotSymbol[][]

    // Fill each reel with symbols
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 10; j++) {
        const randomIndex = Math.floor(Math.random() * symbols.length)
        newReels[i].push(symbols[randomIndex])
      }
    }

    setReels(newReels)

    // Set initial visible symbols
    const initialResult = [newReels[0][0], newReels[1][0], newReels[2][0]]

    setSpinResult(initialResult)
  }

  // Handle bet amount change
  const changeBetAmount = (amount: number) => {
    if (isSpinning) return
    setBetAmount(Math.max(1, Math.min(100, amount)))
  }

  // Spin the reels
  const spinReels = () => {
    if (isSpinning || betAmount <= 0 || betAmount > playerBalance) return

    // Deduct bet amount
    setPlayerBalance((prev) => prev - betAmount)

    // Start spinning animation
    setIsSpinning(true)
    setWinAmount(0)
    setMessage("")

    // Clear previous intervals
    spinIntervalsRef.current.forEach((interval) => clearInterval(interval))
    spinIntervalsRef.current = []

    // Create new reels for this spin
    const newReels = [[], [], []] as SlotSymbol[][]

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 20; j++) {
        const randomIndex = Math.floor(Math.random() * symbols.length)
        newReels[i].push(symbols[randomIndex])
      }
    }

    setReels(newReels)

    // Spin each reel with different stop times
    const reelPositions = [0, 0, 0]

    for (let i = 0; i < 3; i++) {
      const interval = setInterval(() => {
        reelPositions[i] = (reelPositions[i] + 1) % newReels[i].length

        // Update visible symbols
        setSpinResult((prev) => {
          const newResult = [...prev]
          newResult[i] = newReels[i][reelPositions[i]]
          return newResult
        })
      }, 50) as NodeJS.Timeout

      spinIntervalsRef.current.push(interval)

      // Stop each reel after a delay
      setTimeout(
        () => {
          clearInterval(interval)
        },
        1000 + i * 500,
      )
    }

    // Determine final result after all reels stop
    spinTimeoutRef.current = setTimeout(() => {
      // Clear all intervals
      spinIntervalsRef.current.forEach((interval) => clearInterval(interval))

      // Determine final symbols
      const finalSymbols = [newReels[0][reelPositions[0]], newReels[1][reelPositions[1]], newReels[2][reelPositions[2]]]

      setSpinResult(finalSymbols)

      // Check for wins
      checkWin(finalSymbols)

      setIsSpinning(false)
    }, 2500)
  }

  // Check for winning combinations
  const checkWin = (result: SlotSymbol[]) => {
    // Check if all symbols are the same
    const allSame = result[0].id === result[1].id && result[1].id === result[2].id

    // Check if all are berries (red or blue)
    const allBerries = result.every((symbol) => symbol.id === "red-berry" || symbol.id === "blue-berry")

    // Check if all are coins (heads or tails)
    const allCoins = result.every((symbol) => symbol.id === "coin-heads" || symbol.id === "coin-tails")

    // Check for bears (highest value)
    const bearCount = result.filter((symbol) => symbol.id === "bear").length

    let win = 0
    let winMessage = ""

    if (allSame) {
      // All 3 same symbols
      win = betAmount * result[0].value * 3
      winMessage = `Triple ${result[0].id}! You won ${win.toFixed(2)}!`
    } else if (allBerries) {
      // All berries (any combination)
      win = betAmount * 4
      winMessage = "Berry Bonanza! You won $" + win.toFixed(2) + "!"
    } else if (allCoins) {
      // All coins (any combination)
      win = betAmount * 3
      winMessage = "Coin Collection! You won $" + win.toFixed(2) + "!"
    } else if (bearCount === 2) {
      // Two bears
      win = betAmount * 4
      winMessage = "Double Bears! You won $" + win.toFixed(2) + "!"
    } else if (bearCount === 1) {
      // One bear
      win = betAmount * 1.5
      winMessage = "Single Bear! You won $" + win.toFixed(2) + "!"
    } else if (result[0].id === result[1].id || result[1].id === result[2].id || result[0].id === result[2].id) {
      // Any 2 matching symbols
      win = betAmount * 1.2
      winMessage = "Two of a kind! You won $" + win.toFixed(2) + "!"
    } else {
      winMessage = "No win. Try again!"
    }

    if (win > 0) {
      setPlayerBalance((prev) => prev + win)
      setWinAmount(win)
    }

    setMessage(winMessage)
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
      <Card className="w-full max-w-4xl mx-auto overflow-hidden">
        <div className="w-full h-16 bg-[#74C480] relative overflow-hidden">
          <Image src="/public/images/bearish-banner.png" alt="Bearish Banner" fill className="object-cover" />
        </div>

        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Image src="/public/images/bearish-logo.png" alt="Bearish Logo" width={40} height={40} />
              <CardTitle>Bearish Slots</CardTitle>
            </div>
            <Badge variant="outline" className="text-lg py-1">
              Balance: ${playerBalance.toFixed(2)}
            </Badge>
          </div>
          <CardDescription>Spin to match symbols and win big!</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col items-center">
            {/* Slot machine display */}
            <div className="w-full max-w-md bg-[#40251E] p-6 rounded-lg mb-6 relative">
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

              <div className="flex justify-center gap-2 mb-4">
                <div className="text-white text-xs">
                  <div className="flex items-center gap-1 mb-1">
                    <div className="w-4 h-4 relative">
                      <Image src="/images/bearish-logo.png" alt="Bear" fill />
                    </div>
                    <div className="w-4 h-4 relative">
                      <Image src="/public/images/bearish-logo.png" alt="Bear" fill />
                    </div>
                    <div className="w-4 h-4 relative">
                      <Image src="/public/images/bearish-logo.png" alt="Bear" fill />
                    </div>
                    <span>= 15x</span>
                  </div>

                  <div className="flex items-center gap-1 mb-1">
                    <div className="w-4 h-4 relative">
                      <Image src="/public/images/red-berry.png" alt="Red Berry" fill />
                    </div>
                    <div className="w-4 h-4 relative">
                      <Image src="/public/images/red-berry.png" alt="Red Berry" fill />
                    </div>
                    <div className="w-4 h-4 relative">
                      <Image src="/public/images/red-berry.png" alt="Red Berry" fill />
                    </div>
                    <span>= 9x</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 relative">
                      <Image src="/public/images/coin-heads.png" alt="Coin" fill />
                    </div>
                    <div className="w-4 h-4 relative">
                      <Image src="/public/images/coin-heads.png" alt="Coin" fill />
                    </div>
                    <div className="w-4 h-4 relative">
                      <Image src="/public/images/coin-heads.png" alt="Coin" fill />
                    </div>
                    <span>= 6x</span>
                  </div>
                </div>

                <div className="text-white text-xs">
                  <div className="flex items-center gap-1 mb-1">
                    <div className="w-4 h-4 relative">
                      <Image src="/public/images/bearish-logo.png" alt="Bear" fill />
                    </div>
                    <div className="w-4 h-4 relative">
                      <Image src="/public/images/bearish-logo.png" alt="Bear" fill />
                    </div>
                    <span>= 4x</span>
                  </div>

                  <div className="flex items-center gap-1 mb-1">
                    <div className="w-4 h-4 relative">
                      <Image src="/public/images/red-berry.png" alt="Berry" fill />
                    </div>
                    <div className="w-4 h-4 relative">
                      <Image src="/public/images/blue-berry.png" alt="Berry" fill />
                    </div>
                    <div className="w-4 h-4 relative">
                      <Image src="/public/images/red-berry.png" alt="Berry" fill />
                    </div>
                    <span>= 4x</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 relative">
                      <Image src="/public/images/bearish-logo.png" alt="Bear" fill />
                    </div>
                    <span>= 1.5x</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center gap-4 mb-6">
                {spinResult.map((symbol, index) => (
                  <div
                    key={index}
                    className={`w-24 h-24 bg-white rounded-lg flex items-center justify-center ${isSpinning ? "animate-pulse" : ""}`}
                  >
                    {symbol && (
                      <div className="w-20 h-20 relative">
                        <Image
                          src={symbol.image || "/placeholder.svg"}
                          alt={symbol.id}
                          fill
                          className={isSpinning ? "animate-spin" : ""}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {winAmount > 0 && (
                <div className="text-center mb-4">
                  <div className="text-[#FFD700] text-2xl font-bold animate-pulse">WIN: ${winAmount.toFixed(2)}</div>
                </div>
              )}

              <div className="flex justify-center">
                <Button
                  className="bg-[#E36F6F] hover:bg-[#E36F6F]/90 text-white px-8 py-6 text-xl rounded-full"
                  onClick={spinReels}
                  disabled={isSpinning || betAmount <= 0 || betAmount > playerBalance}
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
                <h3 className="text-lg font-semibold">Bet Amount</h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => changeBetAmount(betAmount - 1)}
                    disabled={isSpinning || betAmount <= 1}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>

                  <div className="w-20 h-10 bg-muted rounded flex items-center justify-center font-bold">
                    ${betAmount}
                  </div>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => changeBetAmount(betAmount + 1)}
                    disabled={isSpinning || betAmount >= 100 || betAmount >= playerBalance}
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
                  className={betAmount === 5 ? "bg-[#74C480]/20" : ""}
                >
                  $5
                </Button>
                <Button
                  variant="outline"
                  onClick={() => changeBetAmount(10)}
                  disabled={isSpinning}
                  className={betAmount === 10 ? "bg-[#74C480]/20" : ""}
                >
                  $10
                </Button>
                <Button
                  variant="outline"
                  onClick={() => changeBetAmount(25)}
                  disabled={isSpinning}
                  className={betAmount === 25 ? "bg-[#74C480]/20" : ""}
                >
                  $25
                </Button>
                <Button
                  variant="outline"
                  onClick={() => changeBetAmount(50)}
                  disabled={isSpinning}
                  className={betAmount === 50 ? "bg-[#74C480]/20" : ""}
                >
                  $50
                </Button>
                <Button
                  variant="outline"
                  onClick={() => changeBetAmount(100)}
                  disabled={isSpinning}
                  className={betAmount === 100 ? "bg-[#74C480]/20" : ""}
                >
                  $100
                </Button>
                <Button
                  variant="outline"
                  onClick={() => changeBetAmount(Math.min(playerBalance, 100))}
                  disabled={isSpinning}
                >
                  Max
                </Button>
              </div>

              {message && (
                <Alert
                  className={
                    message.includes("won")
                      ? "bg-[#74C480]/10 border-[#74C480]/20"
                      : "bg-[#E36F6F]/10 border-[#E36F6F]/20"
                  }
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="font-medium">{message}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

