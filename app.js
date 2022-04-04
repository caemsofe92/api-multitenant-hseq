var createError = require('http-errors');
var express = require('express');
var cookieParser = require('cookie-parser');
const compression = require('compression')

var indexRouter = require('./routes/index');
var entitiesRouter = require('./routes/entities');
var createRAICRouter = require('./routes/create-raic');
var getHome = require('./routes/get-home');
var getRaic = require('./routes/get-raic');
var getDiagnostic = require('./routes/get-diagnostic');
var specialRouter = require('./routes/special');

var app = express();
app.use(compression());
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));

app.use('/', indexRouter);
app.use('/entities', entitiesRouter);
app.use('/create-raic', createRAICRouter);
app.use('/get-home', getHome);
app.use('/get-raic', getRaic);
app.use('/get-diagnostic', getDiagnostic);
app.use('/special', specialRouter);

app.use(function(req, res, next) {
  next(createError(404));
});

app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.json(err);
});

module.exports = app;