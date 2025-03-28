import { Wallet } from "zksync-ethers"
import type { HardhatRuntimeEnvironment } from "hardhat/types"
import { Deployer } from "@matterlabs/hardhat-zksync"
import { vars } from "hardhat/config"

export default async function (hre: HardhatRuntimeEnvironment) {
  console.log(`Running security manager deployment script`)

  // Initialize the wallet using your private key
  const wallet = new Wallet(vars.get("DEPLOYER_PRIVATE_KEY"))

  // Create deployer object
  const deployer = new Deployer(hre, wallet)

  // Deploy SecurityManager
  console.log("Deploying SecurityManager...")
  const securityManagerArtifact = await deployer.loadArtifact("SecurityManager")
  const securityManager = await deployer.deploy(securityManagerArtifact, [])

  console.log(`SecurityManager deployed to ${await securityManager.getAddress()}`)

  // In a real deployment, you would now authorize all the game contracts
  // securityManager.authorizeGame(slotsGameAddress);
  // securityManager.authorizeGame(crashGameAddress);
  // etc.

  console.log("Security manager deployed successfully!")
}

