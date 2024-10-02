import { ethers } from "hardhat";
import { assert, expect } from "chai";
import { BidTracker, USDT } from "../typechain-types";

describe("BidTracker Contract", async () => {
  let bidTracker: BidTracker;
  let usdtToken: USDT;

  let marketplaceEOA = "0xE6D45d43bC7028fC170a9C3d72d45bA7b61B8DfA";
  let auctionId = "auction123";
  let sellerDbId = "sellerDb123";
  let buyerDbId = "buyerDb123";
  let gameTitleId = "game123";
  let sellerAddress: string;

  beforeEach(async () => {
    // Deploy a mock USDT token
    const MockUSDT = await ethers.getContractFactory("USDT");
    usdtToken = await MockUSDT.deploy(ethers.parseUnits("1000000", 6));
    await usdtToken.waitForDeployment();
    const [deployer, seller] = await ethers.getSigners();

    // Deploy the BidTracker contract
    const BidTrackerContract = await ethers.getContractFactory("BidTracker");
    bidTracker = await BidTrackerContract.deploy(
      await usdtToken.getAddress(),
      deployer.address
    );
    await bidTracker.waitForDeployment();
    console.log(await bidTracker.getAddress(), "ADDRESSADFS");

    // Set a random seller address
    sellerAddress = seller.address;

    // Register seller address in auction
    await bidTracker.connect(deployer).setAuctionSellerWallet(auctionId);
  });

  it("should fulfill bid with USDT transfer", async () => {
    const [sender, buyer] = await ethers.getSigners();

    await usdtToken.transfer(buyer.address, ethers.parseUnits("200", 6));
    const bidAmount = ethers.parseUnits("100", 6); // 100 USDT

    // Buyer approves the USDT transfer to the BidTracker contract
    await usdtToken
      .connect(buyer)
      .approve(await bidTracker.getAddress(), bidAmount);

    // Fulfill the bid
    let fulfillBidTx = await bidTracker
      .connect(buyer)
      .FulfillBid(
        auctionId,
        sellerDbId,
        bidAmount,
        true,
        buyerDbId,
        gameTitleId
      );
    await fulfillBidTx.wait();

    // Validate the fulfilled bid
    let fulfilledBid = await bidTracker.fetchSingleFulfilledBid(auctionId);
    console.log(
      fulfilledBid,
      "FULFILLED BID",
      buyer.address,
      fulfilledBid.buyer
    );
    expect(fulfilledBid.bidAmount).to.equal(bidAmount);
    expect(fulfilledBid.started).to.be.true;
    expect(fulfilledBid.resulted).to.be.true;
    expect(fulfilledBid.buyer).to.equal(buyer.address);
    expect(fulfilledBid.seller).to.equal(sender.address);
  });

  it("should confirm and transfer USDT to seller", async () => {
    const [_, buyer] = await ethers.getSigners();
    await usdtToken.transfer(buyer.address, ethers.parseUnits("200", 6));

    const bidAmount = ethers.parseUnits("100", 6);

    // Fulfill the bid (as in the previous test)
    await usdtToken
      .connect(buyer)
      .approve(await bidTracker.getAddress(), bidAmount);
    await bidTracker
      .connect(buyer)
      .FulfillBid(
        auctionId,
        sellerDbId,
        bidAmount,
        true,
        buyerDbId,
        gameTitleId
      );

    // Check initial seller's balance
    let initialSellerBalance = await usdtToken.balanceOf(sellerAddress);

    // Confirm the auction
    let confirmAuctionTx = await bidTracker
      .connect(buyer)
      .confirmPaidAuction(auctionId);
    await confirmAuctionTx.wait();

    // Validate transfer to seller
    let finalSellerBalance = await usdtToken.balanceOf(sellerAddress);
    expect(ethers.formatUnits(finalSellerBalance, 6)).to.equal(
      ethers.formatUnits(initialSellerBalance, 6)
    );

    // Validate the bid is confirmed
    let fulfilledBid = await bidTracker.fetchSingleFulfilledBid(auctionId);
    expect(fulfilledBid.confirmed).to.be.true;
  });

  it("should fail when non-buyer tries to confirm the auction", async () => {
    const [_, buyer, nonBuyer] = await ethers.getSigners();
    await usdtToken.transfer(buyer.address, ethers.parseUnits("200", 6));

    const bidAmount = ethers.parseUnits("100", 6);

    // Fulfill the bid
    await usdtToken
      .connect(buyer)
      .approve(await bidTracker.getAddress(), bidAmount);
    await bidTracker
      .connect(buyer)
      .FulfillBid(
        auctionId,
        sellerDbId,
        bidAmount,
        true,
        buyerDbId,
        gameTitleId
      );

    // Try to confirm the auction with a different account (non-buyer)
    await expect(
      bidTracker.connect(nonBuyer).confirmPaidAuction(auctionId)
    ).to.be.revertedWith("Address does not belong to buyer");
  });

  it("should transfer USDT out from contract by owner", async () => {
    const [owner, _, recipient] = await ethers.getSigners();

    const amount = ethers.parseUnits("500", 6);

    // Transfer 500 USDT to the contract
    await usdtToken.transfer(await bidTracker.getAddress(), amount);

    // Owner transfers the USDT out to a recipient
    let transferOutTx = await bidTracker
      .connect(owner)
      .transferOutUSDTToken(amount, recipient.address);
    await transferOutTx.wait();

    // Check the recipient's balance
    let recipientBalance = await usdtToken.balanceOf(recipient.address);
    expect(recipientBalance).to.equal(amount);
  });

  it("should fail to transfer out USDT if not the owner", async () => {
    const [_, nonOwner, recipient] = await ethers.getSigners();
    const amount = ethers.parseUnits("500", 6);

    // Transfer 500 USDT to the contract
    await usdtToken.transfer(await bidTracker.getAddress(), amount);

    // Try to transfer USDT out with a non-owner account
    await expect(
      bidTracker
        .connect(nonOwner)
        .transferOutUSDTToken(amount, recipient.address)
    ).to.be.rejected;
  });
});
