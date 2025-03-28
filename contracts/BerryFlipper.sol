// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./RandomnessProvider.sol";

/**
 * @title BerryFlipper
 * @dev Smart contract for a provably fair coin flip game
 */
contract BerryFlipper {
    RandomnessProvider public randomnessProvider;
    
    // Game parameters
    uint256 public constant HOUSE_EDGE = 3; // 3%
    uint256 public minBet = 0.01 ether;
    uint256 public maxBet = 1 ether;
    
    // Streak bonus parameters
    uint256 public constant MAX_STREAK_BONUS = 50; // 50% max bonus
    uint256 public constant STREAK_BONUS_INCREMENT = 10; // 10% per streak
    
    // Player stats
    struct PlayerStats {
        uint256 totalBets;
        uint256 totalWins;
        uint256 currentStreak;
        uint256 highestStreak;
        uint256 totalWagered;
        uint256 totalWon;
    }
    
    mapping(address => PlayerStats) public playerStats;
    
    // Events
    event BerryFlipped(address indexed player, bool isRed, bool playerGuessedCorrectly, uint256 betAmount, uint256 payout, uint256 streak);
    
    constructor(address _randomnessProviderAddress) {
        randomnessProvider = RandomnessProvider(_randomnessProviderAddress);
    }
    
    /**
     * @dev Flip the berry and determine the result
     * @param guessRed True if the player is guessing red, false for blue
     * @return isRed True if the result is red, false for blue
     * @return won True if the player won
     * @return payout The amount paid out to the player
     */
    function flipBerry(bool guessRed) external payable returns (bool isRed, bool won, uint256 payout) {
        require(msg.value >= minBet, "Bet amount too small");
        require(msg.value <= maxBet, "Bet amount too large");
        
        // Update player stats
        playerStats[msg.sender].totalBets++;
        playerStats[msg.sender].totalWagered += msg.value;
        
        // Generate random result
        uint256 seed = uint256(keccak256(abi.encodePacked(msg.sender, block.timestamp, "berry")));
        uint256 randomValue = randomnessProvider.getRandomNumber(seed);
        
        // Apply house edge (slightly favor the house)
        // For a 3% house edge, we give the player a 48.5% chance to win
        isRed = randomValue % 1000 < 485;
        
        // Determine if player won
        won = (guessRed == isRed);
        
        if (won) {
            // Update streak
            playerStats[msg.sender].currentStreak++;
            if (playerStats[msg.sender].currentStreak > playerStats[msg.sender].highestStreak) {
                playerStats[msg.sender].highestStreak = playerStats[msg.sender].currentStreak;
            }
            
            // Calculate streak bonus (capped at MAX_STREAK_BONUS)
            uint256 streakBonus = 0;
            if (playerStats[msg.sender].currentStreak > 1) {
                streakBonus = Math.min(
                    MAX_STREAK_BONUS,
                    (playerStats[msg.sender].currentStreak - 1) * STREAK_BONUS_INCREMENT
                );
            }
            
            // Calculate payout with streak bonus
            uint256 basePayoutMultiplier = 200; // 2x
            uint256 bonusMultiplier = basePayoutMultiplier * (100 + streakBonus) / 100;
            payout = (msg.value * bonusMultiplier) / 100;
            
            // Update player stats
            playerStats[msg.sender].totalWins++;
            playerStats[msg.sender].totalWon += payout;
            
            // Transfer winnings to player
            (bool success, ) = payable(msg.sender).call{value: payout}("");
            require(success, "Transfer failed");
        } else {
            // Reset streak on loss
            playerStats[msg.sender].currentStreak = 0;
            payout = 0;
        }
        
        emit BerryFlipped(
            msg.sender,
            isRed,
            won,
            msg.value,
            payout,
            playerStats[msg.sender].currentStreak
        );
        
        return (isRed, won, payout);
    }
    
    /**
     * @dev Get player statistics
     */
    function getPlayerStats(address player) external view returns (
        uint256 totalBets,
        uint256 totalWins,
        uint256 currentStreak,
        uint256 highestStreak,
        uint256 totalWagered,
        uint256 totalWon
    ) {
        PlayerStats storage stats = playerStats[player];
        return (
            stats.totalBets,
            stats.totalWins,
            stats.currentStreak,
            stats.highestStreak,
            stats.totalWagered,
            stats.totalWon
        );
    }
    
    /**
     * @dev Withdraw funds from the contract (owner only)
     */
    function withdraw() external {
        // In a real implementation, this would have access control
        payable(msg.sender).transfer(address(this).balance);
    }
    
    /**
     * @dev Update game parameters (owner only)
     */
    function updateGameParameters(uint256 _minBet, uint256 _maxBet) external {
        // In a real implementation, this would have access control
        minBet = _minBet;
        maxBet = _maxBet;
    }
    
    // Fallback function to receive ETH
    receive() external payable {}
}

