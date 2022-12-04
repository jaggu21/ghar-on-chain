// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol"; 

contract NFT is ERC721URIStorage{
    //state variables 
    uint public tokenCount; 

    //constructor
    //calling constructor of ERC721 contract
    constructor() ERC721("ghar-on-chain","DAPP"){}

    //mint NFT
    //_tokenURI is the link to the content of NFT on IPFS
    //external-this funcation cannot be called within the contract and can be called outside the xontract
    function mint(string memory _tokenURI) external returns (uint) {
        tokenCount++; 
        _safeMint(msg.sender, tokenCount);
        _setTokenURI(tokenCount, _tokenURI);
        return(tokenCount);
    }
}
