'use strict'

const express = require('express')
const isEmpty = require('lodash/isEmpty')
const mongoose = require('mongoose')
const Post = require('../../models/post')
const User = require('../../models/user')

const { getSupporting } = require('../../core/core')

const { isLoggedIn, preparePosts, prepareUsers, checkHasNextPage } = require('../../utils/utils')
const postRoutes = express.Router()


async function fetchPosts(searchParam, pageSize, page) {
  const documents = await Post.aggregate([
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    {
      $project: {
        'user.password': 0,
      },
    },
    { $match: searchParam },
    { $sort: { createdAt: -1 } },
    { $skip: pageSize * (page - 1) },
    { $limit: pageSize },
  ])

  //fetch count to check if we have next page
  const count = await Post.find(searchParam)
    .count()
    .exec()
  const hasNextPage = checkHasNextPage(page, count, pageSize)

  if (documents.length) {
    return {
      posts: preparePosts(documents),
      hasNextPage,
      nextPageId: hasNextPage ? page + 1 : undefined,
    }
  }

  return {
    posts: [],
    hasNextPage: false
  }
}

postRoutes.get('/posts', isLoggedIn, async (request, response) => {
  const responseData = {
    success: false,
  }

  try {
    const { pageId: pageIdParam, pageSize: pageSizeParam, userId: userIdParam } = request.query

    const pageSize = parseInt(pageSizeParam) || 10
    const page = parseInt(pageIdParam) || 1
    responseData.data = await fetchPosts(
      {
        userId: mongoose.Types.ObjectId(userIdParam),
      },
      pageSize,
      page,
    )
    responseData.success = true
    response.json(responseData)
  } catch (e) {
    console.log(e)
    response.json({ success: false })
  }
})

postRoutes.get('/posts/search', isLoggedIn, async (request, response) => {

  try {

    const { pageId: pageIdParam, pageSize: pageSizeParam, query: searchStringParam } = request.query

    const searchParam = {
      text: {
        $regex: searchStringParam,
        $options: 'i',
      },
    }

    const pageSize = parseInt(pageSizeParam) || 10
    const page = parseInt(pageIdParam) || 1
    const posts = await fetchPosts(searchParam, pageSize, page)

    response.json({
      success: true,
      data: posts
    })
  } catch (e) {
    console.log(e)
    response.json({ success: false })
  }
})

postRoutes.get('/posts/my', isLoggedIn, async (request, response) => {
  const responseData = {
    success: false,
  }
  const { pageId: pageIdParam, pageSize: pageSizeParam } = request.query

  const pageSize = parseInt(pageSizeParam) || 10
  const page = parseInt(pageIdParam) || 1
  responseData.data = await fetchPosts(
    {
      userId: mongoose.Types.ObjectId(request.user._id),
    },
    pageSize,
    page,
  )

  responseData.success = true
  response.json(responseData)
})

postRoutes.post('/post/add', isLoggedIn, (request, response) => {
  const responseData = {
    success: false,
    data: {},
    errors: [],
  }

  if (!isEmpty(request.user)) {
    const { expanded, text } = request.body

    const { _id: userId } = request.user

    if (text != '') {
      const newPostData = {
        text: request.body.text,
        userId,
        createdAt: new Date(),
      }

      Post.create(newPostData, async (error, document) => {
        if (error) {
          responseData.errors.push({
            type: 'critical',
            message: error,
          })
        } else {
          const postId = document._id

          if (postId) {
            const user = await User.findById(userId)
            const [userInfo] = user ? prepareUsers(user) : []

            responseData.data = {
              _id: postId,
              timestamp: newPostData.createdAt,
              ...(expanded
                ? {
                    user: {
                      id: userId,
                      username: userInfo.username,
                      avatar: userInfo.avatar,
                    },
                    text: newPostData.text,
                  }
                : {}), //include other post fields
            }
            responseData.success = true
          } else {
            responseData.errors.push({
              type: 'default',
              message: 'TRY_AGAIN',
            })
          }
        }

        response.json(responseData)
      })
    } else {
      responseData.errors.push({
        type: 'warning',
        message: 'EMPTY_POST',
      })

      response.json(responseData)
    }
  } else {
    responseData.errors.push({
      type: 'critical',
      message: 'NOT_SIGNED_IN',
    })

    response.json(responseData)
  }
})

