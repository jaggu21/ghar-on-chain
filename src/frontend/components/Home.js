import { useState, useEffect } from 'react'
import { ethers } from "ethers"
import { Row, Col, Card, Button } from 'react-bootstrap'
import { Dropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router'
import './Home.css'
import "./Card.css"

import pic1 from '../../pic1.jpg';
import pic2 from '../../pic2.jpg';
import pic3 from '../../pic3.jpg';


const NFTPortPrivateKey = `77bec83c-36ac-4130-8a24-d7ad6cc8b8c4`
const contractAddress = `0x7df7c1399a2d42e74b1a13ea5c3d313d178bf541`

const Home = ({ marketplace, nft, account }) => {
  const [loading, setLoading] = useState(true)
  //const [response,setResponse] = useState(null)

  //storing the items from blockchain
  //stores array of dictionaries
  const [items, setItems] = useState([])
  const [searchType, setSearchType] = useState('Name')
  const [displayItems, setDisplayItems] = useState([])

  const navigate = useNavigate()
  

  const loadMarketplaceItems = async () => {
    // Load all unsold items

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
          let items = []

          let totalPrice = 0; 
          let isSold = null; 

          for(let i = 0;i<itemCount;i++){
            try{
              totalPrice = parseFloat(response.nfts[i].metadata.price); 
              isSold = response.nfts[i].metadata.sold;
              if(response.nfts[i].metadata.price === null){
                totalPrice = 0.1; 
              }

            }catch(error){
              totalPrice = 0.1;
              isSold = "true"
            }
            
            console.log(response)

            if(response.nfts[i].metadata !== null){
              items.push({
                totalPrice:totalPrice,
                itemId:response.nfts[i].token_id, 
                seller:response.nfts[i].owner, 
                name:response.nfts[i].metadata.name,
                description:response.nfts[i].metadata.description,
                image:response.nfts[i].metadata.image
              })
            }
          }

          setLoading(false)
          setItems(items)

          console.log(items)
        }
      )
      .catch(err => console.error(err));
  }

  const buyMarketItem = async (item) => {

   // await (await marketplace.purchaseItem(item.itemId, { value: item.totalPrice })).wait()

    const options = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        Authorization: NFTPortPrivateKey
      },
      body: JSON.stringify({
        chain: 'goerli',
        contract_address: contractAddress,
        token_id: item.itemId,
        transfer_to_address: account
      })
    };
    
    fetch('https://api.nftport.xyz/v0/mints/transfers', options)
      .then(response => response.json())
      .then(response => console.log(response))
      .catch(err => console.error(err));

    // 

    //need to reload marketplace items 
    //the marketitem that has just been sold will not be displayed anymore
    loadMarketplaceItems()
  }

  const searchQueryFunc = e => {
    if (searchType.includes('Price')) {
      return
    } else {
      const newItems = []
      for (let i = 0;i<items.length;i++) {
        if (searchType == 'Name') {
          console.log(items[i].name.toLowerCase().includes(e.target.value.toLowerCase()))
          console.log(e.target.value.toLowerCase())
          console.log(items[i].name.toLowerCase())
          if (items[i].name.toLowerCase().includes(e.target.value.toLowerCase())) {
            newItems.push({
              ...items[i]
            })
          }
        } else {
          if (items[i].description.toLowerCase().includes(e.target.value.toLowerCase())) {
            newItems.push({
              ...items[i]
            })
          }
        }
      }
      setDisplayItems(newItems)
    }
  }
  

  useEffect(() => {
    loadMarketplaceItems()
  }, [])
  if (loading) return (
    <main style={{ padding: "1rem 0" }}>
      <h2 style={{color:"white"}}>Loading...</h2>
    </main>
  )
  return (
    <div className="flex justify-center ">
      {items.length > 0 ?
        <div className="px-5 container">
          <Row xs={1} md={2} lg={4} className="g-4 py-5">
            {items.map((item, idx) => (
              <Col key={idx} className="overflow-hidden">
                <Card style={{ width: '15rem'}} bg="dark" text='white' className='card'>
                  <Card.Img variant="top" src={item.image} />
                 
                  <Card.Body color="secondary">
                    <Card.Title>{item.name}</Card.Title>
                    <Card.Text>
                      {item.description}
                    </Card.Text>
                  </Card.Body>
                  <Card.Footer>
                    <div className='d-grid'>
                      <Button onClick={() => buyMarketItem(item)} variant="primary" size="lg">
                        Buy for {item.totalPrice} ETH
                      </Button>
                    </div>
                  </Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
        : (
          <main style={{ padding: "1rem 0" }}>
            <h2 style={{color:"white"}}>No listed assets</h2>
          </main>
        )}
    </div>
  );
}
export default Home