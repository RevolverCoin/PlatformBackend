const config = require('../config')
const fetch = require('node-fetch')


function CreateAddress(type) {
    return fetch(`${config.COREURL}/address/new`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({type}),
    }).then(res => res.json())
    
}

function CreateSupport(addressFrom, addressTo) {
    return fetch(`${config.COREURL}/support`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({addressFrom, addressTo}),
    }).then(res => res.json())
    
}

function DeleteSupport(addressFrom, addressTo) {
  return fetch(`${config.COREURL}/support`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({addressFrom, addressTo}),
  }).then(res => res.json())
  
}

function GetSupporting(address) {
  return fetch(`${config.COREURL}/address/supporting/${address}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }    
  }).then(res => res.json()).catch(e=>console.log(e))
}

function GetSupported(address) {
  return fetch(`${config.COREURL}/address/supported/${address}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }    
  }).then(res => res.json())
}



module.exports = {CreateAddress, CreateSupport, DeleteSupport, GetSupporting, GetSupported};
