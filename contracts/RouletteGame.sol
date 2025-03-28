// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./RandomnessProvider.sol";

/**
 * @title RouletteGame
 * @dev Smart contract for a provably fair roulette game
 */
contract RouletteGame {
    RandomnessProvider public randomnessProvider;
    
    // Game parameters
    uint256 public minBet = 0.01 ether;
    uint256 public maxBet = 1 ether;
    
    // Bet types
    enum BetType {
        Straight,    // Single number (0-36)
        Split,       // Two adjacent numbers
        Street,      // Three numbers in a row
        Corner,      // Four adjacent numbers
        Line,        // Six numbers (two rows)
        Dozen,       // 12 numbers (1-12, 13-24, 25-36)
        Column,      // 12 numbers (vertical column)
        Eighteen,    // 18 numbers (1-18 or 19-36)
        EvenOdd,     // 18 numbers (even or odd)
        RedBlack     // 18 numbers (red or black)
    }
    
    // Payout multipliers (times 10 to avoid decimals)
    mapping(BetType => uint256) public payoutMultipliers;
    
    // Events
    event SpinResult(uint256 indexed spinId, uint8 number, string color);
    event BetPlaced(uint256 indexed spinId, address indexed player, BetType betType, uint256 amount, uint8[] numbers);
    event BetSettled(uint256 indexed spinId, address indexed player, bool won, uint256 payout);
    
    // Spin tracking
    uint256 public currentSpinId;
    mapping(uint256 => uint8) public spinResults;
    mapping(uint256 => mapping(address => Bet[])) public playerBets;
    
    struct Bet {
        BetType betType;
        uint256 amount;
        uint8[] numbers;
    }
    
    // Roulette wheel configuration
    uint8[] public wheelNumbers = [
        0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
    ];
    
    mapping(uint8 => string) public numberColors;
    
    constructor(address _randomnessProviderAddress) {
        randomnessProvider = RandomnessProvider(_randomnessProviderAddress);
        currentSpinId = 0;
        
        // Initialize payout multipliers
        payoutMultipliers[BetType.Straight] = 360; // 36x
        payoutMultipliers[BetType.Split] = 180;    // 18x
        payoutMultipliers[BetType.Street] = 120;   // 12x
        payoutMultipliers[BetType.Corner] = 90;    // 9x
        payoutMultipliers[BetType.Line] = 60;      // 6x
        payoutMultipliers[BetType.Dozen] = 30;     // 3x
        payoutMultipliers[BetType.Column] = 30;    // 3x
        payoutMultipliers[BetType.Eighteen] = 20;  // 2x
        payoutMultipliers[BetType.EvenOdd] = 20;   // 2x
        payoutMultipliers[BetType.RedBlack] = 20;  // 2x
        
        // Initialize number colors
        string[18] memory redNumbers = [
            "1", "3", "5", "7", "9", "12", "14", "16", "18", "19", "21", "23", "25", "27", "30", "32", "34", "36"
        ];
        
        for (uint8 i = 0; i < redNumbers.length; i++) {
            numberColors[uint8(parseInt(redNumbers[i]))] = "red";
        }
        
        // All other numbers (except 0) are black
        for (uint8 i = 1; i <= 36; i++) {
            if (bytes(numberColors[i]).length == 0) {
                numberColors[i] = "black";
            }
        }
        
        // 0 is green
        numberColors[0] = "green";
    }
    
    /**
     * @dev Helper function to parse string to uint8
     */
    function parseInt(string memory _value) internal pure returns (uint8) {
        bytes memory b = bytes(_value);
        uint8 result = 0;
        for (uint i = 0; i < b.length; i++) {
            uint8 c = uint8(b[i]);
            if (c >= 48 && c <= 57) {
                result = result * 10 + (c - 48);
            }
        }
        return result;
    }
    
    /**
     * @dev Place a bet for the next spin
     * @param betType Type of bet
     * @param numbers Array of numbers being bet on
     */
    function placeBet(BetType betType, uint8[] calldata numbers) external payable {
        require(msg.value >= minBet, "Bet amount too small");
        require(msg.value <= maxBet, "Bet amount too large");
        require(validateBet(betType, numbers), "Invalid bet");
        
        // If this is the first bet for a new spin, increment the spin ID
        if (currentSpinId == 0 || spinResults[currentSpinId] != 0) {
            currentSpinId++;
        }
        
        // Store the bet
        playerBets[currentSpinId][msg.sender].push(Bet({
            betType: betType,
            amount: msg.value,
            numbers: numbers
        }));
        
        emit BetPlaced(currentSpinId, msg.sender, betType, msg.value, numbers);
    }
    
    /**
     * @dev Validate that a bet is correctly structured
     */
    function validateBet(BetType betType, uint8[] calldata numbers) internal pure returns (bool) {
        // Validate number of numbers for each bet type
        if (betType == BetType.Straight) return numbers.length == 1 && numbers[0] <= 36;
        if (betType == BetType.Split) return numbers.length == 2;
        if (betType == BetType.Street) return numbers.length == 3;
        if (betType == BetType.Corner) return numbers.length == 4;
        if (betType == BetType.Line) return numbers.length == 6;
        if (betType == BetType.Dozen || betType == BetType.Column) return numbers.length == 12;
        if (betType == BetType.Eighteen || betType == BetType.EvenOdd || betType == BetType.RedBlack) return numbers.length == 18;
        
        return false;
    }
    
    /**
     * @dev Spin the roulette wheel and settle all bets
     */
    function spin() external {
        require(currentSpinId > 0, "No bets placed");
        require(spinResults[currentSpinId] == 0, "Spin already completed");
        
        // Generate random result
        uint256 seed = uint256(keccak256(abi.encodePacked(currentSpinId, block.timestamp)));
        uint256 randomValue = randomnessProvider.getRandomNumber(seed);
        
        // Select a number from the wheel
        uint8 resultNumber = wheelNumbers[randomValue % wheelNumbers.length];
        
        // Store the result
        spinResults[currentSpinId] = resultNumber;
        
        emit SpinResult(currentSpinId, resultNumber, numberColors[resultNumber]);
    }
    
    /**
     * @dev Claim winnings for a completed spin
     * @param spinId The spin ID to claim for
     */
    function claimWinnings(uint256 spinId) external {
        require(spinId > 0 && spinId <= currentSpinId, "Invalid spin ID");
        require(spinResults[spinId] != 0, "Spin not completed");
        
        Bet[] storage bets = playerBets[spinId][msg.sender];
        require(bets.length > 0, "No bets placed");
        
        uint8 resultNumber = spinResults[spinId];
        uint256 totalPayout = 0;
        
        for (uint256 i = 0; i < bets.length; i++) {
            Bet storage bet = bets[i];
            
            // Check if any of the bet numbers match the result
            bool won = false;
            for (uint256 j = 0; j < bet.numbers.length; j++) {
                if (bet.numbers[j] == resultNumber) {
                    won = true;
                    break;
                }
            }
            
            if (won) {
                uint256 payout = (bet.amount * payoutMultipliers[bet.betType]) / 10;
                totalPayout += payout;
            }
        }
        
        // Clear bets to prevent double claiming
        delete playerBets[spinId][msg.sender];
        
        if (totalPayout > 0) {
            // Transfer winnings to player
            (bool success, ) = payable(msg.sender).call{value: totalPayout}("");
            require(success, "Transfer failed");
        }
        
        emit BetSettled(spinId, msg.sender, totalPayout > 0, totalPayout);
    }
    
    /**
     * @dev Get the result of a spin
     */
    function getSpinResult(uint256 spinId) external view returns (uint8 number, string memory color) {
        require(spinId > 0 && spinId <= currentSpinId, "Invalid spin ID");
        require(spinResults[spinId] != 0, "Spin not completed");
        
        return (spinResults[spinId], numberColors[spinResults[spinId]]);
    }
    
    /**
     * @dev Get player bets for a spin
     */
    function getPlayerBets(uint256 spinId, address player) external view returns (
        BetType[] memory betTypes,
        uint256[] memory amounts,
        uint8[][] memory numbers
    ) {
        Bet[] storage bets = playerBets[spinId][player];
        
        betTypes = new BetType[](bets.length);
        amounts = new uint256[](bets.length);
        numbers = new uint8[][](bets.length);
        
        for (uint256 i = 0; i < bets.length; i++) {
            betTypes[i] = bets[i].betType;
            amounts[i] = bets[i].amount;
            numbers[i] = bets[i].numbers;
        }
        
        return (betTypes, amounts, numbers);
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

