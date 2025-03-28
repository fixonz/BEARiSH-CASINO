"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, RefreshCw, ChevronUp, ChevronDown } from "lucide-react"

// Card types
type Suit = "hearts" | "diamonds" | "clubs" | "spades"
type Rank = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A"
type PlayingCard = {
  suit: Suit
  rank: Rank
  held?: boolean
}

// Hand rankings
type HandRanking =
  | "Royal Flush"
  | "Straight Flush"
  | "Four of a Kind"
  | "Full House"
  | "Flush"
  | "Straight"
  | "Three of a Kind"
  | "Two Pair"
  | "Jacks or Better"
  | "Nothing"

// Payout table
const payoutTable: Record<HandRanking, number[]> = {
  "Royal Flush": [250, 500, 750, 1000, 4000],
  "Straight Flush": [50, 100, 150, 200, 250],
  "Four of a Kind": [25, 50, 75, 100, 125],
  "Full House": [9, 18, 27, 36, 45],
  Flush: [6, 12, 18, 24, 30],
  Straight: [4, 8, 12, 16, 20],
  "Three of a Kind": [3, 6, 9, 12, 15],
  "Two Pair": [2, 4, 6, 8, 10],
  "Jacks or Better": [1, 2, 3, 4, 5],
  Nothing: [0, 0, 0, 0, 0],
}

