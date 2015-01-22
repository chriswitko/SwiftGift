"use strict";

var _ = require('lodash');
var async = require('async');
var util = require('util');
var lwip = require('lwip');
var fs = require('fs');
var clj_fuzzy = require('clj-fuzzy');

var Product = require('../models/Product');
var Category = require('../models/Category');
var User = require('../models/User');

/**
 * List all products. Available via /api/products
 */

exports.list = function(req, res) {
  var locales = {};
  var criteria = {};
  var page = req.query.page || 1;
  var limit = req.query.limit || 12;

  async.series({
    getProducts: function(done) {
      Product.paginate(criteria, page, limit, function(err, pages, products, total) {
        locales.products = [];
        async.forEachSeries(products, function(product, cb) {
          locales.products.push({product: product.toJSON()});
          cb();
        }, function() {
          done();
        })
      }, {sortBy: { createdAt : -1 }});
    }
  }, function() {
    res.json({
      code: 200,
      status: 'success',
      products: locales.products
    });
  })
};

/**
 * Search products. Available via /api/products/search
 */

exports.search = function(req, res) {
  var locales = {};
  var criteria = {};
  var page = req.query.page || 1;
  var limit = req.query.limit || 12;

  async.series({
    getProducts: function(done) {
      if(req.query.merchant_id) criteria.author = req.query.merchant_id;

      if(req.query.category) {
        var category = decodeURIComponent(req.query.category.replace(/([.*+?^=!:${}()|\[\]\/\\])/g,' '));
        criteria.categories = {$in: [category]};
      }

      if(req.query.q) {
        var q = req.query.q.toString().replace(/([.*+?^=!:${}()|\[\]\/\\])/g,' ').replace(/([-])/g,'')
        var tags = {$in: _.map(q.split(' '), function(tag) {return tag.trim()})}
        var typos = {$in: _.map(q.split(' '), function(tag) {return clj_fuzzy.phonetics.soundex(tag.trim())})}
        criteria['$or'] = [{tags: tags}, {typos: typos}];
      }

      Product.paginate(criteria, page, limit, function(err, pages, products, total) {
        locales.products = [];
          if(products) locales.products = _.map(products, function(product) {
            return {product: product.toJSON()}
          })
          done()
        }, {sortBy: { createdAt : -1 }});
    }
  }, function() {
    res.json({
      code: 200,
      status: 'success',
      products: locales.products
    });
  })
};

/**
 * GET /add
 * Add new product.
 */

exports.add = function(req, res) {
  var locales = {};

  async.series({
    getMerchantCategories: function(done) {
      Category.find({user: req.user._id}).sort({name: 1}).exec(function(err, categories) {
        locales.categories = categories;
        done();
      })
    }
  }, function() {
    res.render('product/edit', {
      title: 'Post a new product',
      product: new Product(),
      categories: locales.categories
    });
  })
};

/**
 * GET /product/:permalink/edit
 * Edit product.
 */

exports.edit = function(req, res) {
  var locales = {};

  async.series({
    getProduct: function(done) {
      Product.findOne({_id: req.params.permalink})
        .exec(function(err, product) {
          if(product) locales.product = product
          done()
        });
    },
    checkPermission: function(done) {
      if(locales.product.author.toString()!=req.user._id.toString()) {
        return res.redirect('/');
      } else done();
    },
    getMerchantCategories: function(done) {
      Category.find({user: locales.product.author}).sort({name: 1}).exec(function(err, categories) {
        locales.categories = categories;
        done();
      })
    }
  }, function() {
    if(!locales.product) return res.redirect('/')
    res.render('product/edit', {
      title: 'Edit Product',
      product: locales.product,
      categories: locales.categories
    });
  })
};

/**
 * POST /add
 * Save changes for product.
 */

