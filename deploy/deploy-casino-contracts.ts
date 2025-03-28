import { Wallet } from "zksync-ethers"
import type { HardhatRuntimeEnvironment } from "hardhat/types"
import { Deployer } from "@matterlabs/hardhat-zksync"
import { vars } from "hardhat/config"

// Pyth price feed ID for ETH/USD on Abstract testnet
const ETH_USD_PRICE_FEED_ID = "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace"
// Pyth oracle address on Abstract testnet
const PYTH_ORACLE_ADDRESS = "0xA2aa501b19aff244D90cc15A4Cf739D2725B5729"

export default async function (hre: HardhatRuntimeEnvironment) {
  console.log(`Running casino contracts deployment script`)

  // Initialize the wallet using your private key
  const wallet = new Wallet(vars.get("DEPLOYER_PRIVATE_KEY"))

  // Create deployer object
  const deployer = new Deployer(hre, wallet)

  // Deploy RandomnessProvider first
  console.log("Deploying RandomnessProvider...")
  const randomnessProviderArtifact = await deployer.loadArtifact("RandomnessProvider")
  const randomnessProvider = await deployer.deploy(randomnessProviderArtifact, [
    PYTH_ORACLE_ADDRESS,
    ETH_USD_PRICE_FEED_ID,
  ])

  const randomnessProviderAddress = await randomnessProvider.getAddress()
  console.log(`RandomnessProvider deployed to ${randomnessProviderAddress}`)

  // Deploy SlotsGame
  console.log("Deploying SlotsGame...")
  const slotsGameArtifact = await deployer.loadArtifact("SlotsGame")
  const slotsGame = await deployer.deploy(slotsGameArtifact, [randomnessProviderAddress])

  console.log(`SlotsGame deployed to ${await slotsGame.getAddress()}`)

  // Deploy CrashGame
  console.log("Deploying CrashGame...")
  const crashGameArtifact = await deployer.loadArtifact("CrashGame")
  const crashGame = await deployer.deploy(crashGameArtifact, [randomnessProviderAddress])

  console.log(`CrashGame deployed to ${await crashGame.getAddress()}`)

  // Deploy BerryFlipper
  console.log("Deploying BerryFlipper...")
  const berryFlipperArtifact = await deployer.loadArtifact("BerryFlipper")
  const berryFlipper = await deployer.deploy(berryFlipperArtifact, [randomnessProviderAddress])

  console.log(`BerryFlipper deployed to ${await berryFlipper.getAddress()}`)

  console.log("All casino contracts deployed successfully!")
}

