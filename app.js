var createError = require("http-errors");
var express = require("express");
var cookieParser = require("cookie-parser");
const compression = require("compression");

var indexRouter = require("./routes/index");
var createRAICRouter = require("./routes/create-raic");
var updateRAICRouter = require("./routes/update-raic");
var updateDiagnosticRouter = require("./routes/update-diagnostic");
var getHome = require("./routes/get-home");
var getRaic = require("./routes/get-raic");
var getFilterRaic = require("./routes/get-filter-raic");
var getDiagnostic = require("./routes/get-diagnostic");
var getWorkers = require("./routes/get-workers");

var app = express();
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

app.use("/", indexRouter);
app.use("/create-raic", createRAICRouter);
app.use("/update-raic", updateRAICRouter);
app.use("/update-diagnostic", updateDiagnosticRouter);
app.use("/get-home", getHome);
app.use("/get-raic", getRaic);
app.use("/get-diagnostic", getDiagnostic);
app.use("/get-filter-raic", getFilterRaic);
app.use("/get-workers", getWorkers);

app.use(function (req, res, next) {
  next(createError(404));
});

app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  res.status(err.status || 500);
  res.json(err);
});

module.exports = app;
