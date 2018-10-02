const express = require('express')
const mongoose = require('mongoose')

const User = require('../../models/user')
const { isLoggedIn, cleanObject } = require('../../utils/utils')

const postRoutes = express.Router()

//converts internal mongodb scheme to response-compatible user format
//(omits private fields like password etc)
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
postRoutes.get('/users/:id', isLoggedIn, async (request, response) => {
  try {
    const { id } = request.params

    const user = await User.findById(id)
      .lean()
      .exec()
    const [converted] = user ? prepareUsers(user) : []

    response.json({
      success: true,
      data: {
        ...converted,
      },
    })
  } catch (e) {
    response.json({
      success: false,
    })
  }
})

postRoutes.get('/users/:id/supporting', isLoggedIn, async (request, response) => {
  try {
    const users = await User.find({})

    const converted = users.length ? prepareUsers(...users) : undefined
    
    response.json({
      success: true,
      data: converted,
    })     

  } catch (e) {
    response.json({
      success: false,
    })
  }
})

postRoutes.get('/users/:id/supported', isLoggedIn, async (request, response) => {


  try {
    const users = await User.find({})

    const converted = users.length ? prepareUsers(...users) : undefined
    
    response.json({
      success: true,
      data: converted,
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
      data: {
        ...converted,
      },
    })
  } catch (e) {
    response.json({
      success: false,
    })
  }
})

postRoutes.get('/profile', isLoggedIn, async (request, response) => {
  const responseData = {
    success: false,
  }

  const userId = request.user._id

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error('Invalid user id')
  }

  const user = await User.findById(userId)
    .lean()
    .exec()
  const [converted] = user ? prepareUsers(user) : []
  responseData.data = converted

  responseData.success = true
  response.json(responseData)
})

module.exports = postRoutes
