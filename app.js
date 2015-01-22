"use strict";

/**
 * Module dependencies.
*/

var express = require('express');
var cookieParser = require('cookie-parser');
var compress = require('compression');
var session = require('express-session');
var bodyParser = require('body-parser');
var logger = require('morgan');
var errorHandler = require('errorhandler');
var csrf = require('lusca').csrf();
var methodOverride = require('method-override');

var _ = require('lodash');
var MongoStore = require('connect-mongo')({ session: session });
var flash = require('express-flash');
var path = require('path');
var mongoose = require('mongoose');
var passport = require('passport');
var expressValidator = require('express-validator');
var connectAssets = require('connect-assets');
var multer  = require('multer');

/**
 * Controllers (route handlers).
 */

var homeController = require('./controllers/home');
var userController = require('./controllers/user');
var productController = require('./controllers/product');

/**
 * API keys and Passport configuration.
 */

var secrets = require('./config/secrets');
var passportConf = require('./config/passport');

/**
 * Create Express server.
 */

var app = express();

/**
 * Connect to MongoDB.
 */

mongoose.connect(secrets.db);
mongoose.connection.on('error', function() {
  console.error('MongoDB Connection Error. Make sure MongoDB is running.');
});

var hour = 3600000;
var day = hour * 24;
var week = day * 7;

/**
 * CSRF whitelist.
 */

var csrfExclude = [];

/**
 * Express configuration.
 */

app.set('port', process.env.PORT || 5000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.set('json spaces', 2);

app.use(compress());
app.use(connectAssets({
  paths: [path.join(__dirname, 'public/css'), path.join(__dirname, 'public/js')],
  helperContext: app.locals
}));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(multer({ dest: './public/uploads'}));

app.use(expressValidator());
app.use(methodOverride());
app.use(cookieParser());

app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: secrets.sessionSecret,
  store: new MongoStore({
    url: secrets.db,
    auto_reconnect: true
  })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(function(req, res, next) {
  // CSRF protection.
  if (_.contains(csrfExclude, req.path)) return next();
  csrf(req, res, next);
});
app.use(function(req, res, next) {
  res.locals.user = req.user;
  next();
});
app.use(function(req, res, next) {
  // Remember original destination before login.
  var path = req.path.split('/')[1];
  if (/auth|login|logout|signup|fonts|css|img|uploads|api|resources|js|favicon/i.test(path)) {
    return next();
  }
  req.session.returnTo = req.path;
  next();
});

app.use(function(req, res, next) {
  res.locals.sprintf = require('sprintf').sprintf;
  next();
});

app.use(express.static(path.join(__dirname, 'public'), { maxAge: week }));

app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.end('Error');
});

/**
 * Main routes.
 */

app.get('/', homeController.index);

app.get('/login', userController.getLogin);
app.post('/login', userController.postLogin);

app.get('/signup', userController.getSignup);
app.post('/signup', userController.postSignup);

app.get('/logout', userController.logout);

app.get('/api/products', productController.list);
app.get('/api/products/search', productController.search);

app.get('/add', passportConf.isAuthenticated, productController.add);
app.post('/add', passportConf.isAuthenticated, productController.post_add);
app.get('/product/:permalink/edit', passportConf.isAuthenticated, productController.edit);

/**
 * 500 Error Handler.
 */

if (process.env.NODE_ENV === 'development') {
  // only use in development
  app.use(errorhandler())
}

/**
 * Start Express server.
 */

app.listen(app.get('port'), function() {
  console.log('Express server listening on port %d in %s mode', app.get('port'), app.get('env'));
});

module.exports = app;