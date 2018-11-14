'use strict';

const mongoose = require('mongoose');

const CommentSchema = mongoose.Schema({
    userId: { type: mongoose.Schema.ObjectId, ref: 'User' },
    text: String,
    createdAt: Date,
    likes: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
});


module.exports = mongoose.model('Comment', CommentSchema);
