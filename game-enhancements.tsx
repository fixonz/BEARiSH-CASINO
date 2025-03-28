"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Coins, TrendingUp, TrendingDown, BarChart3, Clock } from "lucide-react"

// This is a sample enhancement for the CrashGame component
export default function EnhancedCrashGame() {
  const [betAmount, setBetAmount] = useState<number>(10)
  const [autoCashout, setAutoCashout] = useState<number>(2.0)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.0)
  const [isCrashed, setIsCrashed] = useState<boolean>(false)
  const [gameHistory, setGameHistory] = useState<number[]>([1.2, 3.5, 1.1, 7.2, 2.3])
  const [userBalance, setUserBalance] = useState<number>(1000)
  const [timer, setTimer] = useState<number>(0)
  const [bettingPhase, setBettingPhase] = useState<boolean>(true)

  // Simulate game progression
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isPlaying && !isCrashed) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 0.1)

        // Simulate multiplier growth with random crash point
        const newMultiplier = 1 + Math.pow(1.06, timer)
        setCurrentMultiplier(Number.parseFloat(newMultiplier.toFixed(2)))

        // Check for auto cashout
        if (newMultiplier >= autoCashout && !isCrashed) {
          handleCashout()
        }

        // Random crash simulation
        if (Math.random() < 0.01 * timer && !isCrashed) {
          handleCrash()
        }
      }, 100)
    }

    return () => clearInterval(interval)
  }, [isPlaying, isCrashed, timer, autoCashout])

  const startNewRound = () => {
    setBettingPhase(true)
    setIsCrashed(false)
    setCurrentMultiplier(1.0)
    setTimer(0)

    // Add previous crash point to history
    if (currentMultiplier > 1) {
      setGameHistory((prev) => [currentMultiplier, ...prev].slice(0, 10))
    }

    // Start betting phase timer
    setTimeout(() => {
      setBettingPhase(false)
    }, 5000)
  }

  const handleBet = () => {
    if (betAmount > userBalance) return

    setUserBalance((prev) => prev - betAmount)
    setIsPlaying(true)
  }

  const handleCashout = () => {
    if (!isPlaying || isCrashed) return

    const winnings = betAmount * currentMultiplier
    setUserBalance((prev) => prev + winnings)
    setIsPlaying(false)
  }

  const handleCrash = () => {
    setIsCrashed(true)
    setIsPlaying(false)

    // Start new round after delay
    setTimeout(startNewRound, 3000)
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Crash Game</CardTitle>
            <Badge variant={bettingPhase ? "outline" : "default"} className="text-lg py-1">
              {bettingPhase ? (
                <>
                  <Clock className="w-4 h-4 mr-1" /> Betting Phase
                </>
              ) : isCrashed ? (
                <>
                  <TrendingDown className="w-4 h-4 mr-1 text-red-500" /> Crashed!
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4 mr-1 text-green-500" /> Live
                </>
              )}
            </Badge>
          </div>
          <CardDescription>Place your bet and cash out before the crash!</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="relative h-64 bg-muted rounded-lg overflow-hidden">
                {/* Game visualization area */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className={`text-5xl font-bold transition-all ${isCrashed ? "text-red-500" : "text-green-500"}`}>
                    {currentMultiplier.toFixed(2)}x
                  </div>
                </div>

                {/* Multiplier graph would go here */}
                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {gameHistory.map((crash, index) => (
                  <Badge key={index} variant={crash > 2 ? "default" : "destructive"}>
                    {crash.toFixed(2)}x
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="balance">Your Balance</Label>
                <div className="flex items-center mt-1">
                  <Coins className="w-5 h-5 mr-2 text-yellow-500" />
                  <div className="text-xl font-semibold">{userBalance.toFixed(2)}</div>
                </div>
              </div>

              <div>
                <Label htmlFor="bet-amount">Bet Amount</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="bet-amount"
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(Number(e.target.value))}
                    disabled={isPlaying}
                  />
                  <Button variant="outline" onClick={() => setBetAmount((prev) => prev * 2)} disabled={isPlaying}>
                    2x
                  </Button>
                  <Button variant="outline" onClick={() => setBetAmount((prev) => prev / 2)} disabled={isPlaying}>
                    ½
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="auto-cashout">Auto Cashout at</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="auto-cashout"
                    type="number"
                    step="0.1"
                    value={autoCashout}
                    onChange={(e) => setAutoCashout(Number(e.target.value))}
                    disabled={isPlaying}
                  />
                  <span className="flex items-center">x</span>
                </div>
              </div>

              <div className="pt-2">
                {!isPlaying ? (
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleBet}
                    disabled={isCrashed || betAmount <= 0 || betAmount > userBalance}
                  >
                    Place Bet
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
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8">
        <Tabs defaultValue="history">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="history">Game History</TabsTrigger>
            <TabsTrigger value="stats">Your Stats</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>
          <TabsContent value="history" className="p-4 bg-card rounded-lg mt-2">
            <h3 className="text-lg font-semibold mb-2">Recent Games</h3>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                  <div className="flex items-center">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    <span>Game #{i + 1}</span>
                  </div>
                  <Badge variant={Math.random() > 0.5 ? "default" : "destructive"}>
                    {(1 + Math.random() * 10).toFixed(2)}x
                  </Badge>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="stats" className="p-4 bg-card rounded-lg mt-2">
            <h3 className="text-lg font-semibold mb-2">Your Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="text-sm">Total Bets</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">42</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="text-sm">Win Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">64%</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="text-sm">Biggest Win</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">1,245.00</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="text-sm">Profit/Loss</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-500">+320.50</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="leaderboard" className="p-4 bg-card rounded-lg mt-2">
            <h3 className="text-lg font-semibold mb-2">Top Players</h3>
            <div className="space-y-2">
              {["Crypto_King", "LuckyPlayer", "BetMaster", "CasinoWhale", "FortuneSeeker"].map((name, i) => (
                <div key={i} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                  <div className="flex items-center">
                    <span className="w-6 text-center font-bold">{i + 1}</span>
                    <span className="ml-2">{name}</span>
                  </div>
                  <span className="font-semibold">{(10000 - i * 1500).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

