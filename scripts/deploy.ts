import { ethers, network } from "hardhat";

async function main() {
  // Define contract addresses
  // const usdtTokenAddress = "0x04f868C5b3F0A100a207c7e9312946cC2c48a7a3";
  const usdtTokenAddress = "0x65c2A522377b6D0C4aa63B323485508B852b17cc";

  const marketplaceEOA = "0x97Da4bA4Cc43FD8011bEB7A71978d8c8c87a5287";

  // Deploy the USDT token contract (if needed)
  // If the contract is already deployed, you can use its address directly.
  // const USDT = await ethers.getContractFactory("USDT");
  // const usdtToken = await USDT.deploy(ethers.parseUnits("1000000", 6));
  // await usdtToken.waitForDeployment();
  // const usdtTokenAddress = await usdtToken.getAddress();
  // console.log("USDT deployed to:", usdtTokenAddress);

  // Deploy the Payment contract
  // const Payment = await ethers.getContractFactory("Payment");
  // const payment = await Payment.deploy(usdtTokenAddress, marketplaceEOA);
  // await payment.waitForDeployment();
  // console.log("Payment contract deployed to: ", await payment.getAddress());

  // // Deploy the NFt contract
  // const BlackhardNFTContract = await ethers.getContractFactory("BlackhardNFT");
  // const blackhard = await BlackhardNFTContract.deploy();
  // await blackhard.waitForDeployment();
  // console.log("BlackhardsNFT contract deployed to: ", await blackhard.getAddress());


  // // Deploy Marketplace contract
  // const MarketplaceContract = await ethers.getContractFactory("Marketplace");
  // const marketplace = await MarketplaceContract.deploy(
  //   await blackhard.getAddress(),
  //   usdtTokenAddress,
  //   usdtTokenAddress
  // );
  // await marketplace.waitForDeployment();
  // console.log("Marketplace contract deployed to: ", await marketplace.getAddress());

  // Deploy the BidTracker
  const BidTrackerContract = await ethers.getContractFactory("BidTracker");
  const bidTracker = await BidTrackerContract.deploy(usdtTokenAddress, marketplaceEOA);
  await bidTracker.waitForDeployment();
  console.log("BidTracker contract deployed to: ", await bidTracker.getAddress());

  // Optionally, you can verify contracts here
  // await hre.run("verify:verify", {
  //   address: payment.address,
  //   constructorArguments: [usdtToken.address, marketplaceEOA],
  // });
}

// Execute the deployment script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

// USDT deployed to: 0x65c2A522377b6D0C4aa63B323485508B852b17cc
// Payment contract deployed to:  0xBB724c014c3d9DD0fA944E262E567e4322fb594D
// PaymentNew1 contract deployed to:  0xfE1A96c945c970e3d9cE1788A0E42d64Aa29b7be

// BlackhardsNFT contract deployed to:  0xED36E1ea64D24a92792B8d56Cd61147B2354ad0C
// Marketplace contract deployed to:  0x16455d61a8B8f1A9dFF7512c8267669fcBc78c78
// BidTracker contract deployed to:  0x5d70fA3F7c394fF48E7a74CBF944147bDBAA7C47
// npx hardhat verify 0x65c2A522377b6D0C4aa63B323485508B852b17cc  --network assetchain_test --constructor-args token_args.ts
