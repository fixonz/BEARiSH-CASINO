"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Users, Wifi, WifiOff, Clock, BarChart, Play, Pause, AlertTriangle, Zap } from "lucide-react"

export default function MultiplayerDebugger() {
  const [activeTab, setActiveTab] = useState("network")
  const [isSimulating, setIsSimulating] = useState(false)
  const [simulationSpeed, setSimulationSpeed] = useState(1)
  const [playerCount, setPlayerCount] = useState(0)
  const [maxPlayers, setMaxPlayers] = useState(100)
  const [networkLatency, setNetworkLatency] = useState(0)
  const [packetLoss, setPacketLoss] = useState(0)
  const [serverLoad, setServerLoad] = useState(0)
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "unstable">("disconnected")
  const [events, setEvents] = useState<{ type: string; message: string; timestamp: number }[]>([])
  const [showLatencySpikes, setShowLatencySpikes] = useState(true)
  const [showDisconnects, setShowDisconnects] = useState(true)
  const [showReconnects, setShowReconnects] = useState(true)

  // Simulate multiplayer session
  useEffect(() => {
    if (!isSimulating) return

    const interval = setInterval(() => {
      // Simulate player count changes
      setPlayerCount((prev) => {
        const change = Math.random() > 0.7 ? Math.floor(Math.random() * 5) : 0
        const direction = Math.random() > 0.3 ? 1 : -1
        return Math.max(0, Math.min(maxPlayers, prev + change * direction))
      })

      // Simulate network conditions
      setNetworkLatency((prev) => {
        const baseLatency = 30 + Math.random() * 50
        const spike = Math.random() > 0.9 ? Math.random() * 200 : 0

        if (spike > 100 && showLatencySpikes) {
          addEvent("warning", `Latency spike detected: ${Math.floor(baseLatency + spike)}ms`)
        }

        return baseLatency + spike
      })

      setPacketLoss((prev) => {
        const baseLoss = Math.random() * 2
        const spike = Math.random() > 0.95 ? Math.random() * 10 : 0
        return baseLoss + spike
      })

      // Simulate server load
      setServerLoad((prev) => {
        const baseLoad = 20 + (playerCount / maxPlayers) * 50
        const spike = Math.random() > 0.9 ? Math.random() * 30 : 0
        return baseLoad + spike
      })

      // Simulate connection status changes
      if (Math.random() > 0.95) {
        const newStatus = Math.random() > 0.5 ? "disconnected" : "unstable"

        if (newStatus === "disconnected" && showDisconnects) {
          addEvent("error", "Connection lost to game server")
        } else if (newStatus === "unstable" && showDisconnects) {
          addEvent("error", "Connection lost to game server")
        } else if (newStatus === "unstable" && showLatencySpikes) {
          addEvent("warning", "Connection unstable, experiencing high latency")
        }

        setConnectionStatus(newStatus)
      } else if (Math.random() > 0.97 && connectionStatus !== "connected") {
        setConnectionStatus("connected")

        if (showReconnects) {
          addEvent("success", "Connection restored to game server")
        }
      }
    }, 1000 / simulationSpeed)

    return () => clearInterval(interval)
  }, [
    isSimulating,
    playerCount,
    maxPlayers,
    connectionStatus,
    showLatencySpikes,
    showDisconnects,
    showReconnects,
    simulationSpeed,
  ])

  const addEvent = (type: string, message: string) => {
    setEvents((prev) => [{ type, message, timestamp: Date.now() }, ...prev].slice(0, 50))
  }

  const startSimulation = () => {
    setIsSimulating(true)
    setConnectionStatus("connected")
    addEvent("info", "Multiplayer simulation started")
  }

  const stopSimulation = () => {
    setIsSimulating(false)
    setConnectionStatus("disconnected")
    addEvent("info", "Multiplayer simulation stopped")
  }

  const resetSimulation = () => {
    stopSimulation()
    setPlayerCount(0)
    setNetworkLatency(0)
    setPacketLoss(0)
    setServerLoad(0)
    setEvents([])
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Multiplayer System Debugger</h1>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Simulation Controls</CardTitle>
              <Badge
                variant={
                  connectionStatus === "connected"
                    ? "default"
                    : connectionStatus === "unstable"
                      ? "outline"
                      : "destructive"
                }
                className={
                  connectionStatus === "connected"
                    ? "bg-green-500/10 text-green-500 border-green-500/20"
                    : connectionStatus === "unstable"
                      ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                      : undefined
                }
              >
                {connectionStatus === "connected" && <Wifi className="w-3 h-3 mr-1" />}
                {connectionStatus === "unstable" && <AlertTriangle className="w-3 h-3 mr-1" />}
                {connectionStatus === "disconnected" && <WifiOff className="w-3 h-3 mr-1" />}
                {connectionStatus === "connected"
                  ? "Connected"
                  : connectionStatus === "unstable"
                    ? "Unstable"
                    : "Disconnected"}
              </Badge>
            </div>
            <CardDescription>Simulate and debug multiplayer functionality</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="network" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="network">Network</TabsTrigger>
                <TabsTrigger value="players">Players</TabsTrigger>
                <TabsTrigger value="server">Server</TabsTrigger>
              </TabsList>

              <TabsContent value="network" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Network Latency</Label>
                    <span
                      className={
                        networkLatency > 100
                          ? "text-red-500"
                          : networkLatency > 50
                            ? "text-yellow-500"
                            : "text-green-500"
                      }
                    >
                      {Math.floor(networkLatency)}ms
                    </span>
                  </div>
                  <Slider
                    value={[networkLatency]}
                    max={300}
                    step={1}
                    disabled={isSimulating}
                    onValueChange={(value) => setNetworkLatency(value[0])}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Packet Loss</Label>
                    <span
                      className={
                        packetLoss > 5 ? "text-red-500" : packetLoss > 2 ? "text-yellow-500" : "text-green-500"
                      }
                    >
                      {packetLoss.toFixed(1)}%
                    </span>
                  </div>
                  <Slider
                    value={[packetLoss]}
                    max={20}
                    step={0.1}
                    disabled={isSimulating}
                    onValueChange={(value) => setPacketLoss(value[0])}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="flex items-center space-x-2">
                    <Switch id="show-latency" checked={showLatencySpikes} onCheckedChange={setShowLatencySpikes} />
                    <Label htmlFor="show-latency">Show Latency Spikes</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch id="show-disconnects" checked={showDisconnects} onCheckedChange={setShowDisconnects} />
                    <Label htmlFor="show-disconnects">Show Disconnects</Label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="players" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Current Players</Label>
                    <span>
                      {playerCount} / {maxPlayers}
                    </span>
                  </div>
                  <Slider
                    value={[playerCount]}
                    max={maxPlayers}
                    step={1}
                    disabled={isSimulating}
                    onValueChange={(value) => setPlayerCount(value[0])}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Max Players</Label>
                    <span>{maxPlayers}</span>
                  </div>
                  <Slider
                    value={[maxPlayers]}
                    min={10}
                    max={500}
                    step={10}
                    disabled={isSimulating}
                    onValueChange={(value) => setMaxPlayers(value[0])}
                  />
                </div>

                <div className="pt-2">
                  <div className="flex items-center space-x-2">
                    <Switch id="show-reconnects" checked={showReconnects} onCheckedChange={setShowReconnects} />
                    <Label htmlFor="show-reconnects">Show Reconnects</Label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="server" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Server Load</Label>
                    <span
                      className={
                        serverLoad > 80 ? "text-red-500" : serverLoad > 60 ? "text-yellow-500" : "text-green-500"
                      }
                    >
                      {Math.floor(serverLoad)}%
                    </span>
                  </div>
                  <Slider
                    value={[serverLoad]}
                    max={100}
                    step={1}
                    disabled={isSimulating}
                    onValueChange={(value) => setServerLoad(value[0])}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Simulation Speed</Label>
                    <span>{simulationSpeed}x</span>
                  </div>
                  <Slider
                    value={[simulationSpeed]}
                    min={0.5}
                    max={5}
                    step={0.5}
                    onValueChange={(value) => setSimulationSpeed(value[0])}
                  />
                </div>

                <div className="pt-4 grid grid-cols-2 gap-2">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span>CCU</span>
                    </div>
                    <span>{playerCount}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span>Uptime</span>
                    </div>
                    <span>00:12:34</span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={resetSimulation}>
              Reset
            </Button>

            {!isSimulating ? (
              <Button onClick={startSimulation}>
                <Play className="w-4 h-4 mr-2" />
                Start Simulation
              </Button>
            ) : (
              <Button variant="destructive" onClick={stopSimulation}>
                <Pause className="w-4 h-4 mr-2" />
                Stop Simulation
              </Button>
            )}
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart className="w-5 h-5 mr-2" />
              Event Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] overflow-y-auto space-y-2">
              {events.length === 0 ? (
                <div className="text-center text-muted-foreground p-4">No events recorded yet</div>
              ) : (
                events.map((event, index) => (
                  <div
                    key={index}
                    className="text-sm border-l-2 pl-2 py-1"
                    style={{
                      borderColor:
                        event.type === "error"
                          ? "var(--destructive)"
                          : event.type === "warning"
                            ? "orange"
                            : event.type === "success"
                              ? "green"
                              : "var(--border)",
                    }}
                  >
                    <div className="flex justify-between">
                      <span>{event.message}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 bg-muted p-4 rounded-md">
        <h2 className="text-lg font-semibold mb-2">Common Multiplayer Issues & Fixes</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Network Latency:</strong> Implement client-side prediction and server reconciliation.
          </li>
          <li>
            <strong>Packet Loss:</strong> Use reliable UDP or TCP for critical game state, implement packet
            acknowledgment.
          </li>
          <li>
            <strong>Synchronization:</strong> Use a deterministic lockstep or snapshot interpolation approach.
          </li>
          <li>
            <strong>Scalability:</strong> Implement interest management to reduce network traffic per client.
          </li>
          <li>
            <strong>Cheating:</strong> Never trust the client, validate all game-changing actions server-side.
          </li>
          <li>
            <strong>Reconnection:</strong> Store session state and implement graceful reconnection handling.
          </li>
          <li>
            <strong>Cross-Platform:</strong> Use a consistent serialization format across all platforms.
          </li>
        </ul>

        <Alert className="mt-4 bg-blue-500/10 border-blue-500/20">
          <Zap className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-blue-500">
            <strong>Pro Tip:</strong> For casino games, always implement server-authoritative architecture where all
            random number generation and game logic happens server-side.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}

