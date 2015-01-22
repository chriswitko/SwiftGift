"use strict";

var async = require('async');

var User = require('../models/User');
var Category = require('../models/Category');

/**
 * GET /
 * Home page.
 */

exports.index = function(req, res) {
  var locales = {};

  async.series({
    getMerchant: function(done) {
      if(!req.query.merchant_id) return done();

      User.findOne({_id: req.query.merchant_id}, function(err, merchant) {
        if(!err&&merchant) locales.merchant = merchant;
        done();
      })
    },
    getMerchantCategories: function(done) {
      if(!req.query.merchant_id) return done();

      Category.find({user: req.query.merchant_id}).sort({name: 1}).exec(function(err, categories) {
        locales.categories = categories;
        done();
      })
    },
    getAllMerchants: function(done) {
      User.find({}, function(err, merchants) {
        locales.merchants = merchants;
        done();
      })
    }
  }, function() {
    res.render('home', {
      q: req.query.q||'',
      merchant_id: req.query.merchant_id||'',
      category: req.query.category||'',
      merchant: locales.merchant,
      categories: locales.categories,
      merchants: locales.merchants
    });
  })
};