exports.post_add = function(req, res) {
  req.assert('title', 'Product name is required').notEmpty();
  req.assert('price', 'Price is required').notEmpty();
  req.assert('image_url', 'Image URL is required').optional().isURL();

  var errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/add');
  }

  var locales = {}

  if(req.body.mode=='add'&&!req.files.filename) {
    if(!errors) errors = []
    errors.push({ param: 'filename', msg: 'Image is required', value: undefined })
    req.flash('errors', errors);
    return res.redirect('/add');
  }

  async.series({
    processImage: function(done) {
      if(!req.files.filename) return done()
      lwip.open(req.files.filename.path, function(err, image) {
        if (err) throw err;

        locales.image = image

        var o_height = image.height();
        var o_width = image.width();

        var max_size = 799

        if(o_height>o_width) {
          var n_height = 799;
          var percent = (((n_height * 100)/o_height)/100)
          var n_width =  Math.floor((o_width*percent))-1;
        } else {
          var n_width =  799;
          var percent = (((n_width * 100)/o_width)/100)
          var n_height = Math.floor((o_height*percent))-1;
        }

        locales.n_width = n_width
        locales.n_height = n_height

        var blank_size_x = Math.floor((800 - n_width - 1) / 2);
        if(blank_size_x<0) blank_size_x = 0;
        locales.blank_size_x = blank_size_x

        var blank_size_y = Math.floor((800 - n_height - 1) / 2);
        if(blank_size_y<0) blank_size_y = 0;
        locales.blank_size_y = blank_size_y

        locales.filename = req.files.filename.name;
        locales.path = req.files.filename.path;
        done();
      });
    },
    imageSizeOriginal: function(done) {
      if(!locales.path) return done();
      locales.image.resize(locales.n_width, locales.n_height, function(err, resized) {
        locales.resized = resized
        done();
      })
    },
    imageSizeLarge: function(done) {
      if(!locales.path) return done();
      locales.resized.crop(0, 0, locales.n_width, locales.n_height, function(err, cropped) {
        lwip.create(800, 800, {r: 249, g: 249, b: 249, a: 100}, function(err, layer) {
          layer.paste(locales.blank_size_x, locales.blank_size_y, cropped, function(err, layer) {
            locales.large = layer
            layer.writeFile('./public/uploads/l_'+locales.filename, function(err) {
              done();
            })
          })
        })
      })
    },
    removeUpload: function(done) {
      if(!locales.path) return done();
      fs.unlink(locales.path, function() {
        done();
      })
    },
    uploadToCDN: function(done) {
      // To optimize traffic, all statics + images should me migrated to CDN eg. S3
      done();
    },
    loadProduct: function(done) {
      if(!req.body.id) return done();
      Product.findOne({_id: req.body.id}, function(err, product) {
        locales.product = product;
        done();
      })
    },
    saveToDb: function(done) {
      if(!locales.product) locales.product = new Product()
      locales.product.title = req.body.title

      locales.product.typos = []
      locales.typos = _.each((req.body.title).split(' '), function(typo) {
        locales.product.typos.push(clj_fuzzy.phonetics.soundex(typo))
      })

      locales.product.categories = req.body.categories||[];
      locales.product.price = Number(req.body.price.replace(/[^0-9\.]+/g,""))
      locales.product.imageFileName = locales.filename?locales.filename:locales.product.imageFileName,
      locales.product.author = req.user

      locales.product.tags = req.body.tags

      locales.product.save(function(err, saved) {
        locales.saved = saved
        done();
      })
    },
    updateCategories: function(done) {
      if(!req.body.categories) return done();

      async.forEachSeries(req.body.categories, function(category, cb) {
        Category.findOne({name: category}, function(err, found) {
          if(found) return cb();

          if(!found) {
            var created = new Category({
              name: category,
              user: req.user
            });
            created.save(function(err, saved) {
              cb()
            })
          }
        })
      }, function() {
        done();
      })
    }
  }, function() {
    req.flash('success', { msg: 'Success! Your product has been added.' });

    res.redirect('/?merchant_id=' + req.user._id);
  })


};

