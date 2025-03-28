"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, RotateCw, History, TrendingUp, Flame } from "lucide-react"
import Image from "next/image"

type BetChoice = "red" | "blue"
type FlipResult = "red" | "blue" | null

export default function BerryFlipper() {
  // Game state
  const [playerBalance, setPlayerBalance] = useState(1000)
  const [betAmount, setBetAmount] = useState(10)
  const [playerChoice, setPlayerChoice] = useState<BetChoice | null>(null)
  const [isFlipping, setIsFlipping] = useState(false)
  const [flipResult, setFlipResult] = useState<FlipResult>(null)
  const [message, setMessage] = useState("")
  const [flipHistory, setFlipHistory] = useState<FlipResult[]>([])
  const [showResult, setShowResult] = useState(false)
  const [flipRotation, setFlipRotation] = useState(0)
  const [streakCount, setStreakCount] = useState(0)

  // Refs for animation
  const flipIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const flipTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Bet presets
  const betPresets = [5, 10, 25, 50, 100, 250]

  // Handle bet amount change
  const changeBetAmount = (amount: number) => {
    if (isFlipping) return
    setBetAmount(amount)
  }

  // Handle player choice
  const makeChoice = (choice: BetChoice) => {
    if (isFlipping) return
    setPlayerChoice(choice)
  }

  // Flip the berry
  const flipBerry = () => {
    if (isFlipping || !playerChoice || betAmount <= 0 || betAmount > playerBalance) return

    // Deduct bet amount
    setPlayerBalance((prev) => prev - betAmount)

    // Start flipping animation
    setIsFlipping(true)
    setShowResult(false)
    setMessage("")

    // Simulate berry flipping with rotation
    let rotationCount = 0

    flipIntervalRef.current = setInterval(() => {
      setFlipRotation((prev) => prev + 180)
      rotationCount++

      // Show alternating berries during flip
      setFlipResult(rotationCount % 2 === 0 ? "red" : "blue")
    }, 150)

    // Determine result after a random time
    const flipDuration = 1000 + Math.random() * 1000

    flipTimeoutRef.current = setTimeout(() => {
      if (flipIntervalRef.current) {
        clearInterval(flipIntervalRef.current)
      }

      // Determine result (50/50 chance)
      const result: FlipResult = Math.random() < 0.5 ? "red" : "blue"
      setFlipResult(result)
      setShowResult(true)

      // Update history
      setFlipHistory((prev) => [result, ...prev].slice(0, 10))

      // Check if player won
      const playerWon = playerChoice === result

      // Update streak
      if (playerWon) {
        setStreakCount((prev) => prev + 1)
      } else {
        setStreakCount(0)
      }

      // Calculate winnings with streak bonus
      let winnings = 0
      let streakBonus = 0

      if (playerWon) {
        // Base winnings (2x)
        winnings = betAmount * 2

        // Add streak bonus for consecutive wins (max 50% bonus)
        if (streakCount > 0) {
          streakBonus = Math.min(0.5, streakCount * 0.1) * betAmount
          winnings += streakBonus
        }

        setPlayerBalance((prev) => prev + winnings)
        setMessage(
          `You won ${streakBonus > 0 ? `$${winnings.toFixed(2)} (includes ${(streakBonus).toFixed(2)} streak bonus)` : `$${winnings.toFixed(2)}`}!`,
        )
      } else {
        setMessage(`You lost $${betAmount.toFixed(2)}. Try again!`)
      }

      setIsFlipping(false)
    }, flipDuration)
  }

  // Clean up intervals and timeouts
  useEffect(() => {
    return () => {
      if (flipIntervalRef.current) clearInterval(flipIntervalRef.current)
      if (flipTimeoutRef.current) clearTimeout(flipTimeoutRef.current)
    }
  }, [])

  // Calculate stats
  const redCount = flipHistory.filter((result) => result === "red").length
  const blueCount = flipHistory.filter((result) => result === "blue").length
  const redPercentage = flipHistory.length > 0 ? (redCount / flipHistory.length) * 100 : 0
  const bluePercentage = flipHistory.length > 0 ? (blueCount / flipHistory.length) * 100 : 0

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-4xl mx-auto overflow-hidden">
        <div className="w-full h-16 bg-[#74C480] relative overflow-hidden">
          <Image src="/images/bearish-banner.png" alt="Bearish Banner" fill className="object-cover" />
        </div>

        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Image src="/images/bearish-logo.png" alt="Bearish Logo" width={40} height={40} />
              <CardTitle>Berry Flipper</CardTitle>
            </div>
            <Badge variant="outline" className="text-lg py-1">
              Balance: ${playerBalance.toFixed(2)}
            </Badge>
          </div>
          <CardDescription>Choose red or blue berry and flip to win!</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col items-center justify-center">
              <h3 className="text-lg font-semibold mb-4">Choose Your Berry</h3>

              <div className="flex gap-6 mb-6">
                <div
                  className={`relative cursor-pointer transition-all ${playerChoice === "red" ? "scale-110 ring-4 ring-[#E36F6F] ring-opacity-50 rounded-full" : "opacity-80 hover:opacity-100"}`}
                  onClick={() => makeChoice("red")}
                >
                  <Image src="/images/red-berry.png" alt="Red Berry" width={120} height={120} />
                  <Badge className="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-[#E36F6F]">2x</Badge>
                </div>

                <div
                  className={`relative cursor-pointer transition-all ${playerChoice === "blue" ? "scale-110 ring-4 ring-[#859DFF] ring-opacity-50 rounded-full" : "opacity-80 hover:opacity-100"}`}
                  onClick={() => makeChoice("blue")}
                >
                  <Image src="/images/blue-berry.png" alt="Blue Berry" width={120} height={120} />
                  <Badge className="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-[#859DFF]">2x</Badge>
                </div>
              </div>

              <div className="w-full space-y-4">
                <h3 className="text-sm font-medium">Bet Amount</h3>
                <div className="flex flex-wrap gap-2">
                  {betPresets.map((amount) => (
                    <Button
                      key={amount}
                      variant={betAmount === amount ? "default" : "outline"}
                      onClick={() => changeBetAmount(amount)}
                      disabled={isFlipping}
                      className={betAmount === amount ? "bg-[#74C480] hover:bg-[#74C480]/90" : ""}
                    >
                      ${amount}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <h3 className="text-lg font-semibold mb-4">Flip Result</h3>

              <div className="relative w-40 h-40 flex items-center justify-center mb-6">
                {!showResult ? (
                  <div
                    className="w-full h-full transition-all duration-150"
                    style={{ transform: `rotateY(${flipRotation}deg)` }}
                  >
                    {flipRotation % 360 < 180 ? (
                      <Image
                        src="/images/red-berry.png"
                        alt="Red Berry"
                        width={160}
                        height={160}
                        className="absolute top-0 left-0 w-full h-full"
                      />
                    ) : (
                      <Image
                        src="/images/blue-berry.png"
                        alt="Blue Berry"
                        width={160}
                        height={160}
                        className="absolute top-0 left-0 w-full h-full"
                        style={{ transform: "rotateY(180deg)" }}
                      />
                    )}
                  </div>
                ) : (
                  flipResult && (
                    <Image
                      src={flipResult === "red" ? "/images/red-berry.png" : "/images/blue-berry.png"}
                      alt={flipResult === "red" ? "Red Berry" : "Blue Berry"}
                      width={160}
                      height={160}
                      className="animate-bounce"
                    />
                  )
                )}

                {!flipResult && !isFlipping && (
                  <div className="text-center text-muted-foreground">Choose a berry and flip</div>
                )}
              </div>

              {streakCount > 0 && (
                <Badge className="mb-4 bg-[#74C480]">
                  <Flame className="w-3 h-3 mr-1" />
                  Win Streak: {streakCount}
                </Badge>
              )}

              <Button
                className="w-full mb-4 bg-[#74C480] hover:bg-[#74C480]/90"
                size="lg"
                onClick={flipBerry}
                disabled={isFlipping || !playerChoice || betAmount <= 0 || betAmount > playerBalance}
              >
                {isFlipping ? (
                  <>
                    <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                    Flipping...
                  </>
                ) : (
                  "Flip Berry"
                )}
              </Button>

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

          <Separator className="my-6" />

          <Tabs defaultValue="history">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="history">Flip History</TabsTrigger>
              <TabsTrigger value="stats">Statistics</TabsTrigger>
            </TabsList>

            <TabsContent value="history" className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <History className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">Recent Flips</h3>
              </div>

              {flipHistory.length === 0 ? (
                <div className="text-center text-muted-foreground p-4">No flip history yet</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {flipHistory.map((result, index) => (
                    <div key={index} className="relative w-10 h-10">
                      <Image
                        src={result === "red" ? "/images/red-berry.png" : "/images/blue-berry.png"}
                        alt={result === "red" ? "Red Berry" : "Blue Berry"}
                        width={40}
                        height={40}
                      />
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="stats" className="pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 relative">
                      <Image src="/images/red-berry.png" alt="Red Berry" fill />
                    </div>
                    <h3 className="font-medium">Red Berries</h3>
                  </div>
                  <div className="text-2xl font-bold">{redCount}</div>
                  <div className="text-sm text-muted-foreground">{redPercentage.toFixed(1)}%</div>
                </div>

                <div className="bg-muted rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 relative">
                      <Image src="/images/blue-berry.png" alt="Blue Berry" fill />
                    </div>
                    <h3 className="font-medium">Blue Berries</h3>
                  </div>
                  <div className="text-2xl font-bold">{blueCount}</div>
                  <div className="text-sm text-muted-foreground">{bluePercentage.toFixed(1)}%</div>
                </div>

                <div className="col-span-2 bg-muted rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4" />
                    <h3 className="font-medium">Win Streak Bonus</h3>
                  </div>
                  <div className="text-sm">
                    <p>Win multiple times in a row to earn streak bonuses:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>2 wins: +10% bonus</li>
                      <li>3 wins: +20% bonus</li>
                      <li>4 wins: +30% bonus</li>
                      <li>5+ wins: +50% bonus</li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

