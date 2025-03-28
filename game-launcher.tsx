"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import BlackjackGame from "./blackjack-game"
import RouletteGame from "./roulette-game"
import DarkPumpDumpCrash from "./dark-pump-dump-crash"
import PokerGame from "./poker-game"
import BerryFlipper from "./berry-flipper"
import EnhancedSlotsGame from "./enhanced-slots-game"
import CryptoPredictionGame from "./crypto-prediction-game"
import { Dices, TrendingUp, CircleDot, Coins, Cherry, PlugIcon, BarChart } from "lucide-react"
import Image from "next/image"
import AppLayout from "./app-layout"

export default function GameLauncher() {
  const [activeGame, setActiveGame] = useState<string | null>(null)

  // Games array with placeholder images
  const games = [
    {
      id: "crypto-prediction",
      name: "Crypto Prediction",
      description: "Predict if crypto prices will go up or down in 60 seconds",
      icon: <BarChart className="w-6 h-6" />,
      component: <CryptoPredictionGame />,
      badge: "New",
      image: "/placeholder.svg?height=160&width=320",
    },
    {
      id: "crash",
      name: "Pump & Dump Crash",
      description: "Place your bet and cash out before the dump!",
      icon: <TrendingUp className="w-6 h-6" />,
      component: <DarkPumpDumpCrash />,
      badge: "Popular",
      image: "/placeholder.svg?height=160&width=320",
    },
    {
      id: "berry-flipper",
      name: "Berry Flipper",
      description: "Choose red or blue berry and flip to win!",
      icon: <Cherry className="w-6 h-6" />,
      component: <BerryFlipper />,
      badge: "New",
      image: "/placeholder.svg?height=160&width=320",
    },
    {
      id: "slots",
      name: "Bearish Slots",
      description: "Spin to match symbols and win big!",
      icon: <PlugIcon className="w-6 h-6" />,
      component: <EnhancedSlotsGame />,
      badge: "New",
      image: "/placeholder.svg?height=160&width=320",
    },
    {
      id: "blackjack",
      name: "Blackjack",
      description: "Try to beat the dealer without going over 21",
      icon: <CircleDot className="w-6 h-6" />,
      component: <BlackjackGame />,
      badge: "Classic",
      image: "/placeholder.svg?height=160&width=320",
    },
    {
      id: "roulette",
      name: "Roulette",
      description: "Place your bets and try your luck on the roulette wheel",
      icon: <Dices className="w-6 h-6" />,
      component: <RouletteGame />,
      badge: null,
      image: "/placeholder.svg?height=160&width=320",
    },
    {
      id: "poker",
      name: "Video Poker",
      description: "Jacks or Better - Draw poker game",
      icon: <Coins className="w-6 h-6" />,
      component: <PokerGame />,
      badge: null,
      image: "/placeholder.svg?height=160&width=320",
    },
  ]

  if (activeGame) {
    const game = games.find((g) => g.id === activeGame)
    if (!game) return null

    return (
      <AppLayout>
        <div className="container mx-auto p-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">{game.name}</h1>
            <Button
              variant="outline"
              onClick={() => setActiveGame(null)}
              className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
            >
              Back to Games
            </Button>
          </div>
          {game.component}
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-4">
        <div className="w-full h-32 bg-zinc-800 relative overflow-hidden mb-6 rounded-lg">
          <Image src="/images/bearish-banner.png" alt="Bearish Banner" fill className="object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center gap-4">
              <Image src="/images/bearish-logo.png" alt="Bearish Logo" width={60} height={60} />
              <h1 className="text-4xl font-bold text-white">Bearish Casinos</h1>
            </div>
          </div>
        </div>

        <Tabs defaultValue="all" className="mb-6">
          <TabsList className="bg-zinc-800">
            <TabsTrigger value="all" className="data-[state=active]:bg-zinc-700">
              All Games
            </TabsTrigger>
            <TabsTrigger value="popular" className="data-[state=active]:bg-zinc-700">
              Popular
            </TabsTrigger>
            <TabsTrigger value="new" className="data-[state=active]:bg-zinc-700">
              New
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {games.map((game) => (
                <GameCard key={game.id} game={game} onPlay={() => setActiveGame(game.id)} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="popular" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {games
                .filter((game) => game.badge === "Popular")
                .map((game) => (
                  <GameCard key={game.id} game={game} onPlay={() => setActiveGame(game.id)} />
                ))}
            </div>
          </TabsContent>

          <TabsContent value="new" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {games
                .filter((game) => game.badge === "New")
                .map((game) => (
                  <GameCard key={game.id} game={game} onPlay={() => setActiveGame(game.id)} />
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}

function GameCard({ game, onPlay }) {
  return (
    <Card className="overflow-hidden bg-zinc-900 border-zinc-800 group hover:border-zinc-700 transition-all">
      <div className="h-40 bg-zinc-800 relative overflow-hidden">
        {game.image ? (
          <Image
            src={game.image || "/placeholder.svg"}
            alt={game.name}
            fill
            className="object-cover opacity-80 group-hover:opacity-100 transition-all group-hover:scale-105"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            {game.icon}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent"></div>
      </div>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-white">{game.name}</CardTitle>
          {game.badge && (
            <Badge
              variant={game.badge === "New" ? "default" : "outline"}
              className={game.badge === "New" ? "bg-blue-600" : ""}
            >
              {game.badge}
            </Badge>
          )}
        </div>
        <CardDescription className="text-zinc-400">{game.description}</CardDescription>
      </CardHeader>
      <CardFooter>
        <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={onPlay}>
          Play Now
        </Button>
      </CardFooter>
    </Card>
  )
}

