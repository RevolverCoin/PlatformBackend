const express = require('express')
const mongoose = require('mongoose')

const User = require('../../models/user')
const {
  isLoggedIn,
  cleanObject,
  prepareUsers,
  getUserVerificationInfo,
  createRandomBase64String,
  checkHasNextPage
} = require('../../utils/utils')

const {
  sendPasswordChangeEmail
} = require('../../core/mailer')

const {
  PASSWORD_RESET_EXPIRY_TIME
} = require('../../config')

const {
  createSupport,
  deleteSupport,
  getSupporting,
  getSupported,
  getBalance,
  getType,
  getTopSupports,
} = require('../../core/core')

const userRoutes = express.Router()


userRoutes.post('/setpwd', async (request, response) => {
  try {
    const {
      id,
      code,
      password
    } = request.body

    const user = await User.findById(id)
    const now = (new Date()).getTime();
    // request hasn't expired and auth code is valid
    if (user && now < user.local.resetExpires && user.local.passwordResetCode === code) {
      // update pwd and nullify reset state

      await User.findOneAndUpdate({
        _id: id
      }, {
        $set: {
          "local.password": user.generateHash(password),
        },
        $unset: {
          "local.passwordResetCode": "",
          "local.resetExpires": "",
        }
      })

      response.json({
        success: true,
      })

    } else {
      response.json({
        success: false,
      })
    }
  } catch (e) {
    console.log(e)
    response.json({
      success: false,
    })
  }
})

userRoutes.get('/users/:id/resetpwd', async (request, response) => {
  try {
    const {
      id
    } = request.params
    const user = await User.findById(id)
    if (user) {
      const now = (new Date()).getTime()
      const verificationCode = createRandomBase64String()
      // update verification flag in DB
      await User.findOneAndUpdate({
        _id: id
      }, {
        $set: {
          "local.passwordResetCode": verificationCode,
          "local.resetExpires": now + PASSWORD_RESET_EXPIRY_TIME
        }
      })
      //send email
      sendPasswordChangeEmail(verificationCode, user.local.email)

      response.json({
        success: true
      })
    } else {
      response.json({
        success: false,
      })
    }
  } catch (e) {
    console.log(e)
    response.json({
      success: false,
    })
  }
})

/**
 * verifies user after account creation
 */
userRoutes.get('/users/:id/verify', async (request, response) => {
  try {
    const {
      id
    } = request.params
    //verification code
    const {
      code
    } = request.query

    const user = await User.findById(id)

    const converted = getUserVerificationInfo(user)

    //checks if user passes verification check
    const isVerificationComplete = () => {
      if (converted) {
        const {
          verificationCode,
          isVerified,
        } = converted
        // either user is already verified or the code matches with the one in DB
        return isVerified || verificationCode === code
      }

      return false
    }

    if (isVerificationComplete()) {
      response.json({
        success: true
      })

      // update verification flag in DB
      await User.findOneAndUpdate({
        _id: id,
      }, {
        isVerified: true
      }, )

    } else {
      response.json({
        success: false
      })

    }



  } catch (e) {
    console.log(e)
    response.json({
      success: false,
    })
  }
})

/**
 * get user profile and support lists
 */
