// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./RandomnessProvider.sol";

/**
 * @title CrashGame
 * @dev Smart contract for a provably fair crash game
 */
contract CrashGame {
    RandomnessProvider public randomnessProvider;
    
    // Game parameters
    uint256 public constant HOUSE_EDGE = 5; // 5%
    uint256 public constant MAX_MULTIPLIER = 1000; // 1000x
    uint256 public minBet = 0.01 ether;
    uint256 public maxBet = 1 ether;
    
    // Game state
    uint256 public currentGameId;
    uint256 public nextCrashPoint;
    uint256 public gameStartTime;
    bool public gameInProgress;
    
    struct Bet {
        uint256 amount;
        uint256 autoCashoutMultiplier; // In basis points (10000 = 1.0x)
        bool cashedOut;
        uint256 cashoutMultiplier; // Actual cashout multiplier if cashed out
    }
    
    // Mapping from gameId to player address to bet
    mapping(uint256 => mapping(address => Bet)) public bets;
    
    // Events
    event GameStarted(uint256 indexed gameId, uint256 timestamp);
    event GameEnded(uint256 indexed gameId, uint256 crashPoint);
    event BetPlaced(uint256 indexed gameId, address indexed player, uint256 amount, uint256 autoCashoutMultiplier);
    event PlayerCashedOut(uint256 indexed gameId, address indexed player, uint256 amount, uint256 multiplier);
    
    constructor(address _randomnessProviderAddress) {
        randomnessProvider = RandomnessProvider(_randomnessProviderAddress);
        currentGameId = 0;
        gameInProgress = false;
    }
    
    /**
     * @dev Start a new game round
     */
    function startGame() external {
        require(!gameInProgress, "Game already in progress");
        
        // Generate crash point for this round
        uint256 seed = uint256(keccak256(abi.encodePacked(currentGameId, block.timestamp)));
        nextCrashPoint = generateCrashPoint(seed);
        
        gameInProgress = true;
        gameStartTime = block.timestamp;
        currentGameId++;
        
        emit GameStarted(currentGameId, block.timestamp);
    }
    
    /**
     * @dev End the current game round
     */
    function endGame() external {
        require(gameInProgress, "No game in progress");
        
        gameInProgress = false;
        emit GameEnded(currentGameId, nextCrashPoint);
    }
    
    /**
     * @dev Place a bet for the current game
     * @param autoCashoutMultiplier The multiplier at which to automatically cash out (in basis points, 10000 = 1.0x)
     */
    function placeBet(uint256 autoCashoutMultiplier) external payable {
        require(gameInProgress, "No game in progress");
        require(msg.value >= minBet, "Bet amount too small");
        require(msg.value <= maxBet, "Bet amount too large");
        require(autoCashoutMultiplier >= 10000, "Auto cashout must be at least 1.0x");
        require(bets[currentGameId][msg.sender].amount == 0, "Already bet in this round");
        
        bets[currentGameId][msg.sender] = Bet({
            amount: msg.value,
            autoCashoutMultiplier: autoCashoutMultiplier,
            cashedOut: false,
            cashoutMultiplier: 0
        });
        
        emit BetPlaced(currentGameId, msg.sender, msg.value, autoCashoutMultiplier);
    }
    
    /**
     * @dev Cash out from the current game
     */
    function cashout() external {
        require(gameInProgress, "No game in progress");
        
        Bet storage bet = bets[currentGameId][msg.sender];
        require(bet.amount > 0, "No bet placed");
        require(!bet.cashedOut, "Already cashed out");
        
        // Calculate current multiplier based on time elapsed
        uint256 currentMultiplier = getCurrentMultiplier();
        require(currentMultiplier < nextCrashPoint, "Game already crashed");
        
        // Mark as cashed out
        bet.cashedOut = true;
        bet.cashoutMultiplier = currentMultiplier;
        
        // Calculate winnings
        uint256 winnings = (bet.amount * currentMultiplier) / 10000;
        
        // Transfer winnings to player
        (bool success, ) = payable(msg.sender).call{value: winnings}("");
        require(success, "Transfer failed");
        
        emit PlayerCashedOut(currentGameId, msg.sender, winnings, currentMultiplier);
    }
    
    /**
     * @dev Get the current multiplier based on time elapsed
     * @return Current multiplier in basis points (10000 = 1.0x)
     */
    function getCurrentMultiplier() public view returns (uint256) {
        if (!gameInProgress) return 10000;
        
        uint256 timeElapsed = block.timestamp - gameStartTime;
        
        // Exponential growth formula: 1.0 + (timeElapsed * growthFactor)
        // This is a simplified version; a real implementation would use a more complex formula
        uint256 multiplier = 10000 + (timeElapsed * 1000);
        
        return multiplier > nextCrashPoint ? nextCrashPoint : multiplier;
    }
    
    /**
     * @dev Generate a crash point using the randomness provider
     * @param seed Random seed
     * @return Crash point in basis points (10000 = 1.0x)
     */
    function generateCrashPoint(uint256 seed) internal returns (uint256) {
        // Get random number from provider
        uint256 randomValue = randomnessProvider.getRandomNumber(seed);
        
        // Apply house edge and generate crash point
        // This formula ensures a house edge of HOUSE_EDGE%
        uint256 crashPoint = (10000 * 100) / (100 - HOUSE_EDGE);
        
        // Apply randomness to create a distribution of crash points
        // This is a simplified version; a real implementation would use a more complex distribution
        crashPoint = (randomValue % crashPoint) + 10000;
        
        // Cap at MAX_MULTIPLIER
        return crashPoint > MAX_MULTIPLIER * 10000 ? MAX_MULTIPLIER * 10000 : crashPoint;
    }
    
    /**
     * @dev Check if a player can claim auto cashout
     */
    function checkAutoCashout(address player) external view returns (bool canCashout, uint256 multiplier) {
        if (!gameInProgress) return (false, 0);
        
        Bet storage bet = bets[currentGameId][player];
        if (bet.amount == 0 || bet.cashedOut) return (false, 0);
        
        uint256 currentMultiplier = getCurrentMultiplier();
        if (currentMultiplier >= bet.autoCashoutMultiplier) {
            return (true, bet.autoCashoutMultiplier);
        }
        
        return (false, currentMultiplier);
    }
    
    /**
     * @dev Get bet details for a player in a specific game
     */
    function getBetDetails(uint256 gameId, address player) external view returns (
        uint256 amount,
        uint256 autoCashoutMultiplier,
        bool cashedOut,
        uint256 cashoutMultiplier
    ) {
        Bet storage bet = bets[gameId][player];
        return (bet.amount, bet.autoCashoutMultiplier, bet.cashedOut, bet.cashoutMultiplier);
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

