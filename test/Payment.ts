import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";

describe("Payment Contract", function () {
  let Payment: Contract;
  let usdtToken: Contract;
  let owner: any;
  let buyer: any;
  let marketplaceEOA: any;

  beforeEach(async function () {
    // Get signers
    [owner, buyer, marketplaceEOA] = await ethers.getSigners();

    // Deploy a mock ERC20 token (USDT) with 6 decimals
    const MockERC20 = await ethers.getContractFactory("USDT");
    usdtToken = await MockERC20.deploy(ethers.parseUnits("10000", 6));
    await usdtToken.waitForDeployment();
    let usdtAddress = await usdtToken.getAddress();
    console.log(
      usdtAddress,
      "USDT TOKEN",
      marketplaceEOA.address,
      buyer.address
    );
    // Deploy the Payment contract
    const PaymentContract = await ethers.getContractFactory("Payment");
    Payment = await PaymentContract.deploy(usdtAddress, marketplaceEOA.address);
    await Payment.waitForDeployment();

    // Transfer some USDT to the buyer
    await usdtToken.transfer(buyer.address, ethers.parseUnits("100", 6));
  });

  it("should approve payment", async function () {
    const amountToApprove = ethers.parseUnits("50", 6);
    let PaymentAddress = await Payment.getAddress();
    // Connect buyer to the Payment contract and approve payment
    await usdtToken.connect(buyer).approve(PaymentAddress, amountToApprove);

    // // Call the approvePayment function in the contract
    // await expect(Payment.connect(buyer).approvePayment(amountToApprove))
    //   .to.emit(Payment, "PaymentApproval")
    //   .withArgs(
    //     buyer.address,
    //     PaymentAddress,
    //     amountToApprove,
    //     (
    //       await ethers.provider.getBlock("latest")
    //     ).timestamp
    //   );

    // Check that the allowance is correctly set
    const allowance = await usdtToken.allowance(buyer.address, PaymentAddress);
    console.log(
      "ALLOWANCE " + allowance,
      "AMOUNT TO APPROVE " + amountToApprove
    );
    expect(allowance).to.equal(amountToApprove);
  });

  it("should pay for a game", async function () {
    const gameId = "game123";
    const amountToPay = ethers.parseUnits("30", 6);
    let PaymentAddress = await Payment.getAddress();
    // Approve the contract to spend buyer's USDT tokens
    await usdtToken.connect(buyer).approve(PaymentAddress, amountToPay);

    // Call payForGame function
    await Payment.connect(buyer).payForGame(
      "norbertmbafrank@gmail.com",
      "123",
      [gameId],
      amountToPay
    );
    // await expect(Payment.connect(buyer).payForGame(gameId, amountToPay))
    //   .to.emit(Payment, "PaymentMade")
    //   .withArgs(
    //     buyer.address,
    //     amountToPay,
    //     gameId,
    //     (
    //       await ethers.provider.getBlock("latest")
    //     ).timestamp
    //   );

    // Check that the marketplace received the USDT
    const marketplaceBalance = await usdtToken.balanceOf(
      marketplaceEOA.address
    );
    expect(marketplaceBalance).to.equal(amountToPay);

    // Check if the transaction is recorded
    const transactionOrder = await Payment.getTransactionByOrderRef("123");
    // expect(transaction.buyer).to.equal(buyer.address);
    console.log(transactionOrder, "TRANSACTIONS", amountToPay);

    expect(transactionOrder[3]).to.equal(amountToPay);

    expect(transactionOrder[4][0]).to.equal(gameId);
  });

  it("should not allow payment if allowance is too low", async function () {
    const gameId = "game456";
    const amountToPay = ethers.parseUnits("100", 6);
    let PaymentAddress = await Payment.getAddress();
    // Approve only a lower amount than required
    await usdtToken
      .connect(buyer)
      .approve(PaymentAddress, ethers.parseUnits("50", 6));

    // Attempt to pay for the game, expecting a revert
    await expect(
      Payment.connect(buyer).payForGame(
        "norbertmbafrank@gmail.com",
        "123",
        [gameId],
        amountToPay
      )
    ).to.be.revertedWith("Token allowance too low");
  });
});
