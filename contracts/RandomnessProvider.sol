// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
import "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";

/**
 * @title RandomnessProvider
 * @dev Provides secure randomness for casino games using Pyth oracle
 */
contract RandomnessProvider {
    IPyth public pyth;
    bytes32 public ethUsdPriceId; // Pyth price feed ID for ETH/USD
    
    uint256 private nonce = 0;
    
    event RandomnessRequested(address indexed requester, uint256 requestId);
    event RandomnessGenerated(uint256 indexed requestId, uint256 randomValue);
    
    constructor(address _pythAddress, bytes32 _ethUsdPriceId) {
        pyth = IPyth(_pythAddress);
        ethUsdPriceId = _ethUsdPriceId;
    }
    
    /**
     * @dev Generates a random number using Pyth oracle data and additional entropy
     * @param seed Additional entropy provided by the caller
     * @return Random value
     */
    function getRandomNumber(uint256 seed) public returns (uint256) {
        // Get the latest price update from Pyth
        PythStructs.Price memory price = pyth.getPrice(ethUsdPriceId);
        
        // Combine multiple sources of entropy
        uint256 randomValue = uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    block.prevrandao,
                    msg.sender,
                    nonce,
                    seed,
                    price.price,
                    price.conf,
                    price.publishTime
                )
            )
        );
        
        // Increment nonce to ensure different results for consecutive calls
        nonce++;
        
        emit RandomnessGenerated(nonce, randomValue);
        return randomValue;
    }
    
    /**
     * @dev Generates a random number in a specific range
     * @param seed Additional entropy provided by the caller
     * @param min Minimum value (inclusive)
     * @param max Maximum value (inclusive)
     * @return Random value between min and max
     */
    function getRandomInRange(uint256 seed, uint256 min, uint256 max) public returns (uint256) {
        require(max > min, "Max must be greater than min");
        uint256 randomValue = getRandomNumber(seed);
        return min + (randomValue % (max - min + 1));
    }
}

