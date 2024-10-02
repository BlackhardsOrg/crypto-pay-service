// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "./BlackhardNFT.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "hardhat/console.sol";

contract Marketplace is Ownable, ReentrancyGuard {
    using Math for uint256;
    // using Counters for Counters.Counter;
    BlackhardNFT gameNFTContract;

    //EVENTS
    event AuctionCreated(
        string auctionId,
        uint256 tokenId,
        address seller,
        uint256 startTime,
        uint256 endTime,
        uint256 reservePrice,
        bool started,
        bool resulted,
        address buyer,
        bool confirmed
    );
    event PlaceBid(
        uint256 bidAmount,
        address bidder,
        uint256 bidTime,
        string auctionId,
        uint256 tokenId
    );
    event AuctionCancelled(
        string auctionId,
        uint256 tokenId,
        address seller,
        bool started
    );
    event AuctionEnded(
        string auctionId,
        address winner,
        uint256 settledPrice,
        bool resulted,
        bool started
    );
    event AuctionConfirmed(
        string auctionId,
        address winner,
        uint256 settledPrice,
        bool confirmed
    );
    event AmountReceived(address sender, uint256 amount);
    event AmountSent(address indexed to, uint256 amount);

    uint256 public minimumBid = 1e6;

    struct Auction {
        uint256 tokenId;
        address seller;
        uint256 startTime;
        uint256 endTime;
        uint256 reservePrice;
        bool started;
        bool resulted;
        address buyer;
        bool confirmed;
    }

    mapping(string => Auction) public auctions;

    struct HighestBidder {
        address bidder;
        uint256 bid;
        uint256 bidTime;
    }

    mapping(string => HighestBidder) public highestBids;

    //tokens
    IERC20 public usdtToken;
    IERC20 public daiToken;

    //constructor
    constructor(
        address _gameNFT,
        address _usdtToken,
        address _daiToken
    ) Ownable(msg.sender) {
        gameNFTContract = BlackhardNFT(_gameNFT);
        usdtToken = IERC20(_usdtToken);
        daiToken = IERC20(_daiToken);
    }

    // Update this function to accept stablecoins
    function startAuction(
        uint256 tokenId,
        uint256 endTime,
        uint256 reservePrice,
        string memory auctionId
    ) external nonReentrant {
        auctions[auctionId] = Auction(
            tokenId,
            msg.sender,
            block.timestamp,
            endTime,
            reservePrice,
            true,
            false,
            address(0),
            false
        );

        emit AuctionCreated(
            auctionId,
            tokenId,
            msg.sender,
            block.timestamp,
            endTime,
            reservePrice,
            true,
            false,
            address(0),
            false
        );
    }

    // Update this function to accept stablecoins
    function placeBid(
        string memory _auctionId,
        uint256 bidAmount,
        address stablecoin
    ) public nonReentrant {
        require(
            block.timestamp < auctions[_auctionId].endTime,
            "Auction has ended"
        );

        require(
            msg.sender != auctions[_auctionId].seller,
            "You are not allowed to place a bid on your own auction."
        );
        require(msg.sender != address(0), "Invalid address");

        HighestBidder memory highestBidder = highestBids[_auctionId];
        uint256 minBid = highestBidder.bid + minimumBid;

        if (highestBidder.bid == 0) {
            minBid = auctions[_auctionId].reservePrice + minimumBid;
        }
        require(bidAmount >= minBid, "Has not exceeded the best bid");

        // Transfer stablecoins from the sender to this contract
        if (stablecoin == address(usdtToken)) {
            require(
                usdtToken.transferFrom(msg.sender, address(this), bidAmount),
                "USDC transfer failed"
            );
        } else if (stablecoin == address(daiToken)) {
            require(
                daiToken.transferFrom(msg.sender, address(this), bidAmount),
                "DAI transfer failed"
            );
        } else {
            revert("Invalid stablecoin");
        }

        if (highestBidder.bid > 0) {
            // Refund the former highest bidder's tokens
            if (stablecoin == address(usdtToken)) {
                require(
                    usdtToken.transfer(highestBidder.bidder, highestBidder.bid),
                    "USDC refund failed"
                );
            } else if (stablecoin == address(daiToken)) {
                require(
                    daiToken.transfer(highestBidder.bidder, highestBidder.bid),
                    "DAI refund failed"
                );
            }
        }

        delete highestBids[_auctionId];
        highestBids[_auctionId] = HighestBidder(
            msg.sender,
            bidAmount,
            block.timestamp
        );

        emit PlaceBid(
            bidAmount,
            msg.sender,
            block.timestamp,
            _auctionId,
            auctions[_auctionId].tokenId
        );
    }

    // Update this function to handle stablecoin transfers
    function resultAuction(
        string memory _auctionId,
        string memory gameTitleDbId
    ) public {
        require(
            auctions[_auctionId].started,
            "The auction has not started yet"
        );
        require(
            block.timestamp > auctions[_auctionId].endTime,
            "The auction has not ended yet"
        );

        HighestBidder memory highestBidder = highestBids[_auctionId];

        // Transfer the NFT from this contract to the highest bidder
        gameNFTContract.safeTransferGameTitle(
            auctions[_auctionId].seller,
            highestBidder.bidder,
            auctions[_auctionId].tokenId,
            gameTitleDbId
        );

        auctions[_auctionId].started = false;
        auctions[_auctionId].resulted = true;
        auctions[_auctionId].buyer = highestBidder.bidder;

        emit AuctionEnded(
            _auctionId,
            highestBidder.bidder,
            highestBidder.bid,
            true,
            false
        );
    }

    // Update this function to handle stablecoin transfers
    function confirmAuction(string memory _auctionId) public {
        require(
            block.timestamp > auctions[_auctionId].endTime,
            "The auction has not ended yet"
        );
        require(
            auctions[_auctionId].resulted,
            "Auction has not been resulted by the seller"
        );
        require(
            auctions[_auctionId].buyer == msg.sender,
            "Only the buyer can confirm auction"
        );

        HighestBidder memory highestBidder = highestBids[_auctionId];

        // Transfer stablecoins from this contract to the seller
        if (address(usdtToken) != address(0)) {
            require(
                usdtToken.transfer(
                    auctions[_auctionId].seller,
                    highestBidder.bid
                ),
                "USDC transfer failed"
            );
        } else if (address(daiToken) != address(0)) {
            require(
                daiToken.transfer(
                    auctions[_auctionId].seller,
                    highestBidder.bid
                ),
                "DAI transfer failed"
            );
        }

        auctions[_auctionId].confirmed = true;

        emit AuctionConfirmed(
            _auctionId,
            highestBidder.bidder,
            highestBidder.bid,
            true
        );
    }

    // ... (other functions remain the same)

    function cancelAuction(string memory _auctionId) public {
        require(
            auctions[_auctionId].seller == msg.sender,
            "You are not the seller"
        );

        auctions[_auctionId].started = false;
        emit AuctionCancelled(
            _auctionId,
            auctions[_auctionId].tokenId,
            msg.sender,
            false
        );
    }

    // Function to receive Ether. msg.data must be empty
    receive() external payable {
        emit AmountReceived(msg.sender, msg.value);
    }

    // Fallback function is called when msg.data is not empty
    fallback() external payable {}

    function sendViaCall(address payable _to, uint256 _amount) public payable {
        // Call returns a boolean value indicating success or failure.
        // This is the current recommended method to use.
        (bool sent /*bytes memory data*/, ) = _to.call{value: _amount}("");
        require(sent, "Failed to send Matic");
        emit AmountSent(_to, _amount);
    }

    function fetchAuction(
        string memory _auctionId
    ) public view returns (Auction memory) {
        return auctions[_auctionId];
    }
}