userRoutes.get('/users/:id', isLoggedIn, async (request, response) => {
  try {
    const {
      id
    } = request.params

    const user = await User.findById(id)
      .lean()
      .exec()
    const [converted] = user ? prepareUsers(user) : []

    // get supporting/supported list for the user
    const supports = {}

    const address = converted.address

    let result = await getSupporting(address)
    supports.supporting = result.data.supports

    result = await getSupported(address)
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
userRoutes.get('/address/:address', isLoggedIn, async (request, response) => {
  try {
    const {
      address
    } = request.params

    const [user] = await User.find({
        address
      })
      .lean()
      .exec()

    const [converted] = user ? prepareUsers(user) : []

    // get supporting/supported list for the user
    const supports = {}

    let result = await getSupporting(address)
    supports.supporting = result.data.supports

    result = await getSupported(address)
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

userRoutes.get('/profile/search', isLoggedIn, async (request, response) => {
  try {
    const {
      query: searchStringParam,
      pageId: pageIdParam,
      pageSize: pageSizeParam
    } = request.query

    const pageSize = parseInt(pageSizeParam) || 10
    const pageId = parseInt(pageIdParam) || 1

    const findConditions = {
      $or: [{
          desc: {
            $regex: searchStringParam,
            $options: 'i',
          },
        },
        {
          username: {
            $regex: searchStringParam,
            $options: 'i',
          },
        },
      ],
    }


    const users = await User.find(
      findConditions, {}, {
        skip: pageSize * (pageId - 1),
        limit: pageSize,
      }
    )

    // calculate total count of docs
    const count = await User.count(findConditions)

    // calculate next page
    const hasNextPage = checkHasNextPage(pageId, count, pageSize)

    const converted = users.length ? prepareUsers(...users) : []

    response.json({
      success: true,
      data: {
        users: converted,
        hasNextPage,
        nextPageId: hasNextPage ? pageId + 1 : undefined,
      },
    })

  } catch (e) {
    response.json({
      success: false,
    })
  }
})

/**
 * Update profile
 */
userRoutes.patch('/profile', isLoggedIn, async (request, response) => {
  try {
    const {
      username,
      description,
      avatar,
      website,
      links
    } = request.body

    const update = cleanObject({
      username,
      desc: description,
      avatar,
      website,
      links,
    })

    const {
      _id: userId
    } = request.user

    await User.findOneAndUpdate({
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
userRoutes.get('/info', isLoggedIn, async (request, response) => {
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
    let result = await getSupporting(address)
    supports.supporting = result.data.supports

    result = await getSupported(address)
    supports.supported = result.data.supports

    // get balance etc
    const balance = await getBalance(address)

    // get type
    const type = await getType(address)

    response.json({
      success: true,
      data: {
        profile: converted,
        supports,
        balance: balance.data.balance,
        lockedBalance: balance.data.lockedBalance,
        type: type.data.type,
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
userRoutes.post('/support', isLoggedIn, async (request, response) => {
  const responseData = {
    success: false,
  }

  try {
    const requestData = ({
      addressFrom,
      addressTo
    } = request.body)
    await createSupport(requestData.addressFrom, requestData.addressTo)

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
userRoutes.delete('/support', isLoggedIn, async (request, response) => {
  const responseData = {
    success: false,
  }

  try {
    const {
      addressFrom,
      addressTo
    } = request.body
    const requestData = {
      addressFrom,
      addressTo
    }
    await deleteSupport(requestData.addressFrom, requestData.addressTo)

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

userRoutes.get('/users/:id/supporting', isLoggedIn, async (request, response) => {
  const responseData = {
    success: false,
    supports: null,
  }

  try {
    const userId = request.params.id

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
    const supportsResponse = await getSupporting(address)
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
userRoutes.get('/users/:id/supported', isLoggedIn, async (request, response) => {
  const responseData = {
    success: false,
    supports: null,
  }

  try {
    const userId = request.params.id

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
    const supportsResponse = await getSupported(address)
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
 * CORE Bridge: GetTopSupports
 */
userRoutes.get('/top', isLoggedIn, async (request, response) => {
  const responseData = {
    success: false,
  }

  try {
    const data = await getTopSupports()
    if (data.error && data.error !== 'noError') return response.json(responseData)

    if (!data.data || typeof data.data === 'undefined') {
      return response.json(responseData)
    }

    const addresses = data.data.map(item => item.address)

    const users = await User.find({
      address: {
        $in: addresses
      }
    }, {
      _id: 1,
      desc: 1,
      username: 1,
      avatar: 1,
      address: 1
    }, {
      limit: 100,
      lean: true
    }, )

    const result = users.map(user => {
      const supportCount = data.data.find(item => item.address === user.address).supportCount
      return { ...user,
        supportCount
      }
    })

    result.sort((user1, user2) => {
      return user1.supportCount > user2.supportCount ? -1 : 1
    })

    responseData.success = true
    responseData.data = result
    response.json(responseData)
  } catch (e) {
    console.log(e)
    response.json(responseData)
  }
})

module.exports = userRoutes
