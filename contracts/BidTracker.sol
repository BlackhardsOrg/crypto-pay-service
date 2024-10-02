// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "hardhat/console.sol";

contract BidTracker is Ownable, ReentrancyGuard {
    using Math for uint256;
    // Marketplace EOA
    address marketplaceEOA;

    event PlaceBidFulfilled(
        string _auctionId,
        string sellerDbId,
        uint256 bidAmount,
        bool started,
        bool resulted,
        string buyerDbId,
        bool confirmed,
        address seller,
        address buyer,
        string gameTitleId
    );

    event AuctionConfirmed(
        address seller,
        string sellerDbId,
        uint256 bidAmountTransfered,
        string buyerDbId,
        address buyer,
        bool confirmed,
        string auctionId,
        string gameTitleId
    );

    event AmountReceived(address sender, uint256 amount);

    event AmountSent(address indexed to, uint256 amount);

    struct BidFulfilled {
        string _auctionId;
        string sellerDbId;
        uint256 bidAmount;
        bool started;
        bool resulted;
        string buyerDbId;
        bool confirmed;
        address seller;
        address buyer;
        string gameTitleId;
    }

    mapping(string => BidFulfilled) public bidsFulfilled;
    mapping(string => address) private auctionSellersWallet;

    //tokens
    IERC20 public usdtToken;

    //constructor
    constructor(
        address _usdtToken,
        address _marketplaceEOA
    ) Ownable(msg.sender) {
        usdtToken = IERC20(_usdtToken);
        marketplaceEOA = _marketplaceEOA;
    }

    // Update this function to accept stablecoins
    function FulfillBid(
        string memory _auctionId,
        string memory sellerDbId,
        uint256 bidAmount,
        bool started,
        string memory buyerDbId,
        string memory gameTitleId
    ) public nonReentrant {
        BidFulfilled memory bidFulfilled = bidsFulfilled[_auctionId];
        require(
            auctionSellersWallet[_auctionId] != address(0),
            "Seller wallet does not exist"
        );

        bidFulfilled = BidFulfilled(
            _auctionId,
            sellerDbId,
            bidAmount,
            started,
            true,
            buyerDbId,
            false,
            auctionSellersWallet[_auctionId],
            msg.sender,
            gameTitleId
        );

        // Transfer stablecoins from the sender to this contract
        require(
            usdtToken.transferFrom(msg.sender, address(this), bidAmount),
            "USDT transfer failed"
        );

        bidsFulfilled[_auctionId] = bidFulfilled;

        emit PlaceBidFulfilled(
            _auctionId,
            sellerDbId,
            bidAmount,
            started,
            true,
            buyerDbId,
            false,
            auctionSellersWallet[_auctionId],
            msg.sender,
            gameTitleId
        );
    }

    function setAuctionSellerWallet(string memory _auctionId) public {
        require(
            auctionSellersWallet[_auctionId] == address(0),
            "Seller wallet already set for this auction"
        );

        auctionSellersWallet[_auctionId] = msg.sender;
    }

    // Update this function to handle stablecoin transfers
    function confirmPaidAuction(string memory _auctionId) public {
        require(
            msg.sender == bidsFulfilled[_auctionId].buyer,
            "Address does not belong to buyer"
        );

        // Transfer stablecoins from this contract to the seller
        require(
            usdtToken.transfer(
                auctionSellersWallet[_auctionId],
                bidsFulfilled[_auctionId].bidAmount
            ),
            "USDT transfer failed"
        );

        bidsFulfilled[_auctionId].confirmed = true;
        emit AuctionConfirmed(
            bidsFulfilled[_auctionId].seller,
            bidsFulfilled[_auctionId].sellerDbId,
            bidsFulfilled[_auctionId].bidAmount,
            bidsFulfilled[_auctionId].buyerDbId,
            bidsFulfilled[_auctionId].buyer,
            bidsFulfilled[_auctionId].confirmed,
            bidsFulfilled[_auctionId]._auctionId,
            bidsFulfilled[_auctionId].gameTitleId
        );
    }

    function fetchSingleFulfilledBid(
        string memory _auctionId
    ) public view returns (BidFulfilled memory) {
        return bidsFulfilled[_auctionId];
    }

    function transferOutUSDTToken(
        uint256 amount,
        address recipient
    ) public onlyOwner {
        // Transfer stablecoins from this contract to the seller
        require(usdtToken.transfer(recipient, amount), "USDT transfer failed");
    }
}
