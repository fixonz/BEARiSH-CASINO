"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

// Debug utility function to log game state changes
const debugLog = (message, data) => {
  if (process.env.NODE_ENV === "development") {
    console.log(`[CrashGame Debug] ${message}`, data)
  }
}

export default function CrashGameDebugger() {
  const [gameState, setGameState] = useState({
    isPlaying: false,
    currentMultiplier: 1.0,
    isCrashed: false,
    betAmount: 0,
    autoCashout: 0,
    lastCrashPoint: 0,
    serverSeed: "",
    clientSeed: "",
    networkLatency: 0,
    renderFPS: 0,
    lastServerResponse: null,
    errors: [],
  })

  const canvasRef = useRef(null)
  const animationFrameRef = useRef(null)
  const lastFrameTimeRef = useRef(performance.now())
  const fpsCounterRef = useRef(0)
  const fpsTimerRef = useRef(0)

  // Simulate game issues
  const simulateIssues = {
    networkLatency: () => {
      setGameState((prev) => ({
        ...prev,
        networkLatency: Math.floor(Math.random() * 500),
      }))
    },

    crashEarly: () => {
      setGameState((prev) => ({
        ...prev,
        isCrashed: true,
        lastCrashPoint: prev.currentMultiplier,
        errors: [...prev.errors, "Game crashed unexpectedly at " + prev.currentMultiplier.toFixed(2) + "x"],
      }))
    },

    seedMismatch: () => {
      setGameState((prev) => ({
        ...prev,
        serverSeed: "0x" + Math.random().toString(16).substring(2, 10),
        errors: [...prev.errors, "Server seed verification failed"],
      }))
    },

    renderLag: () => {
      // Simulate CPU-intensive operation
      const start = performance.now()
      while (performance.now() - start < 200) {
        // Intentional blocking code to simulate lag
        Math.sqrt(Math.random() * 10000000)
      }
    },
  }

  // Debug animation loop
  useEffect(() => {
    const updateFPS = () => {
      const now = performance.now()
      const delta = now - lastFrameTimeRef.current
      lastFrameTimeRef.current = now

      fpsCounterRef.current++
      fpsTimerRef.current += delta

      if (fpsTimerRef.current >= 1000) {
        setGameState((prev) => ({
          ...prev,
          renderFPS: fpsCounterRef.current,
        }))
        fpsCounterRef.current = 0
        fpsTimerRef.current = 0
      }

      // Render debug visualization
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext("2d")
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Draw crash curve
        ctx.beginPath()
        ctx.moveTo(0, canvas.height)

        const maxX = canvas.width
        const maxY = canvas.height

        for (let x = 0; x < maxX; x++) {
          const progress = x / maxX
          const multiplier = gameState.isCrashed
            ? progress < 0.8
              ? 1 + Math.pow(1.06, progress * 30)
              : gameState.lastCrashPoint
            : 1 + Math.pow(1.06, progress * 30)

          const y = maxY - (multiplier - 1) * (maxY / 10)
          ctx.lineTo(x, Math.max(0, y))
        }

        ctx.strokeStyle = gameState.isCrashed ? "red" : "green"
        ctx.lineWidth = 2
        ctx.stroke()

        // Draw current position
        if (!gameState.isCrashed) {
          const currentX = ((gameState.currentMultiplier - 1) / 10) * maxX
          const currentY = maxY - (gameState.currentMultiplier - 1) * (maxY / 10)

          ctx.beginPath()
          ctx.arc(currentX, currentY, 5, 0, Math.PI * 2)
          ctx.fillStyle = "blue"
          ctx.fill()
        }

        // Draw auto cashout line if set
        if (gameState.autoCashout > 1) {
          const cashoutY = maxY - (gameState.autoCashout - 1) * (maxY / 10)
          ctx.beginPath()
          ctx.moveTo(0, cashoutY)
          ctx.lineTo(maxX, cashoutY)
          ctx.strokeStyle = "orange"
          ctx.setLineDash([5, 5])
          ctx.lineWidth = 1
          ctx.stroke()
          ctx.setLineDash([])
        }
      }

      animationFrameRef.current = requestAnimationFrame(updateFPS)
    }

    animationFrameRef.current = requestAnimationFrame(updateFPS)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [gameState])

  // Clean up errors after 5 seconds
  useEffect(() => {
    if (gameState.errors.length > 0) {
      const timer = setTimeout(() => {
        setGameState((prev) => ({
          ...prev,
          errors: prev.errors.slice(1),
        }))
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [gameState.errors])

  const handleStartGame = () => {
    setGameState((prev) => ({
      ...prev,
      isPlaying: true,
      isCrashed: false,
      currentMultiplier: 1.0,
      lastCrashPoint: 0,
      serverSeed: "0x" + Math.random().toString(16).substring(2, 10),
      clientSeed: "0x" + Math.random().toString(16).substring(2, 10),
    }))

    // Start the multiplier growth
    const growthInterval = setInterval(() => {
      setGameState((prev) => {
        if (prev.isCrashed) {
          clearInterval(growthInterval)
          return prev
        }

        const newMultiplier = prev.currentMultiplier * 1.01

        // Random crash chance increases with multiplier
        const crashChance = (newMultiplier - 1) * 0.01
        if (Math.random() < crashChance) {
          clearInterval(growthInterval)
          return {
            ...prev,
            isCrashed: true,
            lastCrashPoint: newMultiplier,
          }
        }

        return {
          ...prev,
          currentMultiplier: newMultiplier,
        }
      })
    }, 100)

    // Clean up
    return () => clearInterval(growthInterval)
  }

  const handleCashout = () => {
    setGameState((prev) => ({
      ...prev,
      isPlaying: false,
    }))

    debugLog("Player cashed out", {
      multiplier: gameState.currentMultiplier,
      betAmount: gameState.betAmount,
      winnings: gameState.betAmount * gameState.currentMultiplier,
    })
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">CrashGame Debugger</h1>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-2">Game Visualization</h2>
          <canvas ref={canvasRef} width={500} height={300} className="w-full h-[300px] bg-muted rounded-md" />

          <div className="flex gap-2 mt-4">
            {!gameState.isPlaying ? (
              <Button onClick={handleStartGame}>Start Game</Button>
            ) : (
              <Button onClick={handleCashout} variant="destructive">
                Cash Out ({gameState.currentMultiplier.toFixed(2)}x)
              </Button>
            )}
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-2">Debug Controls</h2>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <Button variant="outline" onClick={simulateIssues.networkLatency}>
              Simulate Network Latency
            </Button>
            <Button variant="outline" onClick={simulateIssues.crashEarly}>
              Simulate Early Crash
            </Button>
            <Button variant="outline" onClick={simulateIssues.seedMismatch}>
              Simulate Seed Mismatch
            </Button>
            <Button variant="outline" onClick={simulateIssues.renderLag}>
              Simulate Render Lag
            </Button>
          </div>

          <h3 className="font-medium mt-4 mb-2">Game State</h3>
          <div className="bg-muted p-2 rounded-md text-sm font-mono h-[200px] overflow-auto">
            <pre>{JSON.stringify(gameState, null, 2)}</pre>
          </div>

          <h3 className="font-medium mt-4 mb-2">Performance Metrics</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between p-2 bg-muted rounded-md">
              <span>FPS:</span>
              <span className={gameState.renderFPS < 30 ? "text-red-500" : "text-green-500"}>
                {gameState.renderFPS}
              </span>
            </div>
            <div className="flex justify-between p-2 bg-muted rounded-md">
              <span>Network Latency:</span>
              <span className={gameState.networkLatency > 100 ? "text-red-500" : "text-green-500"}>
                {gameState.networkLatency}ms
              </span>
            </div>
          </div>
        </Card>
      </div>

      {gameState.errors.length > 0 && (
        <div className="mt-4 space-y-2">
          {gameState.errors.map((error, index) => (
            <Alert variant="destructive" key={index}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      <div className="mt-6 bg-muted p-4 rounded-md">
        <h2 className="text-lg font-semibold mb-2">Common CrashGame Issues & Fixes</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Multiplier Growth Rate:</strong> Ensure the growth curve is exponential (not linear) for realistic
            gameplay.
          </li>
          <li>
            <strong>Crash Point Calculation:</strong> Verify server-side crash point generation is using cryptographic
            randomness.
          </li>
          <li>
            <strong>Animation Performance:</strong> Use requestAnimationFrame instead of setInterval for smoother
            animations.
          </li>
          <li>
            <strong>Network Latency:</strong> Implement client-side prediction to handle server communication delays.
          </li>
          <li>
            <strong>Fairness Verification:</strong> Ensure provably fair algorithms with seed verification.
          </li>
          <li>
            <strong>Mobile Responsiveness:</strong> Test on various screen sizes and optimize touch interactions.
          </li>
          <li>
            <strong>Memory Leaks:</strong> Clean up event listeners and intervals when component unmounts.
          </li>
        </ul>
      </div>
    </div>
  )
}

