import { ethers } from "hardhat";
import { assert, expect } from "chai";
import { moveTime } from "../utils/move-time";
import impersonateFundTransfer from "../utils/fundsTransferImpersonator";
import { BlackhardNFT, Marketplace, USDT } from "../typechain-types";

const fetchEndTime = () => {
  const durationInSeconds = 7 * 24 * 60 * 60; // 1 day in seconds

  // Get the current timestamp in seconds
  const currentTimestampInSeconds = Math.floor(Date.now() / 1000);

  // Calculate the future timestamp by adding the duration
  const futureTimestampInSeconds =
    currentTimestampInSeconds + durationInSeconds;
  return futureTimestampInSeconds;
};

// MARKETPLACE TEST
describe("Marketplace Flow", async () => {
  let marketplace: Marketplace;
  let blackhard: BlackhardNFT;
  let usdtToken: USDT;

  let addressWithTOken = "0xe7804c37c13166ff0b37f5ae0bb07a3aebb6e245";
  // let tokenContractAddress = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"
  let usdtTokenContractAddress = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";
  let daiTokenContractAddresss = "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063";

  let game = {
    title: "Grand Theft Auto 6",
    description: "Grand theft auto Game rights",
    price: ethers.parseUnits("5"),
    assetURI: "www.grandTheftAuto",
    category: 0,
    gameTitleDbId: "362adas0-as212",
  };

  beforeEach(async () => {
    // marketplace = await ethers.getContract("Marketplace");
    // blackhard = await ethers.getContract("BlackhardNFT");

    // Deploy the Payment contract
    const BlackhardNFTContract = await ethers.getContractFactory(
      "BlackhardNFT"
    );
    blackhard = await BlackhardNFTContract.deploy();
    await blackhard.waitForDeployment();

    // Deploy a mock ERC20 token (USDT) with 6 decimals
    const MockERC20 = await ethers.getContractFactory("USDT");
    usdtToken = await MockERC20.deploy(ethers.parseUnits("1000000", 6));
    await usdtToken.waitForDeployment();
    let usdtAddress = await usdtToken.getAddress();
    console.log(usdtAddress, "ADddress");

    // Deploy a mock ERC20 token (USDT) with 6 decimals
    const MarketplaceContract = await ethers.getContractFactory("Marketplace");
    marketplace = await MarketplaceContract.deploy(
      await blackhard.getAddress(),
      usdtAddress,
      daiTokenContractAddresss
    );
    await marketplace.waitForDeployment();
  });

  // marketplace part
  // it should start Auction
  it("should start Auction", async () => {
    let nftTx = await blackhard.mintNFT(game);
    await nftTx.wait();

    let endTime = fetchEndTime();
    let marketplaceTx = await marketplace.startAuction(
      0,
      endTime,
      ethers.parseUnits("2", 6),
      "123"
    );
    await marketplaceTx.wait();
    let auctionItem = await marketplace.auctions("123");

    assert(auctionItem.started == true);
  });

  // should cancel auction
  it("should cancel auction", async () => {
    let nftTx = await blackhard.mintNFT(game);
    await nftTx.wait();
    let endTime = fetchEndTime();
    let marketplaceTx = await marketplace.startAuction(
      0,
      endTime,
      ethers.parseUnits("1000"),
      "123"
    );
    await marketplaceTx.wait();
    let cancelAuctionTx = await marketplace.cancelAuction("123");
    let auctionItem = await marketplace.auctions("123");

    await cancelAuctionTx.wait();
    assert(auctionItem.started == false);
  });

  // should place bid
  it("should place bid", async () => {
    const [sender, __, ___, bidder] = await ethers.getSigners();
    let nftTx = await blackhard.mintNFT(game);
    await nftTx.wait();
    let endTime = fetchEndTime();
    await impersonateFundTransfer(
      sender,
      usdtToken,
      addressWithTOken,
      usdtTokenContractAddress,
      "10000",
      bidder.address
    );

    let balance = await usdtToken.balanceOf(bidder);
    let marketplaceTx = await marketplace.startAuction(
      0,
      endTime,
      ethers.parseUnits("1000", 6),
      "123"
    );
    await marketplaceTx.wait();

    let minimumBid = await marketplace.minimumBid();
    let bidderItem = await marketplace.highestBids("123");
    let bidAmountToPlace =
      Number(ethers.formatUnits(bidderItem.bid, 6)) +
      Number(ethers.formatUnits(minimumBid, 6));

    // fetch reserve price in the case of highestBid being zero
    let auctionReserved = await marketplace.auctions("123");

    if (Number(ethers.formatUnits(bidderItem.bid, 6)) == 0) {
      bidAmountToPlace =
        Number(ethers.formatUnits(auctionReserved.reservePrice, 6)) +
        Number(ethers.formatUnits(minimumBid, 6));
    }

    await usdtToken
      .connect(bidder)
      .approve(
        await marketplace.getAddress(),
        ethers.parseUnits(bidAmountToPlace.toString(), 6)
      );

    let placeBidTx = await marketplace
      .connect(bidder)
      .placeBid(
        "123",
        ethers.parseUnits(bidAmountToPlace.toString(), 6),
        await usdtToken.getAddress()
      );
    await placeBidTx.wait();

    let newHighestbidderItem = await marketplace.highestBids("123");
    expect(Number(ethers.formatUnits(newHighestbidderItem.bid, 6))).equal(
      bidAmountToPlace
    );
  });

  // it should result auction
  it("should result & confirm auction", async () => {
    let [sender, __, ___, bidder] = await ethers.getSigners();

    let nftTx = await blackhard.mintNFT(game);
    await nftTx.wait();
    let endTime = fetchEndTime();
    await impersonateFundTransfer(
      sender,
      usdtToken,
      addressWithTOken,
      usdtTokenContractAddress,
      "10000",
      bidder.address
    );

    let balance = await usdtToken.balanceOf(bidder);
    let marketplaceTx = await marketplace.startAuction(
      0,
      endTime,
      ethers.parseUnits("1000", 6),
      "123"
    );
    await marketplaceTx.wait();

    let minimumBid = await marketplace.minimumBid();
    let bidderItem = await marketplace.highestBids("123");
    let bidAmountToPlace =
      Number(ethers.formatUnits(bidderItem.bid, 6)) +
      Number(ethers.formatUnits(minimumBid, 6));

    // fetch reserve price in the case of highestBid being zero
    let auctionReserved = await marketplace.auctions("123");

    if (ethers.formatUnits(bidderItem.bid, 6)) {
      bidAmountToPlace =
        Number(ethers.formatUnits(auctionReserved.reservePrice, 6)) +
        Number(ethers.formatUnits(minimumBid, 6));
    }

    await usdtToken
      .connect(bidder)
      .approve(
        await marketplace.getAddress(),
        ethers.parseUnits(bidAmountToPlace.toString(), 6)
      );

    let placeBidTx = await marketplace
      .connect(bidder)
      .placeBid(
        "123",
        ethers.parseUnits(bidAmountToPlace.toString(), 6),
        await usdtToken.getAddress()
      );
    await placeBidTx.wait();

    await moveTime(endTime + 1000);
    let resultAuctiontx = await marketplace.resultAuction(
      "123",
      game.gameTitleDbId
    );
    await resultAuctiontx.wait();
    let newAuction = await marketplace.auctions("123");

    let confirmTx = await marketplace.connect(bidder).confirmAuction("123");
    await confirmTx.wait();
    let newConfirm = await marketplace.auctions("123");
    assert(newAuction.resulted == true && newConfirm.confirmed);
  });

  // // it should confirm auction
  // it("should confirm auction", async () => {
  //   let [sender, __, ___, bidder] = await ethers.getSigners();

  //   let nftTx = await blackhard.mintNFT(game);
  //   await nftTx.wait();
  //   let endTime = fetchEndTime();

  //   await impersonateFundTransfer(
  //     sender,
  //     usdtToken,
  //     addressWithTOken,
  //     usdtTokenContractAddress,
  //     "10000",
  //     bidder.address
  //   );

  //   let balance = await usdtToken.balanceOf(bidder);
  //   let marketplaceTx = await marketplace.startAuction(
  //     0,
  //     endTime,
  //     ethers.parseUnits("1000", 6),
  //     "123"
  //   );
  //   await marketplaceTx.wait();

  //   let minimumBid = await marketplace.minimumBid();
  //   let bidderItem = await marketplace.highestBids("123");
  //   let bidAmountToPlace =
  //     Number(ethers.formatUnits(bidderItem.bid, 6)) +
  //     Number(ethers.formatUnits(minimumBid, 6));

  //   // fetch reserve price in the case of highestBid being zero
  //   let auctionReserved = await marketplace.auctions("123");

  //   if (ethers.formatUnits(bidderItem.bid, 6)) {
  //     bidAmountToPlace =
  //       Number(ethers.formatUnits(auctionReserved.reservePrice, 6)) +
  //       Number(ethers.formatUnits(minimumBid, 6));
  //   }

  //   await usdtToken
  //     .connect(bidder)
  //     .approve(
  //       await marketplace.getAddress(),
  //       ethers.parseUnits(bidAmountToPlace.toString(), 6)
  //     );

  //   let placeBidTx = await marketplace
  //     .connect(bidder)
  //     .placeBid(
  //       "123",
  //       ethers.parseUnits(bidAmountToPlace.toString(), 6),
  //       await usdtToken.getAddress()
  //     );
  //   await placeBidTx.wait();

  //   // Move time after the bid is placed
  //   await moveTime(endTime + 1000);

  //   let resultAuctiontx = await marketplace.resultAuction(
  //     "123",
  //     game.gameTitleDbId
  //   );
  //   await resultAuctiontx.wait();
  //   let newAuction = await marketplace.auctions("123");

  //   let confirmTx = await marketplace.connect(bidder).confirmAuction("123");
  //   await confirmTx.wait();

  //   let newAuctionItem = await marketplace.auctions("123");
  //   assert(newAuctionItem.confirmed == true);
  // });
});
