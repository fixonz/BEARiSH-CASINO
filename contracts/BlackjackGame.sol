// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./RandomnessProvider.sol";

/**
 * @title BlackjackGame
 * @dev Smart contract for a provably fair blackjack game
 */
contract BlackjackGame {
    RandomnessProvider public randomnessProvider;
    
    // Game parameters
    uint256 public minBet = 0.01 ether;
    uint256 public maxBet = 1 ether;
    
    // Card definitions
    enum Suit { Hearts, Diamonds, Clubs, Spades }
    enum Rank { Two, Three, Four, Five, Six, Seven, Eight, Nine, Ten, Jack, Queen, King, Ace }
    
    struct Card {
        Suit suit;
        Rank rank;
    }
    
    // Game state
    struct Game {
        uint256 id;
        address player;
        uint256 betAmount;
        Card[] playerHand;
        Card[] dealerHand;
        bool dealerCardHidden;
        GameState state;
        uint256 timestamp;
    }
    
    enum GameState {
        Active,
        PlayerBusted,
        DealerBusted,
        PlayerWon,
        DealerWon,
        Push
    }
    
    // Game tracking
    uint256 public currentGameId;
    mapping(uint256 => Game) public games;
    mapping(address => uint256) public playerActiveGames;
    
    // Events
    event GameStarted(uint256 indexed gameId, address indexed player, uint256 betAmount);
    event CardDealt(uint256 indexed gameId, address indexed player, bool isPlayer, Suit suit, Rank rank);
    event PlayerAction(uint256 indexed gameId, string action);
    event GameEnded(uint256 indexed gameId, GameState state, uint256 payout);
    
    constructor(address _randomnessProviderAddress) {
        randomnessProvider = RandomnessProvider(_randomnessProviderAddress);
        currentGameId = 0;
    }
    
    /**
     * @dev Start a new blackjack game
     */
    function startGame() external payable {
        require(msg.value >= minBet, "Bet amount too small");
        require(msg.value <= maxBet, "Bet amount too large");
        require(playerActiveGames[msg.sender] == 0, "Player already has an active game");
        
        currentGameId++;
        
        // Create new game
        Game storage game = games[currentGameId];
        game.id = currentGameId;
        game.player = msg.sender;
        game.betAmount = msg.value;
        game.state = GameState.Active;
        game.dealerCardHidden = true;
        game.timestamp = block.timestamp;
        
        // Deal initial cards
        dealInitialCards(game);
        
        // Track player's active game
        playerActiveGames[msg.sender] = currentGameId;
        
        emit GameStarted(currentGameId, msg.sender, msg.value);
        
        // Check for natural blackjack
        if (calculateHandValue(game.playerHand) == 21) {
            // Check if dealer also has blackjack
            if (calculateHandValue(game.dealerHand) == 21) {
                game.dealerCardHidden = false;
                game.state = GameState.Push;
                endGame(game);
            } else {
                game.dealerCardHidden = false;
                game.state = GameState.PlayerWon;
                endGame(game);
            }
        }
    }
    
    /**
     * @dev Deal initial cards (2 to player, 2 to dealer with one hidden)
     */
    function dealInitialCards(Game storage game) internal {
        // Generate seed for randomness
        uint256 seed = uint256(keccak256(abi.encodePacked(game.id, block.timestamp, "initial")));
        
        // Deal first card to player
        Card memory playerCard1 = dealCard(seed, 0);
        game.playerHand.push(playerCard1);
        emit CardDealt(game.id, game.player, true, playerCard1.suit, playerCard1.rank);
        
        // Deal first card to dealer
        Card memory dealerCard1 = dealCard(seed, 1);
        game.dealerHand.push(dealerCard1);
        emit CardDealt(game.id, game.player, false, dealerCard1.suit, dealerCard1.rank);
        
        // Deal second card to player
        Card memory playerCard2 = dealCard(seed, 2);
        game.playerHand.push(playerCard2);
        emit CardDealt(game.id, game.player, true, playerCard2.suit, playerCard2.rank);
        
        // Deal second card to dealer (hidden)
        Card memory dealerCard2 = dealCard(seed, 3);
        game.dealerHand.push(dealerCard2);
        // Don't emit event for hidden card
    }
    
    /**
     * @dev Deal a card using randomness provider
     */
    function dealCard(uint256 seed, uint256 cardIndex) internal returns (Card memory) {
        uint256 randomValue = randomnessProvider.getRandomNumber(seed + cardIndex);
        
        Suit suit = Suit(randomValue % 4);
        Rank rank = Rank(randomValue % 13);
        
        return Card(suit, rank);
    }
    
    /**
     * @dev Player action: Hit (take another card)
     */
    function hit() external {
        uint256 gameId = playerActiveGames[msg.sender];
        require(gameId > 0, "No active game");
        
        Game storage game = games[gameId];
        require(game.state == GameState.Active, "Game not active");
        
        // Deal a card to player
        uint256 seed = uint256(keccak256(abi.encodePacked(game.id, block.timestamp, "hit", game.playerHand.length)));
        Card memory newCard = dealCard(seed, game.playerHand.length + game.dealerHand.length);
        game.playerHand.push(newCard);
        
        emit CardDealt(game.id, game.player, true, newCard.suit, newCard.rank);
        emit PlayerAction(game.id, "hit");
        
        // Check if player busted
        uint256 playerValue = calculateHandValue(game.playerHand);
        if (playerValue > 21) {
            game.state = GameState.PlayerBusted;
            endGame(game);
        } else if (playerValue == 21) {
            // Player has 21, automatically stand
            stand();
        }
    }
    
    /**
     * @dev Player action: Stand (end turn)
     */
    function stand() public {
        uint256 gameId = playerActiveGames[msg.sender];
        require(gameId > 0, "No active game");
        
        Game storage game = games[gameId];
        require(game.state == GameState.Active, "Game not active");
        
        emit PlayerAction(game.id, "stand");
        
        // Reveal dealer's hidden card
        game.dealerCardHidden = false;
        emit CardDealt(game.id, game.player, false, game.dealerHand[1].suit, game.dealerHand[1].rank);
        
        // Dealer draws until 17 or higher
        uint256 dealerValue = calculateHandValue(game.dealerHand);
        uint256 seed = uint256(keccak256(abi.encodePacked(game.id, block.timestamp, "dealer")));
        
        while (dealerValue < 17) {
            Card memory newCard = dealCard(seed, game.playerHand.length + game.dealerHand.length);
            game.dealerHand.push(newCard);
            emit CardDealt(game.id, game.player, false, newCard.suit, newCard.rank);
            
            dealerValue = calculateHandValue(game.dealerHand);
            seed = uint256(keccak256(abi.encodePacked(seed, "next")));
        }
        
        // Determine winner
        uint256 playerValue = calculateHandValue(game.playerHand);
        
        if (dealerValue > 21) {
            game.state = GameState.DealerBusted;
        } else if (playerValue > dealerValue) {
            game.state = GameState.PlayerWon;
        } else if (playerValue < dealerValue) {
            game.state = GameState.DealerWon;
        } else {
            game.state = GameState.Push;
        }
        
        endGame(game);
    }
    
    /**
     * @dev Player action: Double Down
     */
    function doubleDown() external payable {
        uint256 gameId = playerActiveGames[msg.sender];
        require(gameId > 0, "No active game");
        
        Game storage game = games[gameId];
        require(game.state == GameState.Active, "Game not active");
        require(game.playerHand.length == 2, "Can only double down on initial hand");
        require(msg.value == game.betAmount, "Must match original bet amount");
        
        // Double the bet
        game.betAmount += msg.value;
        
        emit PlayerAction(game.id, "double down");
        
        // Deal one more card to player
        uint256 seed = uint256(keccak256(abi.encodePacked(game.id, block.timestamp, "double")));
        Card memory newCard = dealCard(seed, game.playerHand.length + game.dealerHand.length);
        game.playerHand.push(newCard);
        
        emit CardDealt(game.id, game.player, true, newCard.suit, newCard.rank);
        
        // Check if player busted
        uint256 playerValue = calculateHandValue(game.playerHand);
        if (playerValue > 21) {
            game.state = GameState.PlayerBusted;
            endGame(game);
        } else {
            // Automatically stand after double down
            stand();
        }
    }
    
    /**
     * @dev End the game and settle payment
     */
    function endGame(Game storage game) internal {
        uint256 payout = 0;
        
        if (game.state == GameState.PlayerWon) {
            // Check for natural blackjack (21 with 2 cards)
            if (game.playerHand.length == 2 && calculateHandValue(game.playerHand) == 21) {
                // Blackjack pays 3:2
                payout = game.betAmount + (game.betAmount * 3) / 2;
            } else {
                // Regular win pays 1:1
                payout = game.betAmount * 2;
            }
        } else if (game.state == GameState.DealerBusted) {
            // Dealer bust pays 1:1
            payout = game.betAmount * 2;
        } else if (game.state == GameState.Push) {
            // Push returns the original bet
            payout = game.betAmount;
        }
        
        // Clear player's active game
        playerActiveGames[game.player] = 0;
        
        // Transfer payout if any
        if (payout > 0) {
            (bool success, ) = payable(game.player).call{value: payout}("");
            require(success, "Transfer failed");
        }
        
        emit GameEnded(game.id, game.state, payout);
    }
    
    /**
     * @dev Calculate the value of a hand, accounting for aces
     */
    function calculateHandValue(Card[] memory hand) public pure returns (uint256) {
        uint256 value = 0;
        uint256 aces = 0;
        
        for (uint256 i = 0; i < hand.length; i++) {
            Rank rank = hand[i].rank;
            
            if (rank == Rank.Ace) {
                value += 11;
                aces++;
            } else if (rank == Rank.Ten || rank == Rank.Jack || rank == Rank.Queen || rank == Rank.King) {
                value += 10;
            } else {
                // Two through Nine
                value += uint256(rank) + 2;
            }
        }
        
        // Adjust for aces
        while (value > 21 && aces > 0) {
            value -= 10; // Change Ace from 11 to 1
            aces--;
        }
        
        return value;
    }
    
    /**
     * @dev Get the current game state for a player
     */
    function getGameState(address player) external view returns (
        uint256 gameId,
        uint256 betAmount,
        uint256 playerHandValue,
        uint256 dealerHandValue,
        GameState state
    ) {
        gameId = playerActiveGames[player];
        if (gameId == 0) return (0, 0, 0, 0, GameState.Active);
        
        Game storage game = games[gameId];
        
        playerHandValue = calculateHandValue(game.playerHand);
        
        // Only show dealer's visible cards if game is still active
        if (game.state == GameState.Active && game.dealerCardHidden) {
            Card[] memory visibleDealerCards = new Card[](1);
            visibleDealerCards[0] = game.dealerHand[0];
            dealerHandValue = calculateHandValue(visibleDealerCards);
        } else {
            dealerHandValue = calculateHandValue(game.dealerHand);
        }
        
        return (gameId, game.betAmount, playerHandValue, dealerHandValue, game.state);
    }
    
    /**
     * @dev Get the cards in a player's hand
     */
    function getPlayerHand(uint256 gameId) external view returns (Suit[] memory suits, Rank[] memory ranks) {
        Game storage game = games[gameId];
        require(game.id > 0, "Game does not exist");
        
        suits = new Suit[](game.playerHand.length);
        ranks = new Rank[](game.playerHand.length);
        
        for (uint256 i = 0; i < game.playerHand.length; i++) {
            suits[i] = game.playerHand[i].suit;
            ranks[i] = game.playerHand[i].rank;
        }
        
        return (suits, ranks);
    }
    
    /**
     * @dev Get the cards in the dealer's hand
     */
    function getDealerHand(uint256 gameId) external view returns (Suit[] memory suits, Rank[] memory ranks, bool hasHiddenCard) {
        Game storage game = games[gameId];
        require(game.id > 0, "Game does not exist");
        
        uint256 visibleCards = game.dealerCardHidden ? 1 : game.dealerHand.length;
        
        suits = new Suit[](visibleCards);
        ranks = new Rank[](visibleCards);
        
        for (uint256 i = 0; i < visibleCards; i++) {
            suits[i] = game.dealerHand[i].suit;
            ranks[i] = game.dealerHand[i].rank;
        }
        
        return (suits, ranks, game.dealerCardHidden);
    }
    
    /**
     * @dev Withdraw funds from the contract (owner only)
     */
    function withdraw() external {
        // In a real implementation, this would have access control
        payable(msg.sender).transfer(address(this).balance);
    }
    
    // Fallback function to receive ETH
    receive() external payable {}
}

