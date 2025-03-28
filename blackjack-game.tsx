"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, RefreshCw, DollarSign, Plus, Minus } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Card types
type Suit = "hearts" | "diamonds" | "clubs" | "spades"
type Rank = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A"
type PlayingCard = {
  suit: Suit
  rank: Rank
  value: number
  hidden?: boolean
}

export default function BlackjackGame() {
  // Game state
  const [deck, setDeck] = useState<PlayingCard[]>([])
  const [playerHand, setPlayerHand] = useState<PlayingCard[]>([])
  const [dealerHand, setDealerHand] = useState<PlayingCard[]>([])
  const [gameState, setGameState] = useState<"betting" | "playing" | "dealerTurn" | "gameOver">("betting")
  const [betAmount, setBetAmount] = useState(10)
  const [playerBalance, setPlayerBalance] = useState(1000)
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Initialize or reset the game
  const initializeGame = () => {
    const newDeck = createDeck()
    setDeck(newDeck)
    setPlayerHand([])
    setDealerHand([])
    setGameState("betting")
    setMessage("")
  }

  // Create and shuffle a new deck
  const createDeck = (): PlayingCard[] => {
    const suits: Suit[] = ["hearts", "diamonds", "clubs", "spades"]
    const ranks: Rank[] = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"]
    const values: Record<Rank, number> = {
      "2": 2,
      "3": 3,
      "4": 4,
      "5": 5,
      "6": 6,
      "7": 7,
      "8": 8,
      "9": 9,
      "10": 10,
      J: 10,
      Q: 10,
      K: 10,
      A: 11,
    }

    const newDeck: PlayingCard[] = []

    for (const suit of suits) {
      for (const rank of ranks) {
        newDeck.push({
          suit,
          rank,
          value: values[rank],
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

  // Deal a card from the deck
  const dealCard = (hidden = false): PlayingCard => {
    const card = deck[0]
    card.hidden = hidden
    setDeck(deck.slice(1))
    return card
  }

  // Start a new game
  const startGame = () => {
    if (betAmount <= 0 || betAmount > playerBalance) return

    setIsLoading(true)
    setPlayerBalance((prev) => prev - betAmount)

    // Create a new deck and deal initial cards
    const newDeck = createDeck()
    setDeck(newDeck)

    setTimeout(() => {
      const playerCard1 = newDeck[0]
      const dealerCard1 = newDeck[1]
      const playerCard2 = newDeck[2]
      const dealerCard2 = { ...newDeck[3], hidden: true }

      setPlayerHand([playerCard1, playerCard2])
      setDealerHand([dealerCard1, dealerCard2])
      setDeck(newDeck.slice(4))
      setGameState("playing")
      setIsLoading(false)

      // Check for natural blackjack
      const playerTotal = calculateHandValue([playerCard1, playerCard2])
      if (playerTotal === 21) {
        if (dealerCard1.value === 10 || dealerCard1.rank === "A") {
          // Dealer might have blackjack too, reveal card
          handleDealerTurn([playerCard1, playerCard2], [dealerCard1, { ...dealerCard2, hidden: false }])
        } else {
          // Player wins with blackjack (pays 3:2)
          setMessage("Blackjack! You win 1.5x your bet!")
          setPlayerBalance((prev) => prev + betAmount * 2.5)
          setGameState("gameOver")
        }
      }
    }, 500)
  }

  // Player hits (takes another card)
  const handleHit = () => {
    if (gameState !== "playing") return

    const newCard = dealCard()
    const newPlayerHand = [...playerHand, newCard]
    setPlayerHand(newPlayerHand)

    const handValue = calculateHandValue(newPlayerHand)

    if (handValue > 21) {
      setMessage("Bust! You went over 21.")
      setGameState("gameOver")
    } else if (handValue === 21) {
      handleStand()
    }
  }

  // Player stands (ends turn)
  const handleStand = () => {
    if (gameState !== "playing") return

    setGameState("dealerTurn")

    // Reveal dealer's hidden card
    const revealedDealerHand = dealerHand.map((card) => ({ ...card, hidden: false }))
    setDealerHand(revealedDealerHand)

    // Dealer's turn
    handleDealerTurn(playerHand, revealedDealerHand)
  }

  // Dealer's turn logic
  const handleDealerTurn = (playerCards: PlayingCard[], dealerCards: PlayingCard[]) => {
    let currentDealerHand = [...dealerCards]
    let dealerValue = calculateHandValue(currentDealerHand)
    const playerValue = calculateHandValue(playerCards)

    // Dealer draws until 17 or higher
    const drawCards = () => {
      if (dealerValue < 17) {
        setTimeout(() => {
          const newCard = dealCard()
          currentDealerHand = [...currentDealerHand, newCard]
          setDealerHand(currentDealerHand)

          dealerValue = calculateHandValue(currentDealerHand)

          if (dealerValue < 17) {
            drawCards()
          } else {
            determineWinner(playerValue, dealerValue)
          }
        }, 500)
      } else {
        determineWinner(playerValue, dealerValue)
      }
    }

    drawCards()
  }

  // Determine the winner
  const determineWinner = (playerValue: number, dealerValue: number) => {
    if (playerValue > 21) {
      setMessage("Bust! You went over 21.")
    } else if (dealerValue > 21) {
      setMessage("Dealer busts! You win!")
      setPlayerBalance((prev) => prev + betAmount * 2)
    } else if (playerValue > dealerValue) {
      setMessage("You win!")
      setPlayerBalance((prev) => prev + betAmount * 2)
    } else if (playerValue < dealerValue) {
      setMessage("Dealer wins!")
    } else {
      setMessage("Push! It's a tie.")
      setPlayerBalance((prev) => prev + betAmount)
    }

    setGameState("gameOver")
  }

  // Calculate the value of a hand, accounting for aces
  const calculateHandValue = (hand: PlayingCard[]): number => {
    let value = 0
    let aces = 0

    for (const card of hand) {
      if (!card.hidden) {
        value += card.value
        if (card.rank === "A") {
          aces++
        }
      }
    }

    // Adjust for aces
    while (value > 21 && aces > 0) {
      value -= 10
      aces--
    }

    return value
  }

  // Double down
  const handleDoubleDown = () => {
    if (gameState !== "playing" || playerHand.length !== 2 || playerBalance < betAmount) return

    setPlayerBalance((prev) => prev - betAmount)
    setBetAmount((prev) => prev * 2)

    // Deal one more card to player then stand
    const newCard = dealCard()
    const newPlayerHand = [...playerHand, newCard]
    setPlayerHand(newPlayerHand)

    const handValue = calculateHandValue(newPlayerHand)

    if (handValue > 21) {
      setMessage("Bust! You went over 21.")
      setGameState("gameOver")
    } else {
      handleStand()
    }
  }

  // Initialize game on first load
  useEffect(() => {
    initializeGame()
  }, [])

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Blackjack</CardTitle>
            <Badge variant="outline" className="text-lg py-1">
              Balance: ${playerBalance.toFixed(2)}
            </Badge>
          </div>
          <CardDescription>Try to beat the dealer without going over 21</CardDescription>
        </CardHeader>

        <CardContent>
          {gameState === "betting" ? (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Place Your Bet</h3>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => setBetAmount((prev) => Math.max(1, prev - 5))}>
                    <Minus className="h-4 w-4" />
                  </Button>

                  <Input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(Number(e.target.value))}
                    className="w-24 text-center"
                  />

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setBetAmount((prev) => Math.min(playerBalance, prev + 5))}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>

                  <Button variant="outline" onClick={() => setBetAmount(10)}>
                    $10
                  </Button>

                  <Button variant="outline" onClick={() => setBetAmount(25)}>
                    $25
                  </Button>

                  <Button variant="outline" onClick={() => setBetAmount(50)}>
                    $50
                  </Button>

                  <Button variant="outline" onClick={() => setBetAmount(100)}>
                    $100
                  </Button>
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={startGame}
                disabled={betAmount <= 0 || betAmount > playerBalance || isLoading}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Dealing...
                  </>
                ) : (
                  <>
                    <DollarSign className="mr-2 h-4 w-4" />
                    Deal Cards
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Dealer's hand */}
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Dealer's Hand{" "}
                  {gameState !== "betting" && gameState !== "playing" && `(${calculateHandValue(dealerHand)})`}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {dealerHand.map((card, index) => (
                    <div
                      key={index}
                      className={`w-16 h-24 rounded-md flex items-center justify-center ${
                        card.hidden
                          ? "bg-primary text-primary-foreground"
                          : (card.suit === "hearts" || card.suit === "diamonds")
                            ? "bg-white text-red-500 border border-gray-300"
                            : "bg-white text-black border border-gray-300"
                      }`}
                    >
                      {card.hidden ? (
                        <span className="text-xl font-bold">?</span>
                      ) : (
                        <div className="text-center">
                          <div className="text-xl font-bold">{card.rank}</div>
                          <div className="text-xs">
                            {card.suit === "hearts" && "♥"}
                            {card.suit === "diamonds" && "♦"}
                            {card.suit === "clubs" && "♣"}
                            {card.suit === "spades" && "♠"}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Player's hand */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Your Hand ({calculateHandValue(playerHand)})</h3>
                <div className="flex flex-wrap gap-2">
                  {playerHand.map((card, index) => (
                    <div
                      key={index}
                      className={`w-16 h-24 rounded-md flex items-center justify-center ${
                        card.suit === "hearts" || card.suit === "diamonds"
                          ? "bg-white text-red-500 border border-gray-300"
                          : "bg-white text-black border border-gray-300"
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-xl font-bold">{card.rank}</div>
                        <div className="text-xs">
                          {card.suit === "hearts" && "♥"}
                          {card.suit === "diamonds" && "♦"}
                          {card.suit === "clubs" && "♣"}
                          {card.suit === "spades" && "♠"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Game controls */}
              {gameState === "playing" && (
                <div className="flex gap-2">
                  <Button onClick={handleHit} className="flex-1">
                    Hit
                  </Button>
                  <Button onClick={handleStand} className="flex-1">
                    Stand
                  </Button>
                  <Button
                    onClick={handleDoubleDown}
                    className="flex-1"
                    disabled={playerHand.length !== 2 || playerBalance < betAmount}
                  >
                    Double Down
                  </Button>
                </div>
              )}

              {/* Game result message */}
              {message && (
                <Alert
                  className={
                    message.includes("win") || message.includes("Blackjack")
                      ? "bg-green-500/10 border-green-500/20"
                      : message.includes("Bust") || message.includes("Dealer wins")
                        ? "bg-red-500/10 border-red-500/20"
                        : "bg-blue-500/10 border-blue-500/20"
                  }
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="font-medium">{message}</AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter>
          {gameState === "gameOver" && (
            <Button onClick={initializeGame} className="w-full">
              Play Again
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

