"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, AlertCircle, Clock, BarChart3, History, Users } from "lucide-react"
import Image from "next/image"

export default function PumpDumpCrash() {
  // Game state
  const [playerBalance, setPlayerBalance] = useState(1000)
  const [betAmount, setBetAmount] = useState(10)
  const [autoCashout, setAutoCashout] = useState(2.0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0)
  const [isCrashed, setIsCrashed] = useState(false)
  const [isWaiting, setIsWaiting] = useState(false)
  const [gameHistory, setGameHistory] = useState<number[]>([1.2, 3.5, 1.1, 7.2, 2.3, 1.5, 4.2, 1.8, 2.7, 1.3])
  const [message, setMessage] = useState("")
  const [activePlayers, setActivePlayers] = useState<{ name: string; bet: number; cashout: number | null }[]>([])
  const [chartData, setChartData] = useState<{ x: number; y: number }[]>([])
  const [pumpPhase, setPumpPhase] = useState(true)

  // Canvas ref for game visualization
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Animation frame ref
  const animationFrameRef = useRef<number | null>(null)

  // Game timer refs
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null)
  const multiplierIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize game
  useEffect(() => {
    // Generate some fake active players
    generateActivePlayers()

    // Set up canvas
    setupCanvas()

    // Clean up on unmount
    return () => {
      if (gameTimerRef.current) clearTimeout(gameTimerRef.current)
      if (multiplierIntervalRef.current) clearInterval(multiplierIntervalRef.current)
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    }
  }, [])

  // Update canvas when game state changes
  useEffect(() => {
    drawGameState()
  }, [currentMultiplier, isCrashed, chartData])

  // Set up canvas
  const setupCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Set canvas dimensions
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Initial draw
    drawGameState()
  }

  // Draw game state on canvas
  const drawGameState = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Set up dimensions
    const width = canvas.width
    const height = canvas.height
    const padding = 20
    const graphHeight = height - padding * 2
    const graphWidth = width - padding * 2

    // Draw background
    ctx.fillStyle = "rgba(0, 0, 0, 0.05)"
    ctx.fillRect(0, 0, width, height)

    // Draw grid lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"
    ctx.lineWidth = 1

    // Horizontal grid lines (multiplier levels)
    for (let i = 1; i <= 5; i++) {
      const y = height - (i * graphHeight) / 5 - padding
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(width - padding, y)
      ctx.stroke()

      // Draw multiplier labels
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)"
      ctx.font = "10px sans-serif"
      ctx.textAlign = "left"
      ctx.fillText(`${i}x`, 5, y + 3)
    }

    // Draw chart data
    if (chartData.length > 0) {
      ctx.beginPath()

      // Start at the first point
      const firstPoint = chartData[0]
      const startX = padding + firstPoint.x * graphWidth
      const startY = height - padding - (firstPoint.y * graphHeight) / 5
      ctx.moveTo(startX, startY)

      // Draw line through all points
      for (let i = 1; i < chartData.length; i++) {
        const point = chartData[i]
        const x = padding + point.x * graphWidth
        const y = height - padding - (point.y * graphHeight) / 5
        ctx.lineTo(x, y)
      }

      // Set line style based on pump/dump phase
      if (isCrashed) {
        ctx.strokeStyle = "rgba(239, 68, 68, 0.8)"
      } else if (pumpPhase) {
        ctx.strokeStyle = "rgba(52, 211, 153, 0.8)"
      } else {
        ctx.strokeStyle = "rgba(239, 68, 68, 0.8)"
      }

      ctx.lineWidth = 2
      ctx.stroke()

      // Draw current position
      const lastPoint = chartData[chartData.length - 1]
      const lastX = padding + lastPoint.x * graphWidth
      const lastY = height - padding - (lastPoint.y * graphHeight) / 5

      ctx.beginPath()
      ctx.arc(lastX, lastY, 5, 0, Math.PI * 2)
      ctx.fillStyle = isCrashed ? "rgb(239, 68, 68)" : pumpPhase ? "rgb(52, 211, 153)" : "rgb(239, 68, 68)"
      ctx.fill()
    }

    // Draw auto cashout line if set and playing
    if (isPlaying && autoCashout > 1) {
      const y = height - padding - ((autoCashout - 1) * graphHeight) / (Math.max(5, currentMultiplier) - 1)

      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(width - padding, y)
      ctx.strokeStyle = "rgba(251, 191, 36, 0.8)"
      ctx.setLineDash([5, 5])
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.setLineDash([])

      // Draw auto cashout label
      ctx.fillStyle = "rgba(251, 191, 36, 0.8)"
      ctx.font = "10px sans-serif"
      ctx.textAlign = "right"
      ctx.fillText(`Auto: ${autoCashout.toFixed(2)}x`, width - padding - 5, y - 5)
    }

    // Draw current multiplier
    ctx.font = isCrashed ? "48px sans-serif" : "36px sans-serif"
    ctx.textAlign = "center"
    ctx.fillStyle = isCrashed ? "rgb(239, 68, 68)" : pumpPhase ? "rgb(52, 211, 153)" : "rgb(239, 68, 68)"
    ctx.fillText(isCrashed ? "CRASHED" : `${currentMultiplier.toFixed(2)}x`, width / 2, height / 2)

    if (isCrashed) {
      ctx.font = "24px sans-serif"
      ctx.fillText(`@${currentMultiplier.toFixed(2)}x`, width / 2, height / 2 + 30)
    }
  }

  // Generate fake active players
  const generateActivePlayers = () => {
    const names = [
      "CryptoKing",
      "LuckyPlayer",
      "BetMaster",
      "CasinoWhale",
      "FortuneSeeker",
      "BlockchainBaron",
      "TokenTiger",
      "DiamondHands",
    ]
    const players = []

    const count = 5 + Math.floor(Math.random() * 5)

    for (let i = 0; i < count; i++) {
      const name = names[Math.floor(Math.random() * names.length)]
      const bet = Math.floor((10 + Math.random() * 990) / 10) * 10

      players.push({
        name: `${name}${Math.floor(Math.random() * 100)}`,
        bet,
        cashout: null,
      })
    }

    setActivePlayers(players)
  }

  // Start a new game round
  const startGame = () => {
    if (betAmount <= 0 || betAmount > playerBalance) return

    // Reset game state
    setIsPlaying(true)
    setIsCrashed(false)
    setCurrentMultiplier(1.0)
    setMessage("")
    setPumpPhase(true)
    setChartData([{ x: 0, y: 1 }])

    // Deduct bet amount
    setPlayerBalance((prev) => prev - betAmount)

    // Start waiting phase
    setIsWaiting(true)

    // Simulate other players placing bets
    generateActivePlayers()

    // Wait for game to start
    gameTimerRef.current = setTimeout(() => {
      setIsWaiting(false)

      // Determine when to switch from pump to dump phase
      const pumpDuration = 10 + Math.random() * 20 // 10-30 seconds
      const maxMultiplier = 1.5 + Math.random() * 8.5 // 1.5-10x

      let timeElapsed = 0
      let lastChartUpdate = 0

      // Start increasing multiplier
      multiplierIntervalRef.current = setInterval(() => {
        timeElapsed += 0.1

        // Update multiplier based on phase
        setCurrentMultiplier((prev) => {
          let newMultiplier = prev

          if (pumpPhase) {
            // Pump phase - exponential growth
            newMultiplier = 1 + Math.pow(1.06, timeElapsed * 3)

            // Check if we should switch to dump phase
            if (timeElapsed >= pumpDuration || newMultiplier >= maxMultiplier) {
              setPumpPhase(false)
            }
          } else {
            // Dump phase - rapid decline
            const declineRate = 0.1 + Math.random() * 0.2 // 10-30% decline per tick
            newMultiplier = prev * (1 - declineRate * 0.1)

            // Check for crash
            if (newMultiplier <= 1.0 || Math.random() < 0.1) {
              handleCrash(newMultiplier)
              return newMultiplier
            }
          }

          // Update chart data (less frequently to avoid too many points)
          if (timeElapsed - lastChartUpdate >= 0.2) {
            lastChartUpdate = timeElapsed
            setChartData((prev) => [
              ...prev,
              {
                x: Math.min(1, timeElapsed / 30), // Normalize x to 0-1
                y: newMultiplier,
              },
            ])
          }

          // Check for auto cashout
          if (isPlaying && autoCashout > 0 && newMultiplier >= autoCashout) {
            handleCashout()
          }

          // Simulate other players cashing out
          simulatePlayerCashouts(newMultiplier)

          return newMultiplier
        })
      }, 100)
    }, 3000)
  }

  // Handle player cashout
  const handleCashout = () => {
    if (!isPlaying || isCrashed) return

    // Calculate winnings
    const winnings = betAmount * currentMultiplier

    // Update balance
    setPlayerBalance((prev) => prev + winnings)

    // Update message
    setMessage(`You cashed out at ${currentMultiplier.toFixed(2)}x and won $${winnings.toFixed(2)}!`)

    // Update game state
    setIsPlaying(false)
  }

  // Handle game crash
  const handleCrash = (crashPoint: number) => {
    // Clear interval
    if (multiplierIntervalRef.current) {
      clearInterval(multiplierIntervalRef.current)
      multiplierIntervalRef.current = null
    }

    // Update game state
    setIsCrashed(true)
    setPumpPhase(false)

    // If player didn't cash out, they lose
    if (isPlaying) {
      setIsPlaying(false)
      setMessage(`Game crashed at ${crashPoint.toFixed(2)}x! You lost $${betAmount.toFixed(2)}.`)
    }

    // Add to game history
    setGameHistory((prev) => [crashPoint, ...prev].slice(0, 10))

    // Start new round after delay
    gameTimerRef.current = setTimeout(() => {
      setIsCrashed(false)
      setCurrentMultiplier(1.0)
      setIsWaiting(false)
      setChartData([])
    }, 3000)
  }

  // Simulate other players cashing out
  const simulatePlayerCashouts = (multiplier: number) => {
    setActivePlayers((prev) =>
      prev.map((player) => {
        if (player.cashout === null) {
          // Higher chance to cash out during dump phase
          const cashoutChance = pumpPhase ? 0.03 : 0.1
          if (Math.random() < cashoutChance) {
            return { ...player, cashout: multiplier }
          }
        }
        return player
      }),
    )
  }

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
              <CardTitle>Pump & Dump Crash</CardTitle>
            </div>
            <Badge variant="outline" className="text-lg py-1">
              Balance: ${playerBalance.toFixed(2)}
            </Badge>
          </div>
          <CardDescription>Place your bet and cash out before the dump!</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              {/* Game visualization */}
              <div className="relative h-64 bg-muted rounded-lg overflow-hidden">
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

                {isWaiting && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="text-center">
                      <Clock className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                      <p className="text-lg font-bold">Starting soon...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Game history */}
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2 flex items-center">
                  <History className="w-4 h-4 mr-1" />
                  Game History
                </h3>
                <div className="flex flex-wrap gap-2">
                  {gameHistory.map((crash, index) => (
                    <Badge
                      key={index}
                      variant={crash < 2 ? "destructive" : crash > 5 ? "default" : "outline"}
                      className={crash > 5 ? "bg-green-500/10 text-green-500 border-green-500/20" : ""}
                    >
                      {crash.toFixed(2)}x
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* Betting controls */}
              <div>
                <Label htmlFor="bet-amount">Bet Amount</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="bet-amount"
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(Number(e.target.value))}
                    disabled={isPlaying || isWaiting}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={() => setBetAmount((prev) => Math.max(1, prev / 2))}
                    disabled={isPlaying || isWaiting}
                  >
                    ½
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setBetAmount((prev) => Math.min(playerBalance, prev * 2))}
                    disabled={isPlaying || isWaiting}
                  >
                    2×
                  </Button>
                </div>
              </div>

              {/* Auto cashout */}
              <div>
                <Label htmlFor="auto-cashout">Auto Cashout at</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="auto-cashout"
                    type="number"
                    step="0.1"
                    value={autoCashout}
                    onChange={(e) => setAutoCashout(Number(e.target.value))}
                    disabled={isPlaying || isWaiting}
                    className="flex-1"
                  />
                  <span className="flex items-center">×</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-2">
                {!isPlaying ? (
                  <Button
                    className="w-full bg-[#74C480] hover:bg-[#74C480]/90"
                    size="lg"
                    onClick={startGame}
                    disabled={isWaiting || isCrashed || betAmount <= 0 || betAmount > playerBalance}
                  >
                    {isWaiting ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-pulse" />
                        Waiting...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Place Bet
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    size="lg"
                    variant="destructive"
                    onClick={handleCashout}
                    disabled={isCrashed}
                  >
                    Cash Out ({(betAmount * currentMultiplier).toFixed(2)})
                  </Button>
                )}
              </div>

              {/* Game message */}
              {message && (
                <Alert
                  className={
                    message.includes("won")
                      ? "bg-green-500/10 text-green-500 border-green-500/20"
                      : message.includes("lost")
                        ? "bg-red-500/10 text-red-500 border-red-500/20"
                        : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                  }
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          {/* Active players */}
          <div className="mt-6">
            <h3 className="text-sm font-medium mb-2 flex items-center">
              <Users className="w-4 h-4 mr-1" />
              Active Players
            </h3>
            <div className="bg-muted rounded-lg overflow-hidden">
              <div className="grid grid-cols-3 gap-4 p-2 text-xs font-medium text-muted-foreground">
                <div>Player</div>
                <div>Bet</div>
                <div>Cashout</div>
              </div>
              <div className="divide-y divide-border">
                {activePlayers.map((player, index) => (
                  <div key={index} className="grid grid-cols-3 gap-4 p-2 text-sm">
                    <div>{player.name}</div>
                    <div>${player.bet.toFixed(2)}</div>
                    <div>
                      {player.cashout ? (
                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                          {player.cashout.toFixed(2)}×
                        </Badge>
                      ) : (
                        <Badge variant="outline">In Game</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter>
          <Tabs defaultValue="stats" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="stats">Your Stats</TabsTrigger>
              <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            </TabsList>
            <TabsContent value="stats" className="p-4 bg-card rounded-lg mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Total Bets</div>
                    <div className="font-medium">42</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Highest Multiplier</div>
                    <div className="font-medium">7.32×</div>
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="leaderboard" className="p-4 bg-card rounded-lg mt-2">
              <div className="text-sm text-muted-foreground text-center">Leaderboard updates daily</div>
            </TabsContent>
          </Tabs>
        </CardFooter>
      </Card>
    </div>
  )
}

