const path = require('path')
const dotenv = require('dotenv-safe')

if (process.env.NODE_ENV !== 'production') {
  dotenv.load({
      path: path.join(__dirname, '../.env'),
      sample: path.join(__dirname, '../.env.example'),
  })
}

const config = {
  PORT: process.env.PORT || 5445,
  COREURL: process.env.COREURL || 'http://localhost:5447',
  REDIS_SECRET: 'very-sTrong-Secret',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  MONGO_URL: process.env.MONGO_URL || 'mongodb://localhost/platform-backend',
  auth: {

    'facebookAuth': {
      'clientID': 'your-secret-clientID-here', // your App ID
      'clientSecret': 'your-client-secret-here', // your App Secret
      'callbackURL': 'http://localhost:8080/auth/facebook/callback',
      'profileURL': 'https://graph.facebook.com/v2.5/me?fields=first_name,last_name,email',
      'profileFields': ['id', 'email', 'name'] // For requesting permissions from Facebook API

    },

    'twitterAuth': {
      'consumerKey': 'your-consumer-key-here',
      'consumerSecret': 'your-client-secret-here',
      'callbackURL': 'http://localhost:8080/auth/twitter/callback'
    },

    'googleAuth': {
      'clientID': 'your-secret-clientID-here',
      'clientSecret': 'your-client-secret-here',
      'callbackURL': 'http://localhost:8080/auth/google/callback'
    }
  }
}

module.exports = config
