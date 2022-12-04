// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Marketplace is ReentrancyGuard{
    //state variable 
    
    address payable public immutable feeAccount; //the account receives this much fee
    uint public immutable feePercent; //fee perecent on sales
    uint public itemCount; 

    struct Item{
        uint itemId; 
        IERC721 nft; 
        uint tokenId; 
        uint price; 
        address payable seller; 
        bool sold; 
    }

    //itemId -> Item 
    mapping(uint => Item) public items; 

    //event after creating nft
    event Offered(
        uint itemId, 
        address indexed nft, 
        uint tokenId, 
        uint price, 
        address indexed seller
    ); 

    //event after selling nft
    
    event Bought(
        uint itemId, 
        address indexed nft, 
        uint tokenId, 
        uint price, 
        address indexed seller,
        address indexed buyer
    ); 

    //constructor
    constructor(uint _feePercent){
        feeAccount = payable(msg.sender); 
        feePercent = _feePercent; 
    }

    //make item
    function makeItem(IERC721 _nft,uint _tokenId,uint _price) external nonReentrant{
        require(_price > 0,"Price must be greater than zero"); 
        itemCount++; 
        _nft.transferFrom(msg.sender,address(this),_tokenId); 

        //add new item to the map 
        items[itemCount] = Item(itemCount,_nft,_tokenId,_price,payable(msg.sender),false); 

        //event allows us to log data to blockchain 
        emit Offered(itemCount, address(_nft), _tokenId, _price, msg.sender);
    }

    //buy item 
    function purchaseItem(uint _itemId) external payable nonReentrant{
        uint _totalPrice = getTotalPrice(_itemId);
        Item storage item = items[_itemId]; 
        require(_itemId > 0 && _itemId <= itemCount,"item doesn't exist");
        require(msg.value >= _totalPrice,"not enough ether to purchase"); 
        require(!item.sold,"item already sold"); 

        //pay seller and feeAccount
        item.seller.transfer(item.price); 
        feeAccount.transfer(_totalPrice-item.price); 

        //update states; 
        item.sold = true; 

        //transfer nft
        item.nft.transferFrom(address(this),msg.sender,item.tokenId);

        //emit bought event
        emit Bought(_itemId, address(item.nft), item.tokenId, item.price, item.seller,msg.sender);

    }

    function getTotalPrice(uint _itemId) view public returns(uint){
        return (items[_itemId].price*(100+feePercent)/100);
    }



}