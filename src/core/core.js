const config = require('../config')
const fetch = require('node-fetch')


function CreateAddress(type) {
    return fetch(`${config.COREURL}/address/new`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({type}),
    }).then(res => res.json())
    
}

module.exports = {CreateAddress};
