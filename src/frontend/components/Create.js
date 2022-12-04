import { useState } from 'react'
import { ethers } from "ethers"
import { Row, Form, Button } from 'react-bootstrap'

import { create as ipfsHttpClient } from 'ipfs-http-client'
import { NFTStorage,File } from 'nft.storage'
import mime from 'mime'

import * as PushAPI from "@pushprotocol/restapi"; 



const fs = require('fs'),
    fsp = fs.promises;
const fetch = require('node-fetch');
const FormData = require('form-data');


const NFTPortPrivateKey = `77bec83c-36ac-4130-8a24-d7ad6cc8b8c4`
const contractAddress = `0x7df7c1399a2d42e74b1a13ea5c3d313d178bf541`

const { Revise } = require("revise-sdk");
const AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjA1ZjU2NzI4LTFiZDktNGQ3NS05NzkxLTQ2Yjk3ZmNhZWNhNSIsImtleSI6Imtyams2c2IwIiwiaWF0IjoxNjcwMDg3Mjg0fQ.mfgN0LfnEh8QzYg9tRcxi_RD9289nGGaFvPF_DPMFLQ";
const revise = new Revise({auth: AUTH_TOKEN});

const Create = ({ marketplace, nft,account}) => {
  const [image, setImage] = useState('')
  const [price, setPrice] = useState(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [area, setArea] = useState('')
  const [beds, setBeds] = useState('')
  const [predDisplay, setPredDisplay] = useState('')
  const [metadata_uri,setMetaDataUri] = useState()
  const [reviseID,setReviseID] = useState()

  const PK = "2870ad1f27470f803b07ed18e97f0230d1bb262aa1329fd14154444a0c97dfd4"
  const Pkey = `0x${PK}`;
  const signer = new ethers.Wallet(Pkey)  


  const uploadToIPFS = async (event) => {
    //loading files
    event.preventDefault()
    const file = event.target.files[0];

    const form = new FormData();
    //const fileStream = fs.createReadStream(file.name,{encoding: 'UTF-8'});
    form.append('file', file);

    if (typeof file !== 'undefined') {
      try {
        const options = {
            method: 'POST',
            body: form,
            headers: {
              'Authorization': NFTPortPrivateKey,
            },
          };
          

        fetch('https://api.nftport.xyz/v0/files', options)
            .then(response => {
              return response.json()
            })
            .then(responseJson => {
              // Handle the response
              console.log(responseJson);
              setImage(responseJson['ipfs_url']);
        })
      } catch (error){
        console.log("ipfs image upload error: ", error)
      }
    }
  }

  const createNFT = async() => {
        if (!image || !price || !name || !description){
            console.log("EMPTY FIELDs")
            return
        } 

        try{

          // //-----------------------------Revise-----------------------------------------------------
          console.log(name)
          const collection = await revise.addCollection({name: name, uri: name})
          console.log(collection)
          

          const minted = await revise.addNFT({
                image:image, 
                name:name, 
                tokenId:name, 
                description:description,
              },[
                {price: price},
                {sold:"false"}
              ], collection.id)
          
          console.log("REVISSEEE")
          console.log(minted.id)
          
          setReviseID(minted.id)

          // //-----------------------------End of Revise-----------------------------------------------------

            //-----------------------------NFTPort-----------------------------------------------
            const options = {
                method: 'POST',
                headers: {'Content-Type': 'application/json', 'Authorization': NFTPortPrivateKey},               
                body: JSON.stringify({
                  name:name,
                  description:description,
                  file_url: image,
                  custom_fields: {
                    totalPrice:price,
                    sold:"false", 
                    reviseID:reviseID
                  }
                })
            };

            fetch('https://api.nftport.xyz/v0/metadata', options)
                .then(response => response.json())
                .then(
                    async (response) => {
                        // approve marketplace to spend nft
                        await(await nft.setApprovalForAll(marketplace.address, true)).wait()

                        const mintOptions = {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json', Authorization: NFTPortPrivateKey},
                            body: JSON.stringify({
                              "chain":"goerli",
                              "contract_address": contractAddress,
                              "metadata_uri": response["metadata_uri"],
                              "mint_to_address": account,
                              "max_transaction_fee":price
                            })
                        };

                        console.log("CREATE")
                        console.log(response)
            
                        fetch('https://api.nftport.xyz/v0/mints/customizable', mintOptions)
                            .then(response => response.json())
                            .then(response => {
                                PushAPI.payloads.sendNotification({
                                  signer,
                                  type: 3, // target
                                  identityType: 2, // direct payload
                                  notification: {
                                    title: `Congratulations`,
                                    body: `Congratulations`
                                  },
                                  payload: {
                                    title: `Congratulations! ${name} is now on sale`,
                                    body: `Congratulations. Your house ${name} is now live on the marketplace`,
                                    cta: '',
                                    img: ''
                                  },
                                  recipients: `eip155:5:${account}`, // recipient address
                                  channel: 'eip155:5:0x9D93C2aF39BD4A120b02a62D19F63F6015b42162', // your channel address
                                  env: 'staging'
                                }); 
                            })
                            .catch(err => console.error(err));
                       }
                )
                .catch(err => console.error(err));
              //-----------------------------End of NFTPort-----------------------------------------------

                       

        } catch(error) {
            console.log("Error in creating NFT ", error)
        }
    }

  const getPredictPrice = async () => {
    setPredDisplay('Loading....')
    if (area == null || beds == null) return;
    const res_dummy = await fetch(`https://80cc-2405-204-519f-2ecd-791c-8895-910-b127.in.ngrok.io/predict/${area}/${beds}`, {
      method: "get",
      headers: new Headers({
        "ngrok-skip-browser-warning": "69420",
      }),
    });
    const res = await fetch(`https://80cc-2405-204-519f-2ecd-791c-8895-910-b127.in.ngrok.io/predict/${area}/${beds}`, {
      method: "get",
      headers: new Headers({
        "ngrok-skip-browser-warning": "69420",
      }),
    });
    const resText = await res.text()
    const reqIdx1 = resText.indexOf('[')
    const reqIdx2 = resText.indexOf(']')
    if (reqIdx1 == -1 || reqIdx2 == -1) return;
    const jsonString = resText.substring(reqIdx1, reqIdx2+1)
    const jsonObject = JSON.parse(jsonString)
    console.log(jsonObject)
    setPredDisplay('Estimated Price: ' + (jsonObject[jsonObject.length - 1].payload / 1269.34).toString())
  }



  return (
    <div className="container-fluid mt-5">
      <div className="row">
        <main role="main" className="col-lg-12 mx-auto" style={{ maxWidth: '1000px' }}>
          <div className="content mx-auto">
            <Row className="g-4">
              <Form.Control
                type="file"
                required
                name="file"
                onChange={uploadToIPFS}
              />
              <Form.Control onChange={(e) => setName(e.target.value)} size="lg" required type="text" placeholder="Name" />
              <Form.Control onChange={(e) => setDescription(e.target.value)} size="lg" required as="textarea" placeholder="Description" />
              <Form.Control onChange={(e) => setArea(e.target.value)} size="lg" required type="number" placeholder="Area" />
              <Form.Control onChange={(e) => setBeds(e.target.value)} size="lg" required type="number" placeholder="Beds" />
              <Button variant="secondary" size="lg" onClick={getPredictPrice}>Predict Price</Button>
              <Form.Control value={predDisplay} size="lg" disabled type="text" />
              <Form.Control onChange={(e) => setPrice(e.target.value)} size="lg" required type="number" placeholder="Price in ETH" />
              <div className="d-grid px-0">
                {(image === '' || price === null || name === '' || description === '')?
                  <div>
                    {/* <p>Please wait while we upload your data!</p> */}
                    <Button variant="primary" size="lg" disabled>
                      Sell your House!
                    </Button>
                  </div>:
                  <div>
                    <Button onClick={createNFT} variant="primary" size="lg">
                      Sell your House!
                    </Button>
                </div>
                }
              </div>
            </Row>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Create