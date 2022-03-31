var createError = require('http-errors');
var express = require('express');
var cookieParser = require('cookie-parser');
const compression = require('compression')

var indexRouter = require('./routes/index');
var entitiesRouter = require('./routes/entities');
var createRouter = require('./routes/create');
var readRouter = require('./routes/read');
var updateRouter = require('./routes/update');
var deleteRouter = require('./routes/delete');
var specialRouter = require('./routes/special');

var app = express();
app.use(compression());
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));

app.use('/', indexRouter);
app.use('/entities', entitiesRouter);
app.use('/create', createRouter);
app.use('/read', readRouter);
app.use('/update', updateRouter);
app.use('/delete', deleteRouter);
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