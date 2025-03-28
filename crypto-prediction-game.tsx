"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Clock,
  History,
  Coins,
  RefreshCw,
  Timer,
  ArrowRight,
} from "lucide-react"
import Image from "next/image"
import { useAbstractWallet } from "./abstract-wallet-provider"

// Crypto asset type
type CryptoAsset = {
  id: string
  name: string
  symbol: string
  price: number
  change24h: number
  icon: string
  chart: { x: number; y: number }[]
}

// Prediction type
type Prediction = "up" | "down" | null

// Game round type
type GameRound = {
  id: number
  asset: CryptoAsset
  startPrice: number
  endPrice: number | null
  prediction: Prediction
  betAmount: number
  result: "win" | "loss" | "pending"
  timestamp: number
  multiplier: number
}

export default function CryptoPredictionGame() {
  // Wallet integration
  const { wallet, sendTransaction } = useAbstractWallet()

  // Game state
  const [playerBalance, setPlayerBalance] = useState(1000)
  const [ethBalance, setEthBalance] = useState(0)
  const [betAmount, setBetAmount] = useState(10)
  const [selectedAsset, setSelectedAsset] = useState<CryptoAsset | null>(null)
  const [prediction, setPrediction] = useState<Prediction>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [roundTimeLeft, setRoundTimeLeft] = useState(0)
  const [gameHistory, setGameHistory] = useState<GameRound[]>([])
  const [message, setMessage] = useState("")
  const [cryptoAssets, setCryptoAssets] = useState<CryptoAsset[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currency, setCurrency] = useState<"usd" | "eth">("usd")
  const [activeRound, setActiveRound] = useState<GameRound | null>(null)

  // Canvas ref for chart visualization
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Timer ref
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Update ETH balance when wallet changes
  useEffect(() => {
    if (wallet) {
      setEthBalance(wallet.balance.eth)
    } else {
      setEthBalance(0)
    }
  }, [wallet])

  // Initialize game
  useEffect(() => {
    // Load crypto assets
    loadCryptoAssets()

    // Load game history
    const savedHistory = localStorage.getItem("crypto-prediction-history")
    if (savedHistory) {
      try {
        setGameHistory(JSON.parse(savedHistory))
      } catch (e) {
        localStorage.removeItem("crypto-prediction-history")
      }
    }

    // Check for active round
    const savedRound = localStorage.getItem("crypto-prediction-active-round")
    if (savedRound) {
      try {
        const round = JSON.parse(savedRound)
        if (round && new Date(round.timestamp + 60000) > new Date()) {
          setActiveRound(round)
          setIsPlaying(true)
          startRoundTimer(round.timestamp)
        } else {
          localStorage.removeItem("crypto-prediction-active-round")
        }
      } catch (e) {
        localStorage.removeItem("crypto-prediction-active-round")
      }
    }

    // Clean up on unmount
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // Update chart when selected asset changes
  useEffect(() => {
    if (selectedAsset) {
      drawChart()
    }
  }, [selectedAsset])

  // Save game history when it changes
  useEffect(() => {
    if (gameHistory.length > 0) {
      localStorage.setItem("crypto-prediction-history", JSON.stringify(gameHistory))
    }
  }, [gameHistory])

  // Save active round when it changes
  useEffect(() => {
    if (activeRound) {
      localStorage.setItem("crypto-prediction-active-round", JSON.stringify(activeRound))
    } else {
      localStorage.removeItem("crypto-prediction-active-round")
    }
  }, [activeRound])

  // Load crypto assets
  const loadCryptoAssets = () => {
    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      const assets: CryptoAsset[] = [
        {
          id: "bitcoin",
          name: "Bitcoin",
          symbol: "BTC",
          price: 65432.1,
          change24h: 2.5,
          icon: "/images/eth-token.png", // Using ETH icon as placeholder
          chart: generateRandomChart(24, 60000, 70000),
        },
        {
          id: "ethereum",
          name: "Ethereum",
          symbol: "ETH",
          price: 3456.78,
          change24h: -1.2,
          icon: "/images/eth-token.png",
          chart: generateRandomChart(24, 3000, 4000),
        },
        {
          id: "solana",
          name: "Solana",
          symbol: "SOL",
          price: 123.45,
          change24h: 5.7,
          icon: "/images/eth-token.png", // Using ETH icon as placeholder
          chart: generateRandomChart(24, 100, 150),
        },
        {
          id: "cardano",
          name: "Cardano",
          symbol: "ADA",
          price: 0.45,
          change24h: -0.8,
          icon: "/images/eth-token.png", // Using ETH icon as placeholder
          chart: generateRandomChart(24, 0.4, 0.5),
        },
      ]

      setCryptoAssets(assets)
      setSelectedAsset(assets[0])
      setIsLoading(false)
    }, 1000)
  }

  // Generate random chart data
  const generateRandomChart = (points: number, min: number, max: number) => {
    const data: { x: number; y: number }[] = []

    for (let i = 0; i < points; i++) {
      data.push({
        x: i / (points - 1),
        y: min + Math.random() * (max - min),
      })
    }

    return data
  }

  // Draw chart
  const drawChart = () => {
    if (!selectedAsset || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Set up dimensions
    const width = canvas.width
    const height = canvas.height
    const padding = 20
    const graphHeight = height - padding * 2
    const graphWidth = width - padding * 2

    // Draw background grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"
    ctx.lineWidth = 1

    // Vertical grid lines
    for (let i = 0; i <= 5; i++) {
      const x = padding + (i * graphWidth) / 5
      ctx.beginPath()
      ctx.moveTo(x, padding)
      ctx.lineTo(x, height - padding)
      ctx.stroke()
    }

    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = padding + (i * graphHeight) / 4
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(width - padding, y)
      ctx.stroke()
    }

    // Find min and max values in chart data
    const chartData = selectedAsset.chart
    let minValue = Number.POSITIVE_INFINITY
    let maxValue = Number.NEGATIVE_INFINITY

    for (const point of chartData) {
      minValue = Math.min(minValue, point.y)
      maxValue = Math.max(maxValue, point.y)
    }

    // Add some padding to min and max
    const valueRange = maxValue - minValue
    minValue = minValue - valueRange * 0.1
    maxValue = maxValue + valueRange * 0.1

    // Draw chart line
    ctx.beginPath()

    // Start at the first point
    const firstPoint = chartData[0]
    const startX = padding
    const startY = height - padding - ((firstPoint.y - minValue) / (maxValue - minValue)) * graphHeight
    ctx.moveTo(startX, startY)

    // Draw line through all points
    for (let i = 1; i < chartData.length; i++) {
      const point = chartData[i]
      const x = padding + point.x * graphWidth
      const y = height - padding - ((point.y - minValue) / (maxValue - minValue)) * graphHeight
      ctx.lineTo(x, y)
    }

    // Determine line color based on price change
    const lineColor = selectedAsset.change24h >= 0 ? "rgba(52, 211, 153, 0.8)" : "rgba(239, 68, 68, 0.8)"

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, selectedAsset.change24h >= 0 ? "rgba(52, 211, 153, 0.8)" : "rgba(239, 68, 68, 0.8)")
    gradient.addColorStop(1, selectedAsset.change24h >= 0 ? "rgba(52, 211, 153, 0.1)" : "rgba(239, 68, 68, 0.1)")

    // Draw line
    ctx.strokeStyle = lineColor
    ctx.lineWidth = 3
    ctx.stroke()

    // Fill area under the line
    const lastPoint = chartData[chartData.length - 1]
    const lastX = padding + lastPoint.x * graphWidth
    const lastY = height - padding - ((lastPoint.y - minValue) / (maxValue - minValue)) * graphHeight

    ctx.lineTo(lastX, height - padding)
    ctx.lineTo(startX, height - padding)
    ctx.closePath()

    ctx.fillStyle = gradient
    ctx.fill()

    // Draw price labels
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)"
    ctx.font = "10px sans-serif"
    ctx.textAlign = "left"

    // Max price
    ctx.fillText(`$${maxValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, 5, padding + 10)

    // Min price
    ctx.fillText(`$${minValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, 5, height - padding - 5)

    // Current price
    ctx.fillStyle = "white"
    ctx.font = "12px sans-serif"
    ctx.textAlign = "right"
    ctx.fillText(
      `$${selectedAsset.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
      width - padding - 5,
      padding + 15,
    )
  }

  // Start round timer
  const startRoundTimer = (startTimestamp: number) => {
    // Clear existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    // Calculate initial time left
    const endTime = startTimestamp + 60000 // 1 minute round
    const now = Date.now()
    const timeLeft = Math.max(0, endTime - now)
    setRoundTimeLeft(Math.ceil(timeLeft / 1000))

    // Start timer
    timerRef.current = setInterval(() => {
      const now = Date.now()
      const timeLeft = Math.max(0, endTime - now)
      setRoundTimeLeft(Math.ceil(timeLeft / 1000))

      // End round when timer reaches 0
      if (timeLeft <= 0) {
        clearInterval(timerRef.current!)
        endRound()
      }
    }, 1000)
  }

  // Start a new prediction round
  const startRound = async () => {
    if (!selectedAsset || prediction === null || betAmount <= 0) return

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

    // Create new round
    const newRound: GameRound = {
      id: Date.now(),
      asset: selectedAsset,
      startPrice: selectedAsset.price,
      endPrice: null,
      prediction: prediction,
      betAmount: betAmount,
      result: "pending",
      timestamp: Date.now(),
      multiplier: 1.95, // 95% payout (5% house edge)
    }

    // Update game state
    setActiveRound(newRound)
    setIsPlaying(true)
    setMessage(`Prediction placed! ${prediction === "up" ? "🚀" : "📉"} Waiting for result...`)

    // Start timer
    startRoundTimer(newRound.timestamp)
  }

  // End the current round
  const endRound = () => {
    if (!activeRound) return

    // Simulate price change
    const priceChange = (Math.random() * 10 - 5) / 100 // -5% to +5%
    const newPrice = activeRound.startPrice * (1 + priceChange)

    // Determine result
    const priceWentUp = newPrice > activeRound.startPrice
    const playerWon =
      (activeRound.prediction === "up" && priceWentUp) || (activeRound.prediction === "down" && !priceWentUp)

    // Update round
    const completedRound: GameRound = {
      ...activeRound,
      endPrice: newPrice,
      result: playerWon ? "win" : "loss",
    }

    // Update game history
    setGameHistory((prev) => [completedRound, ...prev].slice(0, 10))

    // Update player balance if won
    if (playerWon) {
      const winnings = activeRound.betAmount * activeRound.multiplier

      if (currency === "eth") {
        setEthBalance((prev) => prev + winnings)
      } else {
        setPlayerBalance((prev) => prev + winnings)
      }

      setMessage(
        `You won! The price ${priceWentUp ? "increased" : "decreased"} to $${newPrice.toFixed(2)}. You earned ${currency === "eth" ? winnings.toFixed(4) + " ETH" : "$" + winnings.toFixed(2)}.`,
      )
    } else {
      setMessage(`You lost! The price ${priceWentUp ? "increased" : "decreased"} to $${newPrice.toFixed(2)}.`)
    }

    // Reset game state
    setActiveRound(null)
    setIsPlaying(false)
    setPrediction(null)

    // Refresh crypto assets
    loadCryptoAssets()
  }

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-4xl mx-auto overflow-hidden bg-zinc-900 border-zinc-800">
        <div className="w-full h-16 bg-zinc-800 relative overflow-hidden">
          <Image src="/images/bearish-banner.png" alt="Bearish Banner" fill className="object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20"></div>
        </div>

        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Image src="/images/bearish-logo.png" alt="Bearish Logo" width={40} height={40} />
              <CardTitle className="text-white">Crypto Prediction</CardTitle>
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
                    <Coins className="h-4 w-4" />
                    USD
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Image src="/images/eth-token.png" alt="ETH" width={16} height={16} />
                    ETH
                  </span>
                )}
              </Button>
            </div>
          </div>
          <CardDescription className="text-zinc-400">
            Predict if the price will go up or down in the next minute!
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              {/* Asset selector */}
              <div className="mb-4">
                <Label className="text-zinc-300 mb-2 block">Select Crypto Asset</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {cryptoAssets.map((asset) => (
                    <Button
                      key={asset.id}
                      variant="outline"
                      className={`border-zinc-700 ${selectedAsset?.id === asset.id ? "bg-zinc-700" : "bg-zinc-800"} hover:bg-zinc-700`}
                      onClick={() => setSelectedAsset(asset)}
                      disabled={isPlaying}
                    >
                      <div className="flex items-center gap-2">
                        <Image src={asset.icon || "/placeholder.svg"} alt={asset.name} width={16} height={16} />
                        <span className="text-zinc-300">{asset.symbol}</span>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Price chart */}
              <div className="relative h-64 bg-zinc-800 rounded-lg overflow-hidden border border-zinc-700 mb-4">
                {selectedAsset ? (
                  <>
                    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

                    <div className="absolute top-2 left-2 flex items-center gap-2">
                      <Image
                        src={selectedAsset.icon || "/placeholder.svg"}
                        alt={selectedAsset.name}
                        width={24}
                        height={24}
                      />
                      <div>
                        <div className="text-white font-medium">{selectedAsset.name}</div>
                        <div className="text-sm flex items-center gap-1">
                          <span className="text-zinc-300">
                            ${selectedAsset.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </span>
                          <span className={selectedAsset.change24h >= 0 ? "text-green-500" : "text-red-500"}>
                            {selectedAsset.change24h >= 0 ? "+" : ""}
                            {selectedAsset.change24h.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {isPlaying && activeRound && (
                      <div className="absolute top-2 right-2 bg-zinc-900/80 px-3 py-1 rounded-full flex items-center gap-1">
                        <Timer className="w-4 h-4 text-zinc-300" />
                        <span className="text-zinc-300 font-mono">{formatTime(roundTimeLeft)}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <RefreshCw className="w-8 h-8 text-zinc-500 animate-spin" />
                  </div>
                )}
              </div>

              {/* Active prediction */}
              {isPlaying && activeRound && (
                <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700 mb-4">
                  <h3 className="text-zinc-300 font-medium mb-2">Active Prediction</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={activeRound.prediction === "up" ? "bg-green-500" : "bg-red-500"}>
                        {activeRound.prediction === "up" ? (
                          <TrendingUp className="w-3 h-3 mr-1" />
                        ) : (
                          <TrendingDown className="w-3 h-3 mr-1" />
                        )}
                        {activeRound.prediction === "up" ? "UP" : "DOWN"}
                      </Badge>
                      <span className="text-zinc-300">
                        {currency === "eth"
                          ? activeRound.betAmount.toFixed(4) + " ETH"
                          : "$" + activeRound.betAmount.toFixed(2)}
                      </span>
                      <ArrowRight className="w-4 h-4 text-zinc-500" />
                      <span className="text-zinc-300">
                        Potential win:{" "}
                        {currency === "eth"
                          ? (activeRound.betAmount * activeRound.multiplier).toFixed(4) + " ETH"
                          : "$" + (activeRound.betAmount * activeRound.multiplier).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-zinc-400" />
                      <span className="text-zinc-300">{formatTime(roundTimeLeft)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Game history */}
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center text-zinc-300">
                  <History className="w-4 h-4 mr-1" />
                  Prediction History
                </h3>
                {gameHistory.length === 0 ? (
                  <div className="text-center text-zinc-500 p-4 bg-zinc-800 rounded-lg border border-zinc-700">
                    No prediction history yet
                  </div>
                ) : (
                  <div className="bg-zinc-800 rounded-lg border border-zinc-700 overflow-hidden">
                    <div className="grid grid-cols-5 gap-2 p-2 text-xs font-medium text-zinc-400">
                      <div>Asset</div>
                      <div>Prediction</div>
                      <div>Amount</div>
                      <div>Result</div>
                      <div>Time</div>
                    </div>
                    <div className="divide-y divide-zinc-700">
                      {gameHistory.map((round) => (
                        <div key={round.id} className="grid grid-cols-5 gap-2 p-2 text-sm text-zinc-300">
                          <div className="flex items-center gap-1">
                            <Image
                              src={round.asset.icon || "/placeholder.svg"}
                              alt={round.asset.name}
                              width={16}
                              height={16}
                            />
                            <span>{round.asset.symbol}</span>
                          </div>
                          <div>
                            <Badge
                              className={
                                round.prediction === "up"
                                  ? "bg-green-500/20 text-green-500 border-green-500/20"
                                  : "bg-red-500/20 text-red-500 border-red-500/20"
                              }
                            >
                              {round.prediction === "up" ? "UP" : "DOWN"}
                            </Badge>
                          </div>
                          <div>
                            {currency === "eth"
                              ? round.betAmount.toFixed(4) + " ETH"
                              : "$" + round.betAmount.toFixed(2)}
                          </div>
                          <div>
                            {round.result === "pending" ? (
                              <Badge variant="outline" className="bg-zinc-700 text-zinc-300 border-zinc-600">
                                Pending
                              </Badge>
                            ) : round.result === "win" ? (
                              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                                Win
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                                Loss
                              </Badge>
                            )}
                          </div>
                          <div className="text-zinc-400">{new Date(round.timestamp).toLocaleTimeString()}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {/* Prediction controls */}
              <div>
                <Label className="text-zinc-300 mb-2 block">Your Prediction</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    className={`bg-green-600 hover:bg-green-700 text-white ${prediction === "up" ? "ring-2 ring-green-400" : ""}`}
                    onClick={() => setPrediction("up")}
                    disabled={isPlaying}
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    UP
                  </Button>
                  <Button
                    className={`bg-red-600 hover:bg-red-700 text-white ${prediction === "down" ? "ring-2 ring-red-400" : ""}`}
                    onClick={() => setPrediction("down")}
                    disabled={isPlaying}
                  >
                    <TrendingDown className="w-4 h-4 mr-2" />
                    DOWN
                  </Button>
                </div>
              </div>

              {/* Bet amount */}
              <div>
                <Label htmlFor="bet-amount" className="text-zinc-300">
                  Bet Amount
                </Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="bet-amount"
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(Number(e.target.value))}
                    disabled={isPlaying}
                    className="flex-1 bg-zinc-800 border-zinc-700 text-zinc-300"
                  />
                  <Button
                    variant="outline"
                    onClick={() => setBetAmount((prev) => Math.max(1, prev / 2))}
                    disabled={isPlaying}
                    className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                  >
                    ½
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setBetAmount((prev) => Math.min(currency === "usd" ? playerBalance : ethBalance, prev * 2))
                    }
                    disabled={isPlaying}
                    className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                  >
                    2×
                  </Button>
                </div>
              </div>

              {/* Preset amounts */}
              <div className="grid grid-cols-3 gap-2">
                {[10, 50, 100].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                    onClick={() => setBetAmount(amount)}
                    disabled={isPlaying}
                  >
                    {currency === "eth" ? amount / 100 : amount}
                  </Button>
                ))}
              </div>

              {/* Payout info */}
              <div className="bg-zinc-800 p-3 rounded-lg border border-zinc-700">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-zinc-400">Payout Multiplier</span>
                  <span className="text-zinc-300 font-medium">1.95x</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Potential Win</span>
                  <span className="text-zinc-300 font-medium">
                    {currency === "eth" ? (betAmount * 1.95).toFixed(4) + " ETH" : "$" + (betAmount * 1.95).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Place prediction button */}
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
                onClick={startRound}
                disabled={
                  isPlaying ||
                  !selectedAsset ||
                  prediction === null ||
                  betAmount <= 0 ||
                  (currency === "usd" ? betAmount > playerBalance : betAmount > ethBalance) ||
                  (currency === "eth" && !wallet)
                }
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Place Prediction"
                )}
              </Button>

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

              {/* Game rules */}
              <div className="bg-zinc-800 p-3 rounded-lg border border-zinc-700">
                <h3 className="text-zinc-300 font-medium mb-2">How to Play</h3>
                <ol className="text-sm text-zinc-400 space-y-1 list-decimal list-inside">
                  <li>Select a crypto asset</li>
                  <li>Predict if the price will go UP or DOWN</li>
                  <li>Enter your bet amount</li>
                  <li>Wait 1 minute for the result</li>
                  <li>Win 1.95x your bet if correct!</li>
                </ol>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

