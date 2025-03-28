// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
import "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";

/**
 * @title CryptoPrediction
 * @dev Smart contract for a crypto price prediction game
 */
contract CryptoPrediction {
    IPyth public pyth;
    
    // Game parameters
    uint256 public constant HOUSE_EDGE = 5; // 5%
    uint256 public constant PAYOUT_MULTIPLIER = 195; // 1.95x (accounting for house edge)
    uint256 public minBet = 0.01 ether;
    uint256 public maxBet = 1 ether;
    uint256 public roundDuration = 60; // 60 seconds
    
    // Supported price feeds
    mapping(string => bytes32) public priceFeedIds;
    string[] public supportedAssets;
    
    // Round structure
    struct Round {
        uint256 id;
        string asset;
        int64 startPrice;
        int64 endPrice;
        uint256 startTime;
        uint256 endTime;
        bool resolved;
        mapping(address => Prediction) predictions;
    }
    
    struct Prediction {
        uint256 amount;
        bool isUp;
        bool claimed;
    }
    
    // Round tracking
    uint256 public currentRoundId;
    mapping(uint256 => Round) public rounds;
    
    // Events
    event RoundStarted(uint256 indexed roundId, string asset, int64 startPrice, uint256 startTime, uint256 endTime);
    event RoundEnded(uint256 indexed roundId, int64 endPrice, bool priceWentUp);
    event PredictionPlaced(uint256 indexed roundId, address indexed player, bool isUp, uint256 amount);
    event PredictionResolved(uint256 indexed roundId, address indexed player, bool won, uint256 payout);
    
    constructor(address _pythAddress) {
        pyth = IPyth(_pythAddress);
        currentRoundId = 0;
        
        // Add supported assets and their price feed IDs
        addAsset("BTC/USD", 0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace);
        addAsset("ETH/USD", 0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace);
        addAsset("SOL/USD", 0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d);
    }
    
    /**
     * @dev Add a supported asset
     * @param asset Asset name
     * @param priceFeedId Pyth price feed ID
     */
    function addAsset(string memory asset, bytes32 priceFeedId) public {
        // In a real implementation, this would have access control
        priceFeedIds[asset] = priceFeedId;
        supportedAssets.push(asset);
    }
    
    /**
     * @dev Start a new prediction round
     * @param asset Asset to predict
     */
    function startRound(string memory asset) external {
        require(priceFeedIds[asset] != bytes32(0), "Asset not supported");
        require(currentRoundId == 0 || rounds[currentRoundId].resolved, "Previous round not resolved");
        
        // Get current price from Pyth
        PythStructs.Price memory price = pyth.getPrice(priceFeedIds[asset]);
        
        // Create new round
        currentRoundId++;
        Round storage round = rounds[currentRoundId];
        round.id = currentRoundId;
        round.asset = asset;
        round.startPrice = price.price;
        round.startTime = block.timestamp;
        round.endTime = block.timestamp + roundDuration;
        round.resolved = false;
        
        emit RoundStarted(currentRoundId, asset, price.price, round.startTime, round.endTime);
    }
    
    /**
     * @dev Place a prediction for the current round
     * @param isUp True if predicting price will go up, false if down
     */
    function placePrediction(bool isUp) external payable {
        require(currentRoundId > 0, "No active round");
        require(!rounds[currentRoundId].resolved, "Round already resolved");
        require(block.timestamp < rounds[currentRoundId].endTime, "Round ended");
        require(msg.value >= minBet, "Bet amount too small");
        require(msg.value <= maxBet, "Bet amount too large");
        
        Round storage round = rounds[currentRoundId];
        require(round.predictions[msg.sender].amount == 0, "Already predicted in this round");
        
        round.predictions[msg.sender] = Prediction({
            amount: msg.value,
            isUp: isUp,
            claimed: false
        });
        
        emit PredictionPlaced(currentRoundId, msg.sender, isUp, msg.value);
    }
    
    /**
     * @dev End the current round and determine the result
     */
    function endRound() external {
        require(currentRoundId > 0, "No active round");
        require(!rounds[currentRoundId].resolved, "Round already resolved");
        require(block.timestamp >= rounds[currentRoundId].endTime, "Round not ended yet");
        
        Round storage round = rounds[currentRoundId];
        
        // Get current price from Pyth
        PythStructs.Price memory price = pyth.getPrice(priceFeedIds[round.asset]);
        round.endPrice = price.price;
        round.resolved = true;
        
        bool priceWentUp = round.endPrice > round.startPrice;
        
        emit RoundEnded(currentRoundId, round.endPrice, priceWentUp);
    }
    
    /**
     * @dev Claim winnings for a resolved round
     * @param roundId The round ID to claim for
     */
    function claimWinnings(uint256 roundId) external {
        require(roundId > 0 && roundId <= currentRoundId, "Invalid round ID");
        require(rounds[roundId].resolved, "Round not resolved yet");
        
        Round storage round = rounds[roundId];
        Prediction storage prediction = round.predictions[msg.sender];
        
        require(prediction.amount > 0, "No prediction placed");
        require(!prediction.claimed, "Already claimed");
        
        bool priceWentUp = round.endPrice > round.startPrice;
        bool won = prediction.isUp == priceWentUp;
        
        prediction.claimed = true;
        
        if (won) {
            uint256 payout = (prediction.amount * PAYOUT_MULTIPLIER) / 100;
            
            // Transfer winnings to player
            (bool success, ) = payable(msg.sender).call{value: payout}("");
            require(success, "Transfer failed");
            
            emit PredictionResolved(roundId, msg.sender, true, payout);
        } else {
            emit PredictionResolved(roundId, msg.sender, false, 0);
        }
    }
    
    /**
     * @dev Get prediction details for a player in a specific round
     */
    function getPrediction(uint256 roundId, address player) external view returns (
        uint256 amount,
        bool isUp,
        bool claimed
    ) {
        require(roundId > 0 && roundId <= currentRoundId, "Invalid round ID");
        
        Prediction storage prediction = rounds[roundId].predictions[player];
        return (prediction.amount, prediction.isUp, prediction.claimed);
    }
    
    /**
     * @dev Get round details
     */
    function getRoundDetails(uint256 roundId) external view returns (
        string memory asset,
        int64 startPrice,
        int64 endPrice,
        uint256 startTime,
        uint256 endTime,
        bool resolved
    ) {
        require(roundId > 0 && roundId <= currentRoundId, "Invalid round ID");
        
        Round storage round = rounds[roundId];
        return (
            round.asset,
            round.startPrice,
            round.endPrice,
            round.startTime,
            round.endTime,
            round.resolved
        );
    }
    
    /**
     * @dev Get current price for an asset
     */
    function getCurrentPrice(string memory asset) external view returns (int64 price) {
        require(priceFeedIds[asset] != bytes32(0), "Asset not supported");
        
        PythStructs.Price memory priceData = pyth.getPrice(priceFeedIds[asset]);
        return priceData.price;
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
    function updateGameParameters(uint256 _minBet, uint256 _maxBet, uint256 _roundDuration) external {
        // In a real implementation, this would have access control
        minBet = _minBet;
        maxBet = _maxBet;
        roundDuration = _roundDuration;
    }
    
    // Fallback function to receive ETH
    receive() external payable {}
}

