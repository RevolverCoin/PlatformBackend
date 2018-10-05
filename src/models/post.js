'use strict';

const mongoose = require('mongoose');

// Post Collection
let PostSchema = mongoose.Schema({
  text: String,
  userId: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
  createdAt: Date
});


module.exports = mongoose.model('tweets', PostSchema);
