var express = require('express')
var consign = require('consign')
var bodyParser = require('body-parser')
var expressValidator = require('express-validator')
var app = express()

app.set('view engine', 'ejs')
app.set('views', './app/views')
app.use(express.static('./app/public'))
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())
app.use(expressValidator())

consign()
  .include('app/routes')
  .then('app/models')
  .then('app/controllers')
  .into(app)

app.use(function (req, res, next) {
  res.status(404).render('errors/404')
  next()
})

app.use(function (err, req, res, next) {
  if (err) {
    throw err
  }

  res.status(500).render('errors/500')
  next()
})

module.exports = app
