'use strict';

const mongoose = require('mongoose');

// Post Collection
let PostSchema = mongoose.Schema({
  text: String,
  userId: mongoose.Schema.ObjectId,
  createdAt: Date
});


module.exports = mongoose.model('tweets', PostSchema);
