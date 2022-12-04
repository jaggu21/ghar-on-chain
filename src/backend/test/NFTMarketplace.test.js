 const {expect} = require("chai"); 
const { ethers } = require("hardhat");

const toWei = (num) => ethers.utils.parseEther(num.toString())
const fromWei = (num) => ethers.utils.formatEther(num);

 describe("NFTMarketplace",function() {
     let deployer,addr1,addr2,addrs,nft,marketplace; 
     let feePercent = 1; 
     let URI = "Sample URI";
     
     
     beforeEach(async function(){
        //getting contracts
        const NFT = await ethers.getContractFactory("NFT");
        const Marketplace = await ethers.getContractFactory("Marketplace"); 

        [deployer,addr1,addr2,...addrs] = await ethers.getSigners()

        //deploying contracts
        nft = await NFT.deploy()
        marketplace = await Marketplace.deploy(feePercent);
     });

     //test for deployement
     describe("Deployement",function(){
         it("should track name and symbol of the nft collection", async function(){
             expect(await nft.name()).to.equal("ghar-on-chain");
             expect(await nft.symbol()).to.equal("DAPP");
         })

         it("should track feeAccount and feePercent of the marketplace", async function(){
            expect(await marketplace.feeAccount()).to.equal(deployer.address);
            expect(await marketplace.feePercent()).to.equal(feePercent);
        })
     })

     //test minting
     describe("Minting",function(){
        it("should track each minted NFT", async function(){
            //say addr1 mints the nft 
            await nft.connect(addr1).mint(URI);
            expect(await nft.tokenCount()).to.equal(1);
            expect(await nft.balanceOf(addr1.address)).to.equal(1);  
            expect(await nft.tokenURI(1)).to.equal(URI);

            //say addr2 minted
            await nft.connect(addr2).mint(URI);
            expect(await nft.tokenCount()).to.equal(2);
            expect(await nft.balanceOf(addr1.address)).to.equal(1);  
            expect(await nft.tokenURI(2)).to.equal(URI);
        })
    })

    //testing creating a new item 
    describe("Creating new item",function(){
        beforeEach(async function(){
            //addr1 mints a new nft 
            await nft.connect(addr1).mint(URI); 

            //addr1 approves marketplace to list nft 
            //this is required to call transferFrom function
            await nft.connect(addr1).setApprovalForAll(marketplace.address,true);
        })

        it("Should track new item, transfer NFT from seller to marketplace", async function(){
            //addr1 offers the minted nft for sale at price 1 ether
            await expect(marketplace.connect(addr1).makeItem(nft.address,1,toWei(1)))
                .to.emit(marketplace,"Offered")
                .withArgs(1,nft.address,1,toWei(1),addr1.address)

            //check if the marketplace of the NFT
            expect(await nft.ownerOf(1)).to.equal(marketplace.address);

            expect(await marketplace.itemCount()).to.equal(1); 

            // Get item from items mapping then check fields to ensure they are correct
            const item = await marketplace.items(1)
            expect(item.itemId).to.equal(1)
            expect(item.nft).to.equal(nft.address)
            expect(item.tokenId).to.equal(1)
            expect(item.price).to.equal(toWei(1))
            expect(item.sold).to.equal(false)
        }); 

        it("price is zero",async function(){
            await expect(
                marketplace.connect(addr1).makeItem(nft.address, 1, 0)
            ).to.be.revertedWith("Price must be greater than zero");
        })
    })

    //test transfer an nft
    describe("Purchasing marketplace items", function () {
        let price = 2
        let fee = (feePercent/100)*price
        let totalPriceInWei
        beforeEach(async function () {
          // addr1 mints an nft
          await nft.connect(addr1).mint(URI)
          // addr1 approves marketplace to spend tokens
          await nft.connect(addr1).setApprovalForAll(marketplace.address, true)
          // addr1 makes their nft a marketplace item.
          await marketplace.connect(addr1).makeItem(nft.address, 1 , toWei(price))
        })


        it("Should update item as sold, pay seller, transfer NFT to buyer, charge fees and emit a Bought event", async function () {
          const sellerInitalEthBal = await addr1.getBalance()
          const feeAccountInitialEthBal = await deployer.getBalance()
          // fetch items total price (market fees + item price)
          totalPriceInWei = await marketplace.getTotalPrice(1);
          // addr 2 purchases item.
          await expect(marketplace.connect(addr2).purchaseItem(1, {value: totalPriceInWei}))
          .to.emit(marketplace, "Bought")
            .withArgs(
              1,
              nft.address,
              1,
              toWei(price),
              addr1.address,
              addr2.address
            )
          const sellerFinalEthBal = await addr1.getBalance()
          const feeAccountFinalEthBal = await deployer.getBalance()
          // Item should be marked as sold
          expect((await marketplace.items(1)).sold).to.equal(true)
          // Seller should receive payment for the price of the NFT sold.
          expect(+fromWei(sellerFinalEthBal)).to.equal(+price + +fromWei(sellerInitalEthBal))
          // feeAccount should receive fee
          expect(+fromWei(feeAccountFinalEthBal)).to.equal(+fee + +fromWei(feeAccountInitialEthBal))
          // The buyer should now own the nft
          expect(await nft.ownerOf(1)).to.equal(addr2.address);
        })


        it("Should fail for invalid item ids, sold items and when not enough ether is paid", async function () {
          // fails for invalid item ids
          await expect(
            marketplace.connect(addr2).purchaseItem(2, {value: totalPriceInWei})
          ).to.be.revertedWith("item doesn't exist");
          await expect(
            marketplace.connect(addr2).purchaseItem(0, {value: totalPriceInWei})
          ).to.be.revertedWith("item doesn't exist");
          // Fails when not enough ether is paid with the transaction. 
          // In this instance, fails when buyer only sends enough ether to cover the price of the nft
          // not the additional market fee.
          await expect(
            marketplace.connect(addr2).purchaseItem(1, {value: toWei(price)})
          ).to.be.revertedWith("not enough ether to purchase"); 
          // addr2 purchases item 1
          await marketplace.connect(addr2).purchaseItem(1, {value: totalPriceInWei})
          // addr3 tries purchasing item 1 after its been sold 
          const addr3 = addrs[0]
          await expect(
            marketplace.connect(addr3).purchaseItem(1, {value: totalPriceInWei})
          ).to.be.revertedWith("item already sold");
        });
    })
 })