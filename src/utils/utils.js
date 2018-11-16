/**
 * Defines template for successful responses
 * @param {*} data
 */
function createSuccessResponse(data) {
  return {
    success: true,
    data
  }
}

function checkHasNextPage(page, count, pageSize) {
  return page < Math.ceil(count / pageSize)
}


function createErrorResponse(error) {
  return {
    success: false,
    errors:[error]
  }
}

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated())
    return next()

  res.status(401).json(createErrorResponse('Please login'))
}

/**
 * removes undefined properties from object
 * @param obj
 */
function cleanObject(obj) {
  const result = Object.assign(obj)
  for (const propName in result) {
      if (result[propName] === null || result[propName] === undefined) {
          delete result[propName];
      }
  }

  return result
}

function preparePosts(posts) {
  return posts.map(entry => ({
    _id: entry._id,
    text: entry.text,
    timestamp: entry.createdAt,
    likes: entry.likes,
    user: {
      avatar: entry.user.avatar,
      username: entry.user.username,
      id: entry.userId,
    }
  }))
}

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
    avatar: entry.avatar,
    username: entry.username,
    website: entry.website,
    links: entry.links
  }))
}

module.exports = {
  createSuccessResponse,
  createErrorResponse,
  isLoggedIn,
  cleanObject,
  preparePosts,
  prepareUsers,
  checkHasNextPage
}
