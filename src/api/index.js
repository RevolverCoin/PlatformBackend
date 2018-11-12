const passport = require('passport')
const postRoutes = require('../api/endpoints/posts')
const userRoutes = require('../api/endpoints/user')
const blockchainRoutes = require('../api/endpoints/blockchain')
const {
  createSuccessResponse
} = require('../utils/utils')

module.exports = function (app, passport) {
  app
    .get('/', (req, res) => res.status(200).json({
      'its: ': 'alive'
    }))
    .get('/die', () => process.exit(0))
    .post('/signup', passport.authenticate('local-signup', {
      failureRedirect: '/signup', // redirect back to the signup page if there is an error
      failureFlash: true // allow flash messages
    }), (req, res) => {

      console.log(req.user._id)
      res.status(200).json(createSuccessResponse({
        id: req.user._id
      }))
    })
    .post('/login', passport.authenticate('local-login', {
      failureRedirect: '/login', // redirect back to the signup page if there is an error
      failureFlash: true // allow flash messages
    }), (req, res) => {
      res.status(200).json(createSuccessResponse({}))
    })
    .post('/logout', (req, res) => {
      req.logout()
      res.status(200).json(createSuccessResponse({}))
    })
    .use(postRoutes)
    .use(userRoutes)
    .use(blockchainRoutes)
  
}
