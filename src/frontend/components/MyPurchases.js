import { useState, useEffect } from 'react'
import { ethers } from "ethers"
import { Row, Col, Card,Button} from 'react-bootstrap'


const NFTPortPrivateKey = `77bec83c-36ac-4130-8a24-d7ad6cc8b8c4`
const contractAddress = `0x7df7c1399a2d42e74b1a13ea5c3d313d178bf541`

const { Revise } = require("revise-sdk");
const AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjA1ZjU2NzI4LTFiZDktNGQ3NS05NzkxLTQ2Yjk3ZmNhZWNhNSIsImtleSI6ImJ1czl0djZ5IiwiaWF0IjoxNjcwMDA0MDcyfQ.AO0L_zs-9d--jzUoSn0NZbLknR-_cdZSp2CzKkRDQL0";
const revise = new Revise({auth: AUTH_TOKEN});


export default function MyPurchases({ marketplace, nft, account }) {
  const [loading, setLoading] = useState(true)
  const [purchases, setPurchases] = useState([])
  
  const loadPurchasedItems = async () => {
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: NFTPortPrivateKey
      }
    };
    
    fetch(`https://api.nftport.xyz/v0/accounts/${account}?chain=goerli&page_size=50&include=metadata`, options)
      .then(response => response.json())
      .then(response => {
          
          const itemCount = response.nfts.length
          let purchasedItems = []

          let totalPrice = 0; 

          for(let i = 0;i<itemCount;i++){
            try{
              totalPrice = parseFloat(response.nfts[i].metadata.price); 
              if(response.nfts[i].metadata.price === null){
                totalPrice = 0.1; 
              }
            }catch(error){
              totalPrice = 0.1;
            }

            purchasedItems.push({
                totalPrice:totalPrice,
                itemId:response.nfts[i].token_id, 
                seller:response.nfts[i].owner, 
                name:response.nfts[i].metadata.name,
                description:response.nfts[i].metadata.description,
                image:response.nfts[i].metadata.image
              })
            
          }

          setLoading(false)
          setPurchases(purchasedItems)
        }
      )
      .catch(err => console.error(err));
  }

  const updateNFT = async (nftID) => {

  }
  
  useEffect(() => {
    loadPurchasedItems()
  }, [])
  if (loading) return (
    <main style={{ padding: "1rem 0" }}>
      <h2 style={{color:"white"}}>Loading...</h2>
    </main>
  )
  return (
    <div className="flex justify-center">
      {purchases.length > 0 ?
        <div className="px-5 container">
          <Row xs={1} md={2} lg={4} className="g-4 py-5">
            {purchases.map((item, idx) => (
              <Col key={idx} className="overflow-hidden">
                <Card>
                  <Card.Img variant="top" src={item.image} />
                  <Card.Body>
                      <Button onClick = {()=> updateNFT()} variant="primary" size="lg"> Update </Button>
                  </Card.Body>
                  <Card.Footer>{item.name + " " +item.totalPrice} ETH</Card.Footer>
                  
                </Card>
              </Col>
            ))}
          </Row>
        </div>
        : (
          <main style={{ padding: "1rem 0" }}>
            <h2>No purchases</h2>
          </main>
        )}
    </div>
  );
}