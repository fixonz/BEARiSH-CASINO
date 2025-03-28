"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Trophy, Users, Clock, Calendar, ChevronRight, Flame, Zap, Award, Crown, Coins } from "lucide-react"

export default function TournamentSystem() {
  const [activeTab, setActiveTab] = useState("active")

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Tournaments</h1>
          <p className="text-muted-foreground">Compete against other players for big prizes</p>
        </div>
        <Button>
          <Trophy className="w-4 h-4 mr-2" />
          My Tournaments
        </Button>
      </div>

      <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-6 mt-6">
          <FeaturedTournament />

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeTournaments.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-6 mt-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingTournaments.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-6 mt-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedTournaments.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function FeaturedTournament() {
  return (
    <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20 mb-2">
              <Flame className="w-3 h-3 mr-1" /> Featured
            </Badge>
            <CardTitle className="text-2xl">Weekend Crypto Showdown</CardTitle>
            <CardDescription>The biggest tournament of the month with massive prizes</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">$25,000</div>
            <div className="text-sm text-muted-foreground">Prize Pool</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-muted-foreground" />
              <div>
                <div className="font-medium">128/256 Players</div>
                <Progress value={50} className="h-2" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <div>
                <div className="font-medium">Ends in 1 day 6 hours</div>
                <Progress value={65} className="h-2" />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              <Badge variant="secondary">Crash Game</Badge>
              <Badge variant="secondary">Blackjack</Badge>
              <Badge variant="secondary">Roulette</Badge>
              <Badge variant="secondary">Poker</Badge>
            </div>
          </div>

          <div className="space-y-4">
            <div className="font-semibold">Top Players</div>
            <div className="space-y-2">
              {[
                { name: "CryptoKing", score: 12500, position: 1 },
                { name: "BlockchainMaster", score: 10200, position: 2 },
                { name: "LuckyPlayer", score: 9800, position: 3 },
              ].map((player, i) => (
                <div key={i} className="flex items-center justify-between bg-background/50 p-2 rounded-md">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 flex items-center justify-center">
                      {player.position === 1 ? (
                        <Crown className="w-5 h-5 text-yellow-500" />
                      ) : player.position === 2 ? (
                        <Award className="w-5 h-5 text-gray-400" />
                      ) : (
                        <Award className="w-5 h-5 text-amber-700" />
                      )}
                    </div>
                    <Avatar className="w-6 h-6">
                      <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{player.name}</span>
                  </div>
                  <span>{player.score.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" size="lg">
          <Zap className="w-4 h-4 mr-2" />
          Join Tournament
        </Button>
      </CardFooter>
    </Card>
  )
}

function TournamentCard({ tournament }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            {tournament.status === "active" && (
              <Badge variant="default" className="bg-green-500/10 text-green-500 border-green-500/20 mb-2">
                Active
              </Badge>
            )}
            {tournament.status === "upcoming" && (
              <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 mb-2">
                <Calendar className="w-3 h-3 mr-1" /> Upcoming
              </Badge>
            )}
            {tournament.status === "completed" && (
              <Badge variant="outline" className="bg-gray-500/10 text-gray-500 border-gray-500/20 mb-2">
                Completed
              </Badge>
            )}
            <CardTitle>{tournament.name}</CardTitle>
          </div>
          <div className="text-right">
            <div className="flex items-center text-amber-500">
              <Coins className="w-4 h-4 mr-1" />
              <span className="font-bold">${tournament.prizePool.toLocaleString()}</span>
            </div>
          </div>
        </div>
        <CardDescription>{tournament.description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-1 text-muted-foreground" />
              <span>
                {tournament.players}/{tournament.maxPlayers} Players
              </span>
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1 text-muted-foreground" />
              <span>{tournament.timeRemaining}</span>
            </div>
          </div>
          <Progress value={(tournament.players / tournament.maxPlayers) * 100} className="h-1" />
        </div>

        <div className="flex flex-wrap gap-1 mt-3">
          {tournament.games.map((game, i) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {game}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" size="sm">
          View Details
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </CardFooter>
    </Card>
  )
}

// Sample data
const activeTournaments = [
  {
    id: 1,
    name: "Daily Crypto Rush",
    description: "Fast-paced daily tournament with quick rewards",
    prizePool: 5000,
    players: 64,
    maxPlayers: 128,
    timeRemaining: "5 hours left",
    status: "active",
    games: ["Crash Game", "Roulette"],
  },
  {
    id: 2,
    name: "High Rollers Club",
    description: "Exclusive tournament for serious players",
    prizePool: 10000,
    players: 32,
    maxPlayers: 64,
    timeRemaining: "2 days left",
    status: "active",
    games: ["Blackjack", "Poker"],
  },
  {
    id: 3,
    name: "Newcomers Welcome",
    description: "Perfect for beginners with smaller buy-ins",
    prizePool: 1000,
    players: 45,
    maxPlayers: 100,
    timeRemaining: "1 day left",
    status: "active",
    games: ["Crash Game", "Slots"],
  },
]

const upcomingTournaments = [
  {
    id: 4,
    name: "Weekend Warrior",
    description: "Weekend-long competition with multiple games",
    prizePool: 7500,
    players: 0,
    maxPlayers: 200,
    timeRemaining: "Starts in 2 days",
    status: "upcoming",
    games: ["Crash Game", "Blackjack", "Roulette"],
  },
  {
    id: 5,
    name: "Crypto Masters",
    description: "Monthly tournament with the biggest prize pool",
    prizePool: 50000,
    players: 0,
    maxPlayers: 500,
    timeRemaining: "Starts in 5 days",
    status: "upcoming",
    games: ["All Games"],
  },
]

const completedTournaments = [
  {
    id: 6,
    name: "Last Week's Showdown",
    description: "The weekly tournament with great prizes",
    prizePool: 15000,
    players: 128,
    maxPlayers: 128,
    timeRemaining: "Ended 2 days ago",
    status: "completed",
    games: ["Crash Game", "Blackjack", "Roulette"],
  },
  {
    id: 7,
    name: "February Championship",
    description: "Monthly championship with massive prizes",
    prizePool: 30000,
    players: 256,
    maxPlayers: 256,
    timeRemaining: "Ended 1 week ago",
    status: "completed",
    games: ["All Games"],
  },
]

