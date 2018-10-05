const express = require('express')
const mongoose = require('mongoose')

const User = require('../../models/user')
const { isLoggedIn, cleanObject } = require('../../utils/utils')

const { CreateSupport, DeleteSupport, GetSupporting, GetSupported } = require('../../core/core')

const postRoutes = express.Router()

/**
 *converts internal mongodb scheme to response-compatible user format
 *(omits private fields like password etc)
 */
function prepareUsers(...users) {
  return users.map(entry => ({
    id: entry._id,
    desc: entry.desc,
    email: entry.local && entry.local.email,
    address: entry.address,
    avatar: '',
    username: entry.username,
  }))
}

/**
 * get user profile and support lists
 */
postRoutes.get('/users/:id', isLoggedIn, async (request, response) => {
  try {
    const { id } = request.params

    const user = await User.findById(id)
      .lean()
      .exec()
    const [converted] = user ? prepareUsers(user) : []

    // get supporting/supported list for the user
    const supports = {}

    const address = converted.address

    let result = await GetSupporting(address)
    supports.supporting = result.data.supports

    result = await GetSupported(address)
    supports.supported = result.data.supports

    response.json({
      success: true,
      data: {
        profile: converted,
        supports,
      },
    })
  } catch (e) {
    console.log(e)
    response.json({
      success: false,
    })
  }
})

/**
 * get user profile and support lists by address
 */
postRoutes.get('/address/:address', isLoggedIn, async (request, response) => {
  try {
    const { address } = request.params

    const [user] = await User.find({address})
      .lean()
      .exec()

    const [converted] = user ? prepareUsers(user) : []

    // get supporting/supported list for the user
    const supports = {}

    let result = await GetSupporting(address)
    supports.supporting = result.data.supports

    result = await GetSupported(address)
    supports.supported = result.data.supports

    response.json({
      success: true,
      data: {
        profile: converted,
        supports,
      },
    })
  } catch (e) {
    console.log(e)
    response.json({
      success: false,
    })
  }
})


postRoutes.get('/profile/search', isLoggedIn, async (request, response) => {
  const responseData = {
    success: false,
  }
  const { query: searchStringParam } = request.query

  const users = await User.find({
    desc: {
      $regex: searchStringParam,
      $options: 'i',
    },
  })

  const converted = users.length ? prepareUsers(...users) : undefined
  responseData.data = converted
  responseData.success = true
  response.json(responseData)
})

postRoutes.patch('/profile', isLoggedIn, async (request, response) => {
  try {
    const { username, desc } = request.body

    const update = cleanObject({
      username,
      desc,
    })

    const { _id: userId } = request.user

    await User.findOneAndUpdate(
      {
        _id: userId,
      },
      update,
    )

    const user = await User.findById(userId)
      .lean()
      .exec()
    const [converted] = user ? prepareUsers(user) : []

    response.json({
      success: true,
      profile: {
        ...converted,
      },
    })
  } catch (e) {
    response.json({
      success: false,
    })
  }
})

/**
 * Load info: profile, supports, etc
 */
postRoutes.get('/info', isLoggedIn, async (request, response) => {
  try {

    const userId = request.user._id

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user id')
    }

    // get profile info
    const user = await User.findById(userId)
      .lean()
      .exec()
    const [converted] = user ? prepareUsers(user) : []

    // get supporting/supported list for the user
    const supports = {}
    const address = converted.address
    let result = await GetSupporting(address)
    supports.supporting = result.data.supports

    result = await GetSupported(address)
    supports.supported = result.data.supports

    // get balance etc
    // ...

    response.json({
      success: true,
      data: {
        profile: converted,
        supports,
      },
    })
  } catch (e) {
    console.log(e)
    response.json(responseData)
  }
})

/**
 * CORE Bridge: CreateSupport
 */
postRoutes.post('/support', isLoggedIn, async (request, response) => {
  const responseData = {
    success: false,
  }

  try {
    const requestData = ({ addressFrom, addressTo } = request.body)
    await CreateSupport(requestData.addressFrom, requestData.addressTo)

    responseData.success = true
    response.json(responseData)
  } catch (e) {
    console.log(e)
    response.json(responseData)
  }
})

/**
 * CORE Bridge: DeleteSupport
 */
postRoutes.delete('/support', isLoggedIn, async (request, response) => {
  const responseData = {
    success: false,
  }

  try {
    const requestData = ({ addressFrom, addressTo } = request.body)
    await DeleteSupport(requestData.addressFrom, requestData.addressTo)

    responseData.success = true
    response.json(responseData)
  } catch (e) {
    console.log(e)
    response.json(responseData)
  }
})

/**
 * CORE Bridge: GetSupporting
 */

postRoutes.get('/users/:id/supporting', isLoggedIn, async (request, response) => {
  const responseData = {
    success: false,
    supports: null,
  }

  try {
    const userId = request.user._id

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user id')
    }

    // get profile info
    const user = await User.findById(userId)
      .lean()
      .exec()
    const [converted] = user ? prepareUsers(user) : []

    if (converted === 'undefined') return response.json(responseData)
    responseData.profile = converted

    const address = responseData.profile.address
    if (!address) return response.json(responseData)

    // get supports count
    const supportsResponse = await GetSupporting(address)
    if (supportsResponse.error && supportsResponse.error !== 'noError')
      return response.json(responseData)

    responseData.supports = supportsResponse.data.supports

    responseData.success = true
    response.json(responseData)
  } catch (e) {
    console.log(e)
    response.json(responseData)
  }
})

/**
 * CORE Bridge: GetSupported
 */
postRoutes.get('/users/:id/supported', isLoggedIn, async (request, response) => {
  const responseData = {
    success: false,
    supports: null,
  }

  try {
    const userId = request.user._id

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user id')
    }

    // get profile info
    const user = await User.findById(userId)
      .lean()
      .exec()
    const [converted] = user ? prepareUsers(user) : []

    if (converted === 'undefined') return response.json(responseData)
    responseData.profile = converted

    const address = responseData.profile.address
    if (!address) return response.json(responseData)

    // get supports count
    const supportsResponse = await GetSupported(address)
    if (supportsResponse.error && supportsResponse.error !== 'noError')
      return response.json(responseData)

    responseData.supports = supportsResponse.data.supports

    responseData.success = true
    response.json(responseData)
  } catch (e) {
    console.log(e)
    response.json(responseData)
  }
})



module.exports = postRoutes
