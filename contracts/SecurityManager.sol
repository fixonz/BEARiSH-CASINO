// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title SecurityManager
 * @dev Provides security and anti-cheating measures for casino games
 */
contract SecurityManager {
    // Player risk scoring
    mapping(address => uint256) public playerRiskScores;
    mapping(address => uint256) public playerLastActivity;
    mapping(address => uint256) public playerTransactionCount;
    
    // Suspicious activity thresholds
    uint256 public constant MAX_RISK_SCORE = 100;
    uint256 public constant RISK_THRESHOLD = 70;
    uint256 public constant SUSPICIOUS_TRANSACTION_COUNT = 50;
    uint256 public constant SUSPICIOUS_TRANSACTION_TIMEFRAME = 1 hours;
    
    // Blacklisted addresses
    mapping(address => bool) public blacklisted;
    
    // Game contracts that can call this contract
    mapping(address => bool) public authorizedGames;
    
    // Events
    event RiskScoreUpdated(address indexed player, uint256 newScore);
    event PlayerBlacklisted(address indexed player, string reason);
    event SuspiciousActivity(address indexed player, string activityType, uint256 timestamp);
    
    // Modifiers
    modifier onlyAuthorizedGames() {
        require(authorizedGames[msg.sender], "Caller is not an authorized game");
        _;
    }
    
    constructor() {
        // Constructor logic
    }
    
    /**
     * @dev Add a game contract to the authorized list
     * @param gameAddress Address of the game contract
     */
    function authorizeGame(address gameAddress) external {
        // In a real implementation, this would have access control
        authorizedGames[gameAddress] = true;
    }
    
    /**
     * @dev Remove a game contract from the authorized list
     * @param gameAddress Address of the game contract
     */
    function deauthorizeGame(address gameAddress) external {
        // In a real implementation, this would have access control
        authorizedGames[gameAddress] = false;
    }
    
    /**
     * @dev Check if a player is allowed to play
     * @param player Address of the player
     * @return True if player is allowed, false otherwise
     */
    function isPlayerAllowed(address player) external view returns (bool) {
        // Check if player is blacklisted
        if (blacklisted[player]) {
            return false;
        }
        
        // Check if player has a high risk score
        if (playerRiskScores[player] >= RISK_THRESHOLD) {
            return false;
        }
        
        return true;
    }
    
    /**
     * @dev Record player activity and update risk score
     * @param player Address of the player
     * @param activityType Type of activity (e.g., "bet", "withdraw")
     * @param amount Amount involved in the activity
     */
    function recordActivity(address player, string calldata activityType, uint256 amount) external onlyAuthorizedGames {
        // Update transaction count
        playerTransactionCount[player]++;
        
        // Check for suspicious rapid transactions
        if (block.timestamp - playerLastActivity[player] < SUSPICIOUS_TRANSACTION_TIMEFRAME &&
            playerTransactionCount[player] > SUSPICIOUS_TRANSACTION_COUNT) {
            increaseRiskScore(player, 10);
            emit SuspiciousActivity(player, "rapid_transactions", block.timestamp);
        }
        
        // Update last activity timestamp
        playerLastActivity[player] = block.timestamp;
    }
    
    /**
     * @dev Increase a player's risk score
     * @param player Address of the player
     * @param amount Amount to increase the risk score by
     */
    function increaseRiskScore(address player, uint256 amount) public onlyAuthorizedGames {
        playerRiskScores[player] = Math.min(MAX_RISK_SCORE, playerRiskScores[player] + amount);
        
        emit RiskScoreUpdated(player, playerRiskScores[player]);
        
        // Blacklist if risk score is too high
        if (playerRiskScores[player] >= MAX_RISK_SCORE) {
            blacklisted[player] = true;
            emit PlayerBlacklisted(player, "risk_score_exceeded");
        }
    }
    
    /**
     * @dev Decrease a player's risk score
     * @param player Address of the player
     * @param amount Amount to decrease the risk score by
     */
    function decreaseRiskScore(address player, uint256 amount) external onlyAuthorizedGames {
        if (amount >= playerRiskScores[player]) {
            playerRiskScores[player] = 0;
        } else {
            playerRiskScores[player] -= amount;
        }
        
        emit RiskScoreUpdated(player, playerRiskScores[player]);
    }
    
    /**
     * @dev Manually blacklist a player
     * @param player Address of the player
     * @param reason Reason for blacklisting
     */
    function blacklistPlayer(address player, string calldata reason) external {
        // In a real implementation, this would have access control
        blacklisted[player] = true;
        emit PlayerBlacklisted(player, reason);
    }
    
    /**
     * @dev Remove a player from the blacklist
     * @param player Address of the player
     */
    function removeFromBlacklist(address player) external {
        // In a real implementation, this would have access control
        blacklisted[player] = false;
    }
    
    /**
     * @dev Reset a player's risk score
     * @param player Address of the player
     */
    function resetRiskScore(address player) external {
        // In a real implementation, this would have access control
        playerRiskScores[player] = 0;
        emit RiskScoreUpdated(player, 0);
    }
}

