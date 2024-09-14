// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);

    function allowance(
        address owner,
        address spender
    ) external view returns (uint256);

    function approve(address spender, uint256 amount) external returns (bool);
}

contract Payment {
    address payable public marketplaceEOA;
    IERC20 public usdtToken;

    struct Transaction {
        address buyer;
        string sellerPublicEmail;
        string orderRef;
        uint256 amount;
        string[] gameId;
        uint256 timestamp;
    }

    Transaction[] public transactions;

    event PaymentMade(
        address indexed buyer,
        uint256 amount,
        string[] gameId,
        uint256 timestamp
    );

    event PaymentApproval(
        address indexed buyer,
        address indexed approvee,
        uint256 amount,
        uint256 timestamp
    );

    constructor(address _usdtTokenAddress, address payable _marketplaceEOA) {
        usdtToken = IERC20(_usdtTokenAddress);
        marketplaceEOA = _marketplaceEOA;
    }

    function approvePayment(uint256 _amount) public {
        usdtToken.approve(address(this), _amount);
        emit PaymentApproval(
            msg.sender,
            address(this),
            _amount,
            block.timestamp
        );
    }

    function payForGame(
        string memory _sellerPublicEmail,
        string memory _orderRef,
        string[] memory _gameId,
        uint256 _amount
    ) public {
        require(_amount > 0, "Amount must be greater than zero");

        uint256 allowance = usdtToken.allowance(msg.sender, address(this));
        require(allowance >= _amount, "Token allowance too low");

        // Transfer USDT from buyer to marketplace's EOA
        require(
            usdtToken.transferFrom(msg.sender, marketplaceEOA, _amount),
            "Transfer failed"
        );

        // Record the transaction
        transactions.push(
            Transaction({
                buyer: msg.sender,
                sellerPublicEmail: _sellerPublicEmail,
                orderRef: _orderRef,
                amount: _amount,
                gameId: _gameId,
                timestamp: block.timestamp
            })
        );

        emit PaymentMade(msg.sender, _amount, _gameId, block.timestamp);
    }

    // Retrieve a specific transaction by orderRef
    function getTransactionByOrderRef(
        string memory _orderRef
    )
        public
        view
        returns (
            address,
            string memory,
            string memory,
            uint256,
            string[] memory,
            uint256
        )
    {
        for (uint256 i = 0; i < transactions.length; i++) {
            if (
                keccak256(abi.encodePacked(transactions[i].orderRef)) ==
                keccak256(abi.encodePacked(_orderRef))
            ) {
                Transaction memory transaction = transactions[i];
                return (
                    transaction.buyer,
                    transaction.sellerPublicEmail,
                    transaction.orderRef,
                    transaction.amount,
                    transaction.gameId,
                    transaction.timestamp
                );
            }
        }

        revert("Transaction not found");
    }

    // Get the number of transactions
    function getTransactionCount() public view returns (uint256) {
        return transactions.length;
    }
}
