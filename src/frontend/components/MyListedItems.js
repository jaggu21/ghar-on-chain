import { useState, useEffect } from 'react'
import { ethers } from "ethers"
import { Row, Col, Card } from 'react-bootstrap'

const NFTPortPrivateKey = `77bec83c-36ac-4130-8a24-d7ad6cc8b8c4`
const contractAddress = `0x7df7c1399a2d42e74b1a13ea5c3d313d178bf541`

function renderSoldItems(items) {
  return (
    <>
      <h2>Sold</h2>
      <Row xs={1} md={2} lg={4} className="g-4 py-3">
        {items.map((item, idx) => (
          <Col key={idx} className="overflow-hidden">
            <Card>
              <Card.Img variant="top" src={item.image} />
              <Card.Footer>
                For {ethers.utils.formatEther(item.totalPrice)} ETH - Recieved {ethers.utils.formatEther(item.price)} ETH
              </Card.Footer>
            </Card>
          </Col>
        ))}
      </Row>
    </>
  )
}

export default function MyListedItems({ marketplace, nft, account }) {

  const [loading, setLoading] = useState(true)
  const [listedItems, setListedItems] = useState([])
  const [soldItems, setSoldItems] = useState([])


  const loadListedItems = async () => {
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: NFTPortPrivateKey
      }
    };
    
    fetch(`https://api.nftport.xyz/v0/nfts/${contractAddress}?chain=goerli&page_number=1&page_size=50&include=metadata&refresh_metadata=false`, options)
      .then(response => response.json())
      .then(response => {
          
          const itemCount = response.nfts.length
          let listedItems = []
          let soldItems = []

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
          
            if(response.nfts[i].creator_address === account){
                listedItems.push({
                  totalPrice:totalPrice,
                  itemId:response.nfts[i].token_id, 
                  seller:response.nfts[i].owner, 
                  name:response.nfts[i].metadata.name,
                  description:response.nfts[i].metadata.description,
                  image:response.nfts[i].metadata.image
                })
            }
          }

          console.log("Listed")
          console.log(response)

          setLoading(false)
          setListedItems(listedItems)
        }
      )
      .catch(err => console.error(err));
  }

  useEffect(() => {
    loadListedItems()
  }, [])
  if (loading) return (
    <main style={{ padding: "1rem 0" }}>
      <h2 style={{color:"white"}}>Loading...</h2>
    </main>
  )
  
  return (
    <div className="flex justify-center">
      {listedItems.length > 0 ?
        <div className="px-5 py-3 container">
            <h2 style={{color:"white"}}>Listed</h2>
          <Row xs={1} md={2} lg={4} className="g-4 py-3">
            {listedItems.map((item, idx) => (
              <Col key={idx} className="overflow-hidden">
                <Card>
                  <Card.Img variant="top" src={item.image} />
                  <Card.Footer>{item.totalPrice} ETH</Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>
            {/* {soldItems.length > 0 && renderSoldItems(soldItems)} */}
        </div>
        : (
          <main style={{ padding: "1rem 0" }}>
            <h2>No listed assets</h2>
          </main>
        )}
    </div>
  );
}