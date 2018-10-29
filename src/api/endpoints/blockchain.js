const express = require('express')
const mongoose = require('mongoose')
const { isLoggedIn, prepareUsers } = require('../../utils/utils')
const { send, getTransactions, getRewardTransactions, getServiceInfo } = require('../../core/core')
const User = require('../../models/user')

const blockchainRoutes = express.Router()

/**
 * send
 */
blockchainRoutes.post('/send', isLoggedIn, async (request, response) => {
  const responseData = {
    success: false,
  }

  try {
    const { addressFrom, addressTo, amount } = request.body
    const requestData = { addressFrom, addressTo, amount }

    await send(requestData.addressFrom, requestData.addressTo, requestData.amount)

    responseData.success = true
    response.json(responseData)
  } catch (e) {
    response.json(responseData)
  }
})


/**
 * transactions
 */
blockchainRoutes.get('/transactions', isLoggedIn, async (request, response) => {
    const responseData = {
      success: false,
    }
  
    try {
      const userId = request.user._id
  
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user id')
      }
  
      // get profile info
      const user = await User.findById(userId)
      const [userInfo] = user ? prepareUsers(user) : []
      
      const address = userInfo.address
      if (!address) return response.json(responseData)
  
      const txs = await getTransactions(address)
  
      responseData.success = true
      responseData.data = txs
  
      response.json(responseData)
    } catch (e) {
      responseData.error=e.toString()
      response.json(responseData)
    }
  })

/**
 * rewardtransactions
 */
blockchainRoutes.get('/rewardtransactions', isLoggedIn, async (request, response) => {
  const responseData = {
    success: false,
  }

  try {
    const userId = request.user._id

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user id')
    }

    // get profile info
    const user = await User.findById(userId)
    const [userInfo] = user ? prepareUsers(user) : []
    
    const address = userInfo.address
    if (!address) return response.json(responseData)

    const txs = await getRewardTransactions(address)

    responseData.success = true
    responseData.data = txs

    response.json(responseData)
  } catch (e) {
    responseData.error=e.toString()
    response.json(responseData)
  }
})

/**
 * /service/info
 */
blockchainRoutes.get('/service/info', isLoggedIn, async (request, response) => {
  const responseData = {
    success: false,
  }

  try {
    const info = await getServiceInfo()

    responseData.success = true
    responseData.data = info.data

    response.json(responseData)
  } catch (e) {
    responseData.error=e.toString()
    response.json(responseData)
  }
})


module.exports = blockchainRoutes
