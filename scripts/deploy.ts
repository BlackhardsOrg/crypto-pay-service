import { ethers, network } from "hardhat";

async function main() {
  // Define contract addresses
  // const usdtTokenAddress = "0x04f868C5b3F0A100a207c7e9312946cC2c48a7a3";
  const marketplaceEOA = "0x97Da4bA4Cc43FD8011bEB7A71978d8c8c87a5287";

  // Deploy the USDT token contract (if needed)
  // If the contract is already deployed, you can use its address directly.
  const USDT = await ethers.getContractFactory("USDT");
  const usdtToken = await USDT.deploy(ethers.parseUnits("1000000", 6));
  await usdtToken.waitForDeployment();
  const usdtTokenAddress = await usdtToken.getAddress();
  console.log("USDT deployed to:", usdtTokenAddress);

  // Deploy the Payment contract
  const Payment = await ethers.getContractFactory("Payment");
  const payment = await Payment.deploy(usdtTokenAddress, marketplaceEOA);
  await payment.waitForDeployment();
  console.log("Payment contract deployed to: ", await payment.getAddress());

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