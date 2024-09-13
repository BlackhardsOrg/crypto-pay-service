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
    ) external view returns (uint256); // Add this line

    function approve(address spender, uint256 amount) external returns (bool); // Optionally add this line if needed
}

contract Payment {
    address payable public marketplaceEOA;
    IERC20 public usdtToken;

    struct Transaction {
        address buyer;
        uint256 amount;
        string gameId;
        uint256 timestamp;
    }

    Transaction[] public transactions;

    event PaymentMade(
        address indexed buyer,
        uint256 amount,
        string gameId,
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

    function payForGame(string memory _gameId, uint256 _amount) public {
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
                amount: _amount,
                gameId: _gameId,
                timestamp: block.timestamp
            })
        );

        emit PaymentMade(msg.sender, _amount, _gameId, block.timestamp);
    }

    // Retrieve a specific transaction
    function getTransaction(
        uint256 _index
    ) public view returns (address, uint256, string memory, uint256) {
        Transaction memory transaction = transactions[_index];
        return (
            transaction.buyer,
            transaction.amount,
            transaction.gameId,
            transaction.timestamp
        );
    }

    // Get the number of transactions
    function getTransactionCount() public view returns (uint256) {
        return transactions.length;
    }
}