export default function PokerGame() {
  // Game state
  const [playerBalance, setPlayerBalance] = useState(1000)
  const [betAmount, setBetAmount] = useState(5)
  const [betLevel, setBetLevel] = useState(1)
  const [deck, setDeck] = useState<PlayingCard[]>([])
  const [playerHand, setPlayerHand] = useState<PlayingCard[]>([])
  const [gamePhase, setGamePhase] = useState<"betting" | "draw" | "result">("betting")
  const [isDealing, setIsDealing] = useState(false)
  const [handRanking, setHandRanking] = useState<HandRanking>("Nothing")
  const [winAmount, setWinAmount] = useState(0)
  const [message, setMessage] = useState("")

  // Initialize or reset the game
  const initializeGame = () => {
    const newDeck = createDeck()
    setDeck(newDeck)
    setPlayerHand([])
    setGamePhase("betting")
    setHandRanking("Nothing")
    setWinAmount(0)
    setMessage("")
  }

  // Create and shuffle a new deck
  const createDeck = (): PlayingCard[] => {
    const suits: Suit[] = ["hearts", "diamonds", "clubs", "spades"]
    const ranks: Rank[] = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"]

    const newDeck: PlayingCard[] = []

    for (const suit of suits) {
      for (const rank of ranks) {
        newDeck.push({
          suit,
          rank,
        })
      }
    }

    // Shuffle the deck
    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]]
    }

    return newDeck
  }

  // Deal initial hand
  const dealHand = () => {
    if (betAmount <= 0 || betAmount > playerBalance) return

    setIsDealing(true)
    setPlayerBalance((prev) => prev - betAmount)

    // Create a new deck
    const newDeck = createDeck()

    // Deal 5 cards
    const hand = newDeck.slice(0, 5)
    const remainingDeck = newDeck.slice(5)

    // Simulate dealing animation
    setTimeout(() => {
      setPlayerHand(hand)
      setDeck(remainingDeck)
      setGamePhase("draw")
      setIsDealing(false)

      // Evaluate initial hand
      evaluateHand(hand)
    }, 1000)
  }

  // Hold/unhold a card
  const toggleHold = (index: number) => {
    if (gamePhase !== "draw") return

    const updatedHand = [...playerHand]
    updatedHand[index] = { ...updatedHand[index], held: !updatedHand[index].held }
    setPlayerHand(updatedHand)
  }

  // Draw new cards
  const drawCards = () => {
    if (gamePhase !== "draw") return

    setIsDealing(true)

    // Keep held cards, replace others
    let currentDeck = [...deck]
    const newHand = playerHand.map((card) => {
      if (card.held) return card

      const newCard = currentDeck[0]
      currentDeck = currentDeck.slice(1)
      return newCard
    })

    // Simulate dealing animation
    setTimeout(() => {
      setPlayerHand(newHand)
      setDeck(currentDeck)
      setGamePhase("result")
      setIsDealing(false)

      // Evaluate final hand
      const ranking = evaluateHand(newHand)
      const win = calculateWin(ranking)

      setWinAmount(win)

      if (win > 0) {
        setPlayerBalance((prev) => prev + win)
        setMessage(`You won $${win} with a ${ranking}!`)
      } else {
        setMessage(`${ranking}. Better luck next time!`)
      }
    }, 1000)
  }

  // Evaluate hand ranking
  const evaluateHand = (hand: PlayingCard[]): HandRanking => {
    // Count ranks and suits
    const rankCounts: Record<Rank, number> = {
      "2": 0,
      "3": 0,
      "4": 0,
      "5": 0,
      "6": 0,
      "7": 0,
      "8": 0,
      "9": 0,
      "10": 0,
      J: 0,
      Q: 0,
      K: 0,
      A: 0,
    }

    const suitCounts: Record<Suit, number> = {
      hearts: 0,
      diamonds: 0,
      clubs: 0,
      spades: 0,
    }

    hand.forEach((card) => {
      rankCounts[card.rank]++
      suitCounts[card.suit]++
    })

    // Check for flush
    const isFlush = Object.values(suitCounts).some((count) => count === 5)

    // Check for straight
    const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"]
    const rankIndices = hand.map((card) => ranks.indexOf(card.rank)).sort((a, b) => a - b)

    let isStraight = false
    // Regular straight
    if (rankIndices[4] - rankIndices[0] === 4 && new Set(rankIndices).size === 5) {
      isStraight = true
    }
    // A-5 straight
    if (rankIndices.join(",") === "0,1,2,3,13") {
      isStraight = true
    }

    // Royal flush
    if (
      isFlush &&
      isStraight &&
      rankIndices.includes(ranks.indexOf("10")) &&
      rankIndices.includes(ranks.indexOf("A")) &&
      rankIndices.includes(ranks.indexOf("K"))
    ) {
      setHandRanking("Royal Flush")
      return "Royal Flush"
    }

    // Straight flush
    if (isFlush && isStraight) {
      setHandRanking("Straight Flush")
      return "Straight Flush"
    }

    // Four of a kind
    if (Object.values(rankCounts).includes(4)) {
      setHandRanking("Four of a Kind")
      return "Four of a Kind"
    }

    // Full house
    if (Object.values(rankCounts).includes(3) && Object.values(rankCounts).includes(2)) {
      setHandRanking("Full House")
      return "Full House"
    }

    // Flush
    if (isFlush) {
      setHandRanking("Flush")
      return "Flush"
    }

    // Straight
    if (isStraight) {
      setHandRanking("Straight")
      return "Straight"
    }

    // Three of a kind
    if (Object.values(rankCounts).includes(3)) {
      setHandRanking("Three of a Kind")
      return "Three of a Kind"
    }

    // Two pair
    if (Object.values(rankCounts).filter((count) => count === 2).length === 2) {
      setHandRanking("Two Pair")
      return "Two Pair"
    }

    // Jacks or better
    if (rankCounts["J"] === 2 || rankCounts["Q"] === 2 || rankCounts["K"] === 2 || rankCounts["A"] === 2) {
      setHandRanking("Jacks or Better")
      return "Jacks or Better"
    }

    setHandRanking("Nothing")
    return "Nothing"
  }

  // Calculate win amount
  const calculateWin = (ranking: HandRanking): number => {
    return payoutTable[ranking][betLevel - 1] * betAmount
  }

  // Change bet level
  const changeBetLevel = (level: number) => {
    if (gamePhase !== "betting") return

    setBetLevel(level)
    setBetAmount(level * 5)
  }

  // Initialize game on first load
  useEffect(() => {
    initializeGame()
  }, [])

  // Get color for card
  const getCardColor = (suit: Suit) => {
    return suit === "hearts" || suit === "diamonds" ? "text-red-500" : "text-black"
  }

  // Get symbol for suit
  const getSuitSymbol = (suit: Suit) => {
    switch (suit) {
      case "hearts":
        return "♥"
      case "diamonds":
        return "♦"
      case "clubs":
        return "♣"
      case "spades":
        return "♠"
    }
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Video Poker</CardTitle>
            <Badge variant="outline" className="text-lg py-1">
              Balance: ${playerBalance.toFixed(2)}
            </Badge>
          </div>
          <CardDescription>Jacks or Better - Draw poker game</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="space-y-6">
            {/* Payout table */}
            <div className="bg-muted rounded-lg p-2 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-1">Hand</th>
                    <th className="text-center p-1">1 Coin</th>
                    <th className="text-center p-1">2 Coins</th>
                    <th className="text-center p-1">3 Coins</th>
                    <th className="text-center p-1">4 Coins</th>
                    <th className="text-center p-1">5 Coins</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(payoutTable).map(([hand, payouts]) => (
                    <tr key={hand} className={handRanking === hand ? "bg-primary/20 font-bold" : ""}>
                      <td className="text-left p-1">{hand}</td>
                      {payouts.map((payout, i) => (
                        <td key={i} className={`text-center p-1 ${betLevel === i + 1 ? "bg-primary/30" : ""}`}>
                          {payout}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Player's hand */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Your Hand</h3>
              <div className="flex justify-center gap-2">
                {playerHand.length === 0 ? (
                  <div className="text-center text-muted-foreground p-4">Place your bet and deal to start</div>
                ) : (
                  playerHand.map((card, index) => (
                    <div key={index} className="relative">
                      <div
                        className={`w-20 h-32 rounded-md flex flex-col items-center justify-center bg-white border ${
                          card.held ? "border-primary border-2" : "border-gray-300"
                        }`}
                        onClick={() => toggleHold(index)}
                      >
                        <div className={`text-2xl font-bold ${getCardColor(card.suit)}`}>{card.rank}</div>
                        <div className={`text-xl ${getCardColor(card.suit)}`}>{getSuitSymbol(card.suit)}</div>
                      </div>
                      {gamePhase === "draw" && (
                        <div
                          className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-xs font-bold px-2 py-0.5 rounded-full ${
                            card.held ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {card.held ? "HOLD" : "TAP"}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Game controls */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Bet Level</h3>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <Button
                      key={level}
                      variant={betLevel === level ? "default" : "outline"}
                      className="flex-1"
                      onClick={() => changeBetLevel(level)}
                      disabled={gamePhase !== "betting"}
                    >
                      {level}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Bet Amount</h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setBetAmount((prev) => Math.max(5, prev - 5))}
                    disabled={gamePhase !== "betting"}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>

                  <div className="flex-1 text-center font-bold text-lg">${betAmount}</div>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setBetAmount((prev) => Math.min(100, prev + 5))}
                    disabled={gamePhase !== "betting"}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Game result message */}
            {message && (
              <Alert
                className={winAmount > 0 ? "bg-green-500/10 border-green-500/20" : "bg-blue-500/10 border-blue-500/20"}
              >
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="font-medium">{message}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>

        <CardFooter>
          {gamePhase === "betting" && (
            <Button
              className="w-full"
              size="lg"
              onClick={dealHand}
              disabled={isDealing || betAmount <= 0 || betAmount > playerBalance}
            >
              {isDealing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Dealing...
                </>
              ) : (
                "Deal"
              )}
            </Button>
          )}

          {gamePhase === "draw" && (
            <Button className="w-full" size="lg" onClick={drawCards} disabled={isDealing}>
              {isDealing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Drawing...
                </>
              ) : (
                "Draw"
              )}
            </Button>
          )}

          {gamePhase === "result" && (
            <Button className="w-full" size="lg" onClick={initializeGame}>
              New Game
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

