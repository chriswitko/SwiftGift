"use strict";

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var categorySchema = new mongoose.Schema({
  name: {type: String, sparse: true},
  user: {type: Schema.ObjectId, ref: 'User'}
});

module.exports = mongoose.model('Category', categorySchema);