postRoutes.get('/post/:postId', isLoggedIn, (request, response) => {
  const responseData = {
    success: false,
    data: {},
    errors: [],
  }

  if (request.params.postId) {
    Post.find({
      _id: request.params.postId,
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

/*
  public view post endpoint
*/
postRoutes.get('/public/post/:postId',  (request, response) => {
  const responseData = {
    success: false,
    data: {},
    errors: [],
  }

  if (request.params.postId) {
    Post.find({
      _id: request.params.postId,
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

    // pageId starts from 1
    const { pageId: pageIdParam, pageSize: pageSizeParam } = request.query

    const pageSize = parseInt(pageSizeParam) || 10
    const pageId = parseInt(pageIdParam) || 1

    const user = await User.findById(userId)
    const userAddress = user.address

    // get all addresses supported by userAddress
    let result = await getSupporting(userAddress)
    let supportAddresses = result.data.supports.map(item => item.addressTo)

    const users = await User.find({ address: { $in: supportAddresses } })

    const userIds = users.map(user => user._id)
    const posts = await Post.find(
      {
        userId: { $in: userIds },
      },
      { text: 1, createdAt: 1, likes: 1 },
      {
        sort: { createdAt: -1 },
        skip: pageSize * (pageId - 1),
        limit: pageSize,
      },
    ).populate('userId', { _id: 1, username: 1, avatar: 1 })

    // calculate total count of docs
    const count = await Post.count({
      userId: { $in: userIds },
    })

    // calculate next page
    const hasNextPage = checkHasNextPage(pageId, count, pageSize)

    response.json({
      success: true,
      data: {
        posts,
        hasNextPage,
        nextPageId: hasNextPage ? pageId + 1 : undefined,
      },
    })
  } catch (e) {
    console.log(e)
    response.json({ success: false })
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

    // pageId starts from 1
    const { pageId: pageIdParam, pageSize: pageSizeParam } = request.query

    const pageSize = parseInt(pageSizeParam) || 10
    const pageId = parseInt(pageIdParam) || 1

    const user = await User.findById(userId)
    const userAddress = user.address

    // get all addresses supported by userAddress
    let result = await getSupporting(userAddress)
    let addresses = result.data.supports.map(item => item.addressTo)

    // add myself
    addresses.push(userAddress)

    // find all users who not in this list
    const users = await User.find({ address: { $nin: addresses } })

    const userIds = users.map(user => user._id)

    // request posts
    const posts = await Post.find(
      {
        userId: { $in: userIds },
      },
      { text: 1, createdAt: 1, likes: 1 },
      {
        sort: { createdAt: -1 },
        skip: pageSize * (pageId - 1),
        limit: pageSize,
      },
    ).populate('userId', { _id: 1, username: 1, avatar: 1 })

    // calculate total count of docs
    const count = await Post.count({
      userId: { $in: userIds },
    })

    // calculate next page
    const hasNextPage = checkHasNextPage(pageId, count, pageSize)

    response.json({
      success: true,
      data: {
        posts,
        hasNextPage,
        nextPageId: hasNextPage ? pageId + 1 : undefined,
      },
    })
  } catch (e) {
    console.log(e)
    response.json({ success: false })
  }
})

/**
 * POST /posts/like
 */
postRoutes.post('/posts/like', isLoggedIn, async (request, response) => {
  try {
    const userId = request.user._id

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user id')
    }

    const { postId } = request.body

    const user = await User.findById(userId)
    if (!user) throw new Error('User not found')

    const post = await Post.findById(postId, { likes: 1 })
    if (!post) throw new Error('Post not found')

    const found = post.likes.find(item => item.toString() === userId.toString())
    if (typeof found !== 'undefined') throw new Error('Like already assigned by this user')

    const result = await Post.findByIdAndUpdate(
      postId,
      { $push: { likes: userId } },
      { new: true, lean: true },
    )
    if (!result) throw new Error('Internal Error')

    response.json({
      success: true,
      data: result,
    })
  } catch (e) {
    console.log(e)
    response.json({ success: false, message: e.message })
  }
})

module.exports = postRoutes
