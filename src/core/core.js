const config = require('../config')
const fetch = require('node-fetch')


function createAddress(type) {
    return fetch(`${config.COREURL}/address/new`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({type}),
    }).then(res => res.json())
    
}

function createSupport(addressFrom, addressTo) {
    return fetch(`${config.COREURL}/support`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({addressFrom, addressTo}),
    }).then(res => res.json())
    
}

function deleteSupport(addressFrom, addressTo) {
  return fetch(`${config.COREURL}/support`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({addressFrom, addressTo}),
  }).then(res => res.json())
  
}

function getSupporting(address) {
  return fetch(`${config.COREURL}/address/supporting/${address}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }    
  }).then(res => res.json()).catch(e=>console.log(e))
}

function getSupported(address) {
  return fetch(`${config.COREURL}/address/supported/${address}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }    
  }).then(res => res.json())
}


function getBalance(address) {
  return (
    fetch(`${config.COREURL}/blockchain/${address}/balance`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })).then(res => res.json())
}

function send(addressFrom, addressTo, amount) {
  return (
    fetch(`${config.COREURL}/blockchain/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({addressFrom, addressTo, amount}),
    })).then(res => res.json())
}

function getTransactions(address) {
  return (
    fetch(`${config.COREURL}/blockchain/${address}/transactions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })).then(res => res.json())
}


function getRewardTransactions(address) {
  return (
    fetch(`${config.COREURL}/blockchain/${address}/rewardtransactions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })).then(res => res.json())
}


function getServiceInfo()
{
  return (
    fetch(`${config.COREURL}/service/info`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })).then(res => res.json())
}

function getType(address)
{
  return (
    fetch(`${config.COREURL}/address/${address}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })).then(res => res.json())

}

function claimGenerator(address) 
{
  return (
    fetch(`${config.COREURL}/blockchain/claimgenerator`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({address}),
    })).then(res => res.json())
}

function unclaimGenerator(address)
{
  return (
    fetch(`${config.COREURL}/blockchain/unclaimgenerator`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({address}),
    })).then(res => res.json())
}

module.exports = {
  createAddress, 
  createSupport, 
  deleteSupport, 
  getSupporting, 
  getSupported, 
  getBalance, 
  getType,
  send, 
  getTransactions, 
  getRewardTransactions,
  getServiceInfo,
  claimGenerator,
  unclaimGenerator
};
