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

module.exports = {
  createSuccessResponse,
  createErrorResponse,
  isLoggedIn,
  cleanObject
}
