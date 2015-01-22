"use strict";

var _ = require('lodash');

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var url = require('url');

var timestamps = require("mongoose-times");
var mongoosePaginate = require('mongoose-paginate');
var searchPlugin = require('mongoose-search-plugin');

var productSchema = new mongoose.Schema({
  postUrl: String,
  url: String,
  title: String,
  price: Number,
  imageFileName: String,
  typos: Array,
  tags: Array,
  categories: Array,

  author: {type: Schema.ObjectId, ref: 'User', index: true}
});


productSchema.index({ tags: 1 });
productSchema.index({ categories: 1 });

productSchema.pre('save', function(next) {
  var product = this;

  return next();
});

productSchema.plugin(timestamps, { created: 'createdAt', lastUpdated: 'updatedAt' });
productSchema.plugin(mongoosePaginate);
productSchema.plugin(searchPlugin, {fields: ['title', 'body', 'tags', 'typos']});

module.exports = mongoose.model('Product', productSchema);
