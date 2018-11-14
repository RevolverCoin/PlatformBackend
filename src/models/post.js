'use strict';

const mongoose = require('mongoose');

// Post Collection
let PostSchema = mongoose.Schema({
  text: String,
  userId: { type: mongoose.Schema.ObjectId, ref: 'User' },
  createdAt: Date,
  likes: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
  comments: [{ type: mongoose.Schema.ObjectId, ref: 'Comment' }],
});


module.exports = mongoose.model('tweets', PostSchema);
