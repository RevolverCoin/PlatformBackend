'use strict'

const express = require('express')
const isEmpty = require('lodash/isEmpty')
const mongoose = require('mongoose')
const Post = require('../../models/post')
const User = require('../../models/user')

const { getSupporting } = require('../../core/core')

const {
  isLoggedIn, preparePosts, prepareUsers
} = require('../../utils/utils')
const postRoutes = express.Router()




function hasNexPage(page, count, pageSize) {
  return page < Math.ceil(count / pageSize)
}

async function fetchPosts(searchParam, pageSize, page) {
  const documents = await Post
    .aggregate([
      {"$lookup": {
        "from": 'users',
        "localField": 'userId',
        "foreignField": '_id',
        "as": 'user'
      }} ,
      {'$unwind':'$user'},
      {
        '$project': {
        'user.password':0
      }
      },
      {'$match': searchParam},
      {'$sort': { createdAt: -1} },
      {'$skip': pageSize * (page - 1)},
      {'$limit': pageSize },
    ])


  //fetch count to check if we have next page
  const count = await Post.find(searchParam).count().exec()
  const hasNextPage = hasNexPage(page, count, pageSize)

  if (documents.length) {
    return {
      posts: preparePosts(documents),
      hasNextPage,
      nextPageId: hasNextPage ? page + 1 : undefined
    }
  }

  return null
}


postRoutes.get('/posts', isLoggedIn, async (request, response) => {
  const responseData = {
    success: false,
  }
  const {
    pageId: pageIdParam,
    pageSize: pageSizeParam,
    userId: userIdParam
  } = request.query

  const pageSize = parseInt(pageSizeParam) || 10
  const page = parseInt(pageIdParam) || 1
  responseData.data = await fetchPosts({
    userId: mongoose.Types.ObjectId(userIdParam)
  }, pageSize, page)
  responseData.success = true
  response.json(responseData)
})

postRoutes.get('/posts/search', isLoggedIn, async (request, response) => {
  const responseData = {
    success: false,
  }
  const {
    pageId: pageIdParam,
    pageSize: pageSizeParam,
    query: searchStringParam,
  } = request.query

  const searchParam = {
    text: {
      '$regex': searchStringParam,
      '$options': 'i'
    }
  }

  const pageSize = parseInt(pageSizeParam) || 10
  const page = parseInt(pageIdParam) || 1
  responseData.data = await fetchPosts(searchParam, pageSize, page)
  responseData.success = true
  response.json(responseData)
})

postRoutes.get('/posts/my', isLoggedIn, async (request, response) => {
  const responseData = {
    success: false,
  }
  const {
    pageId: pageIdParam,
    pageSize: pageSizeParam
  } = request.query

  const pageSize = parseInt(pageSizeParam) || 10
  const page = parseInt(pageIdParam) || 1
  responseData.data = await fetchPosts({
    userId:  mongoose.Types.ObjectId(request.user._id)
  }, pageSize, page)

  responseData.success = true
  response.json(responseData)
})

postRoutes.post('/post/add', isLoggedIn, (request, response) => {
  
  const responseData = {
    success: false,
    data: {},
    errors: []
  }

  if (!isEmpty(request.user)) {
    const {
      expanded,
      text
    } = request.body

    const {
      _id: userId
    } = request.user

    if (text != '') {
      const newPostData = {
        text: request.body.text,
        userId,
        createdAt: new Date()
      }

      Post.create(newPostData, async (error, document) => {
        if (error) {
          responseData.errors.push({
            type: 'critical',
            message: error
          })
        } else {
          const postId = document._id

          if (postId) {

            const user = await User.findById(userId)
            const [userInfo] = user ? prepareUsers(user) : []

            responseData.data = {
              id: postId,
              timestamp: newPostData.createdAt,
              ...(expanded ? {
                user: {
                  id: userId,
                  username: userInfo.username,
                  avatar: userInfo.avatar
                },
                text: newPostData.text,
              } : {}) //include other post fields
            }
            responseData.success = true
          } else {
            responseData.errors.push({
              type: 'default',
              message: 'TRY_AGAIN'
            })
          }
        }

        response.json(responseData)
      })
    } else {
      responseData.errors.push({
        type: 'warning',
        message: 'EMPTY_POST'
      })

      response.json(responseData)
    }
  } else {
    responseData.errors.push({
      type: 'critical',
      message: 'NOT_SIGNED_IN'
    })

    response.json(responseData)
  }
})

postRoutes.get('/post/:postId', isLoggedIn, (request, response) => {
  const responseData = {
    success: false,
    data: {},
    errors: []
  }

  if (request.params.postId) {
    Post.find({
      _id: request.params.postId
    }).exec((error, documents) => {
      if (documents && documents.length > 0) {
        responseData.data = documents[0]
        responseData.success = true
      }

      response.json(responseData)
    })
  } else {
    response.json(responseData)
  }
})

/**
 * GET /timeline
 */
postRoutes.get('/timeline', isLoggedIn, async (request, response) => {
  try {

    const userId = request.user._id

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user id')
    }

    const user = await User.findById(userId)
      .lean()
      .exec()
    const userAddress = user.address

    // get all addresses supported by userAddress
    let result = await getSupporting(userAddress)
    let supportAddresses = result.data.supports.map(item => (item.addressTo)) 

    const users = await User.find({ address: { $in: supportAddresses } })
      .lean()
      .exec()

    const userIds = users.map(user=>user._id);
    const posts =  await Post.find({
      userId:  { $in: userIds }
    }).populate('userId');

    response.json({
      success: true,
      data: posts
    })
  } catch (e) {
    console.log(e)
    response.json({success: false})
  }

})


/**
 * GET /discover
 */
postRoutes.get('/discover', isLoggedIn, async (request, response) => {
  try {

    const userId = request.user._id

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user id')
    }

    const user = await User.findById(userId)
      .lean()
      .exec()
    const userAddress = user.address

    // get all addresses supported by userAddress
    let result = await getSupporting(userAddress)
    let addresses = result.data.supports.map(item => (item.addressTo)) 

    // add myself
    addresses.push(userAddress)

    // find all users who not in this list
    const users = await User.find({ address: { $nin: addresses } })
      .lean()
      .exec()

    const userIds = users.map(user=>user._id);
    const posts =  await Post.find({
      userId:  { $in: userIds }
    }, null, {sort: {createdAt: -1}}).populate('userId');

    response.json({
      success: true,
      data: posts
    })
  } catch (e) {
    console.log(e)
    response.json({success: false})
  }

})


module.exports = postRoutes
