// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract BlackhardNFT is Ownable, ERC721URIStorage, ReentrancyGuard {
    uint256 private _tokenIdCounter;

    using Strings for uint256;
    string public baseURI;

    // EVENTS
    event MintedNFT(
        address owner,
        string title,
        string description,
        uint256 price,
        uint256 tokenId,
        string assetURI,
        Categories category
    );

    enum Categories {
        Arcade,
        Action,
        Pocket_billiards
    }

    struct GameAsset {
        address owner;
        string title;
        string description;
        uint256 tokenId;
        uint256 price;
        string assetURI;
        Categories category;
        string gameTitleDbId;
    }

    struct GameAssetInput {
        string title;
        string description;
        uint256 price;
        string assetURI;
        Categories category;
        string gameTitleDbId;
    }

    mapping(string => GameAsset) public gameAssets;

    constructor() ERC721("Blackhard", "BKH") Ownable(msg.sender) {
        // _transferOwnership(msg.sender);
    }

    function mintNFT(GameAssetInput memory game) public returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter += 1;
        gameAssets[game.gameTitleDbId] = GameAsset({
            owner: msg.sender,
            title: game.title,
            description: game.description,
            tokenId: tokenId,
            price: game.price,
            assetURI: game.assetURI,
            category: game.category,
            gameTitleDbId: game.gameTitleDbId
        });

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, game.assetURI);
        emit MintedNFT(
            msg.sender,
            game.title,
            game.description,
            game.price,
            tokenId,
            game.assetURI,
            game.category
        );
        return tokenId;
    }

    function setBaseURI(string memory _baseURIStr) public {
        baseURI = _baseURIStr;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }

    function setPriceGameAsset(
        uint256 _price,
        string memory gameTitleDbid
    ) public {
        gameAssets[gameTitleDbid].price = _price;
    }

    function getNFTItem(
        string memory gameTitleDbId
    ) public view returns (GameAsset memory) {
        return gameAssets[gameTitleDbId];
    }

    function safeTransfer(
        address _from,
        address _to,
        uint256 _tokenId
    ) public nonReentrant {
        _safeTransfer(_from, _to, _tokenId, "");
    }

    function safeTransferFrom(
        address _from,
        address _to,
        uint256 _tokenId,
        bytes memory data
    ) public virtual override(ERC721, IERC721) {
        super.safeTransferFrom(_from, _to, _tokenId, data);
    }

    function safeTransferGameTitle(
        address _from,
        address _to,
        uint256 _tokenId,
        string memory gameTitleDbId
    ) public {
        safeTransfer(_from, _to, _tokenId);
        
        GameAsset storage gameAsset = gameAssets[gameTitleDbId];
        gameAsset.owner = _to;
    }

}
