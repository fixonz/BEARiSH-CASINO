"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { RefreshCw, AlertCircle, RotateCw, Trash2 } from "lucide-react"

// Roulette number types
type RouletteNumber = {
  number: number
  color: "red" | "black" | "green"
}

// Bet types
type BetType =
  | "straight"
  | "split"
  | "street"
  | "corner"
  | "line"
  | "dozen"
  | "column"
  | "eighteen"
  | "even-odd"
  | "red-black"

type Bet = {
  type: BetType
  numbers: number[]
  amount: number
  payout: number
}

export default function RouletteGame() {
  // Game state
  const [playerBalance, setPlayerBalance] = useState(1000)
  const [currentBet, setCurrentBet] = useState(5)
  const [placedBets, setPlacedBets] = useState<Bet[]>([])
  const [totalBetAmount, setTotalBetAmount] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)
  const [winningNumber, setWinningNumber] = useState<RouletteNumber | null>(null)
  const [previousNumbers, setPreviousNumbers] = useState<RouletteNumber[]>([])
  const [message, setMessage] = useState("")
  const [activeTab, setActiveTab] = useState("inside")

  // Roulette wheel numbers
  const rouletteNumbers: RouletteNumber[] = [
    { number: 0, color: "green" },
    { number: 32, color: "red" },
    { number: 15, color: "black" },
    { number: 19, color: "red" },
    { number: 4, color: "black" },
    { number: 21, color: "red" },
    { number: 2, color: "black" },
    { number: 25, color: "red" },
    { number: 17, color: "black" },
    { number: 34, color: "red" },
    { number: 6, color: "black" },
    { number: 27, color: "red" },
    { number: 13, color: "black" },
    { number: 36, color: "red" },
    { number: 11, color: "black" },
    { number: 30, color: "red" },
    { number: 8, color: "black" },
    { number: 23, color: "red" },
    { number: 10, color: "black" },
    { number: 5, color: "red" },
    { number: 24, color: "black" },
    { number: 16, color: "red" },
    { number: 33, color: "black" },
    { number: 1, color: "red" },
    { number: 20, color: "black" },
    { number: 14, color: "red" },
    { number: 31, color: "black" },
    { number: 9, color: "red" },
    { number: 22, color: "black" },
    { number: 18, color: "red" },
    { number: 29, color: "black" },
    { number: 7, color: "red" },
    { number: 28, color: "black" },
    { number: 12, color: "red" },
    { number: 35, color: "black" },
    { number: 3, color: "red" },
    { number: 26, color: "black" },
  ]

  // Bet presets
  const betPresets = [
    { amount: 1, label: "$1" },
    { amount: 5, label: "$5" },
    { amount: 10, label: "$10" },
    { amount: 25, label: "$25" },
    { amount: 100, label: "$100" },
  ]

  // Update total bet amount when bets change
  useEffect(() => {
    const total = placedBets.reduce((sum, bet) => sum + bet.amount, 0)
    setTotalBetAmount(total)
  }, [placedBets])

  // Place a bet
  const placeBet = (type: BetType, numbers: number[], payout: number) => {
    if (currentBet <= 0 || currentBet > playerBalance - totalBetAmount) return

    // Check if this exact bet already exists
    const existingBetIndex = placedBets.findIndex(
      (bet) =>
        bet.type === type && bet.numbers.length === numbers.length && bet.numbers.every((num) => numbers.includes(num)),
    )

    if (existingBetIndex !== -1) {
      // Update existing bet
      const updatedBets = [...placedBets]
      updatedBets[existingBetIndex].amount += currentBet
      setPlacedBets(updatedBets)
    } else {
      // Add new bet
      setPlacedBets([
        ...placedBets,
        {
          type,
          numbers,
          amount: currentBet,
          payout,
        },
      ])
    }
  }

  // Clear all bets
  const clearBets = () => {
    setPlacedBets([])
    setMessage("")
  }

  // Spin the wheel
  const spinWheel = () => {
    if (totalBetAmount <= 0) return

    setIsSpinning(true)
    setMessage("")

    // Deduct bet amount from balance
    setPlayerBalance((prev) => prev - totalBetAmount)

    // Simulate wheel spinning
    const spinDuration = 3000 + Math.random() * 2000

    // Show random numbers during spin
    const spinInterval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * rouletteNumbers.length)
      setWinningNumber(rouletteNumbers[randomIndex])
    }, 100)

    // Determine final result
    setTimeout(() => {
      clearInterval(spinInterval)

      // Select random winning number
      const randomIndex = Math.floor(Math.random() * rouletteNumbers.length)
      const result = rouletteNumbers[randomIndex]
      setWinningNumber(result)

      // Add to previous numbers
      setPreviousNumbers((prev) => [result, ...prev].slice(0, 10))

      // Calculate winnings
      let totalWinnings = 0

      placedBets.forEach((bet) => {
        if (bet.numbers.includes(result.number)) {
          totalWinnings += bet.amount * bet.payout
        }
      })

      // Update balance and show message
      if (totalWinnings > 0) {
        setPlayerBalance((prev) => prev + totalWinnings)
        setMessage(`You won $${totalWinnings.toFixed(2)}!`)
      } else {
        setMessage("No win this time. Try again!")
      }

      setIsSpinning(false)
    }, spinDuration)
  }

  // Get color class for number
  const getColorClass = (color: "red" | "black" | "green") => {
    if (color === "red") return "bg-red-600 text-white"
    if (color === "black") return "bg-black text-white"
    return "bg-green-600 text-white"
  }

  // Render the roulette board
  const renderRouletteBoard = () => {
    return (
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="col-span-3 flex justify-center">
          <Button
            variant="outline"
            className={`w-12 h-12 ${getColorClass("green")}`}
            onClick={() => placeBet("straight", [0], 36)}
            disabled={isSpinning}
          >
            0
          </Button>
        </div>

        <div className="col-span-3 grid grid-cols-12 gap-1">
          {Array.from({ length: 36 }, (_, i) => i + 1).map((num) => {
            const numberInfo = rouletteNumbers.find((n) => n.number === num)
            return (
              <Button
                key={num}
                variant="outline"
                className={`w-12 h-12 ${getColorClass(numberInfo?.color || "black")}`}
                onClick={() => placeBet("straight", [num], 36)}
                disabled={isSpinning}
              >
                {num}
              </Button>
            )
          })}
        </div>

        <div className="col-span-3 grid grid-cols-3 gap-1">
          <Button
            variant="outline"
            className="h-12"
            onClick={() => placeBet("dozen", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 3)}
            disabled={isSpinning}
          >
            1st 12
          </Button>
          <Button
            variant="outline"
            className="h-12"
            onClick={() => placeBet("dozen", [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24], 3)}
            disabled={isSpinning}
          >
            2nd 12
          </Button>
          <Button
            variant="outline"
            className="h-12"
            onClick={() => placeBet("dozen", [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36], 3)}
            disabled={isSpinning}
          >
            3rd 12
          </Button>
        </div>

        <div className="col-span-3 grid grid-cols-6 gap-1">
          <Button
            variant="outline"
            className="h-12"
            onClick={() => placeBet("eighteen", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18], 2)}
            disabled={isSpinning}
          >
            1-18
          </Button>
          <Button
            variant="outline"
            className="h-12"
            onClick={() =>
              placeBet("even-odd", [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36], 2)
            }
            disabled={isSpinning}
          >
            Even
          </Button>
          <Button
            variant="outline"
            className={`h-12 ${getColorClass("red")}`}
            onClick={() => {
              const redNumbers = rouletteNumbers.filter((n) => n.color === "red").map((n) => n.number)
              placeBet("red-black", redNumbers, 2)
            }}
            disabled={isSpinning}
          >
            Red
          </Button>
          <Button
            variant="outline"
            className={`h-12 ${getColorClass("black")}`}
            onClick={() => {
              const blackNumbers = rouletteNumbers.filter((n) => n.color === "black").map((n) => n.number)
              placeBet("red-black", blackNumbers, 2)
            }}
            disabled={isSpinning}
          >
            Black
          </Button>
          <Button
            variant="outline"
            className="h-12"
            onClick={() => placeBet("even-odd", [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35], 2)}
            disabled={isSpinning}
          >
            Odd
          </Button>
          <Button
            variant="outline"
            className="h-12"
            onClick={() =>
              placeBet("eighteen", [19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36], 2)
            }
            disabled={isSpinning}
          >
            19-36
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Roulette</CardTitle>
            <Badge variant="outline" className="text-lg py-1">
              Balance: ${playerBalance.toFixed(2)}
            </Badge>
          </div>
          <CardDescription>Place your bets and try your luck on the roulette wheel</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="space-y-6">
            {/* Winning number display */}
            <div className="flex flex-col items-center justify-center">
              <h3 className="text-lg font-semibold mb-2">Current Number</h3>
              {winningNumber ? (
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${getColorClass(winningNumber.color)}`}
                >
                  {winningNumber.number}
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-2xl font-bold">
                  ?
                </div>
              )}
            </div>

            {/* Previous numbers */}
            <div>
              <h3 className="text-sm font-medium mb-2">Previous Numbers</h3>
              <div className="flex gap-1 overflow-x-auto pb-2">
                {previousNumbers.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No previous spins</div>
                ) : (
                  previousNumbers.map((num, index) => (
                    <div
                      key={index}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getColorClass(num.color)}`}
                    >
                      {num.number}
                    </div>
                  ))
                )}
              </div>
            </div>

            <Separator />

            {/* Bet amount selection */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Bet Amount</h3>
              <div className="flex flex-wrap gap-2">
                {betPresets.map((preset) => (
                  <Button
                    key={preset.amount}
                    variant={currentBet === preset.amount ? "default" : "outline"}
                    onClick={() => setCurrentBet(preset.amount)}
                    disabled={isSpinning || preset.amount > playerBalance - totalBetAmount}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Roulette board */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Roulette Board</h3>
              <Tabs defaultValue="inside" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="inside">Inside Bets</TabsTrigger>
                  <TabsTrigger value="outside">Outside Bets</TabsTrigger>
                </TabsList>
                <TabsContent value="inside" className="pt-4">
                  {renderRouletteBoard()}
                </TabsContent>
                <TabsContent value="outside" className="pt-4">
                  {renderRouletteBoard()}
                </TabsContent>
              </Tabs>
            </div>

            {/* Current bets */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">Current Bets</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearBets}
                  disabled={isSpinning || placedBets.length === 0}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Clear All
                </Button>
              </div>

              {placedBets.length === 0 ? (
                <div className="text-sm text-muted-foreground p-4 text-center bg-muted rounded-md">
                  No bets placed yet
                </div>
              ) : (
                <div className="space-y-2">
                  {placedBets.map((bet, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-muted rounded-md">
                      <div>
                        <span className="font-medium">{bet.type.charAt(0).toUpperCase() + bet.type.slice(1)}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          {bet.numbers.length > 6 ? `${bet.numbers.length} numbers` : bet.numbers.join(", ")}
                        </span>
                      </div>
                      <Badge variant="secondary">${bet.amount.toFixed(2)}</Badge>
                    </div>
                  ))}

                  <div className="flex justify-between items-center p-2 bg-primary/10 rounded-md">
                    <span className="font-bold">Total Bet</span>
                    <span className="font-bold">${totalBetAmount.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Game result message */}
            {message && (
              <Alert
                className={
                  message.includes("won") ? "bg-green-500/10 border-green-500/20" : "bg-blue-500/10 border-blue-500/20"
                }
              >
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="font-medium">{message}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>

        <CardFooter>
          <Button className="w-full" size="lg" onClick={spinWheel} disabled={isSpinning || totalBetAmount <= 0}>
            {isSpinning ? (
              <>
                <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                Spinning...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Spin Wheel
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

