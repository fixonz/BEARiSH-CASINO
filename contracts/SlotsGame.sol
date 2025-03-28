// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./RandomnessProvider.sol";

/**
 * @title SlotsGame
 * @dev Smart contract for a provably fair slots game
 */
contract SlotsGame {
    RandomnessProvider public randomnessProvider;
    
    // Symbol definitions (matches frontend)
    uint8 constant SYMBOL_SEVEN = 0;
    uint8 constant SYMBOL_CHERRY = 1;
    uint8 constant SYMBOL_DIAMOND = 2;
    uint8 constant SYMBOL_BAR = 3;
    uint8 constant SYMBOL_LEMON = 4;
    
    // Payout multipliers
    uint256 constant PAYOUT_TRIPLE_SEVEN = 10;
    uint256 constant PAYOUT_TRIPLE_DIAMOND = 8;
    uint256 constant PAYOUT_TRIPLE_CHERRY = 5;
    uint256 constant PAYOUT_TRIPLE_BAR = 3;
    uint256 constant PAYOUT_TRIPLE_LEMON = 2;
    uint256 constant PAYOUT_ANY_PAIR = 1;
    
    // Game state
    uint256 public minBet = 0.01 ether;
    uint256 public maxBet = 1 ether;
    uint256 public houseEdge = 5; // 5% house edge
    
    // Events
    event SpinResult(address indexed player, uint256 betAmount, uint8[3] symbols, uint256 payout);
    
    // Game statistics
    mapping(address => uint256) public playerWinnings;
    mapping(address => uint256) public playerLosses;
    uint256 public totalBets;
    uint256 public totalWinnings;
    
    constructor(address _randomnessProviderAddress) {
        randomnessProvider = RandomnessProvider(_randomnessProviderAddress);
    }
    
    /**
     * @dev Spin the slots and determine the result
     * @return symbols The three symbols that were rolled
     * @return payout The payout amount (0 if no win)
     */
    function spin() external payable returns (uint8[3] memory symbols, uint256 payout) {
        require(msg.value >= minBet, "Bet amount too small");
        require(msg.value <= maxBet, "Bet amount too large");
        
        totalBets++;
        
        // Generate three random symbols
        symbols[0] = uint8(randomnessProvider.getRandomInRange(uint256(keccak256(abi.encodePacked(msg.sender, block.timestamp, "reel1"))), 0, 4));
        symbols[1] = uint8(randomnessProvider.getRandomInRange(uint256(keccak256(abi.encodePacked(msg.sender, block.timestamp, "reel2"))), 0, 4));
        symbols[2] = uint8(randomnessProvider.getRandomInRange(uint256(keccak256(abi.encodePacked(msg.sender, block.timestamp, "reel3"))), 0, 4));
        
        // Calculate payout
        payout = calculatePayout(symbols, msg.value);
        
        // Update statistics
        if (payout > 0) {
            playerWinnings[msg.sender] += payout;
            totalWinnings += payout;
            
            // Transfer winnings to player
            (bool success, ) = payable(msg.sender).call{value: payout}("");
            require(success, "Transfer failed");
        } else {
            playerLosses[msg.sender] += msg.value;
        }
        
        emit SpinResult(msg.sender, msg.value, symbols, payout);
        
        return (symbols, payout);
    }
    
    /**
     * @dev Calculate the payout based on the symbols and bet amount
     * @param symbols The three symbols that were rolled
     * @param betAmount The amount that was bet
     * @return The payout amount (0 if no win)
     */
    function calculatePayout(uint8[3] memory symbols, uint256 betAmount) internal pure returns (uint256) {
        // Check for three of a kind
        if (symbols[0] == symbols[1] && symbols[1] == symbols[2]) {
            if (symbols[0] == SYMBOL_SEVEN) {
                return betAmount * PAYOUT_TRIPLE_SEVEN;
            } else if (symbols[0] == SYMBOL_DIAMOND) {
                return betAmount * PAYOUT_TRIPLE_DIAMOND;
            } else if (symbols[0] == SYMBOL_CHERRY) {
                return betAmount * PAYOUT_TRIPLE_CHERRY;
            } else if (symbols[0] == SYMBOL_BAR) {
                return betAmount * PAYOUT_TRIPLE_BAR;
            } else if (symbols[0] == SYMBOL_LEMON) {
                return betAmount * PAYOUT_TRIPLE_LEMON;
            }
        }
        
        // Check for pairs
        if (symbols[0] == symbols[1] || symbols[1] == symbols[2] || symbols[0] == symbols[2]) {
            return betAmount / 2; // 0.5x payout for any pair
        }
        
        // No win
        return 0;
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
    function updateGameParameters(uint256 _minBet, uint256 _maxBet, uint256 _houseEdge) external {
        // In a real implementation, this would have access control
        minBet = _minBet;
        maxBet = _maxBet;
        houseEdge = _houseEdge;
    }
    
    /**
     * @dev Get player statistics
     */
    function getPlayerStats(address player) external view returns (uint256 wins, uint256 losses) {
        return (playerWinnings[player], playerLosses[player]);
    }
    
    // Fallback function to receive ETH
    receive() external payable {}
}

