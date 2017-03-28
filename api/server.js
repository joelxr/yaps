var express = require('express')
var bodyParser = require('body-parser')
var mongodb = require('mongodb')
var ObjectId = require('mongodb').ObjectId
var multiparty = require('connect-multiparty')
var fs = require('fs')
var app = express()

app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())
app.use(multiparty())
app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE')
  res.setHeader('Access-Control-Allow-Headers', 'content-type')
  res.setHeader('Access-Control-Allow-Credentials', true)
  next()
})

var port = 8080

app.listen(port)

var db = new mongodb.Db(
  'yaps',
  new mongodb.Server('localhost', 27017, {}),
  {}
)

app.get('/', function (req, res) {
  res.send({msg: 'Olá'})
})

app.post('/api', function (req, res) {
  var date = new Date()
  var timestamp = date.getTime()
  var url = timestamp + '_' + req.files.arquivo.originalFilename
  var originalPath = req.files.arquivo.path
  var destinationPath = './uploads/' + url

  fs.rename(originalPath, destinationPath, function (err) {
    if (err) {
      res.status(500).json({erros: err})
      return
    }

    var dados = {
      url_image: url,
      titulo: req.body.titulo
    }

    db.open(function (err, mongoclient) {
      if (err) {
        res.json(err)
      }

      mongoclient.collection('postagens', function (err, collection) {
        if (err) {
          res.json(err)
        }

        collection.insert(dados, function (err, records) {
          if (err) {
            res.json(err)
          } else {
            res.json(records)
          }

          mongoclient.close()
        })
      })
    })
  })
})

app.get('/api', function (req, res) {
  db.open(function (err, mongoclient) {
    if (err) {
      res.json(err)
    }

    mongoclient.collection('postagens', function (err, collection) {
      if (err) {
        res.json(err)
      }

      collection.find().toArray(function (err, result) {
        if (err) {
          res.json(err)
        } else {
          res.json(result)
        }

        mongoclient.close()
      })
    })
  })
})

app.get('/imagens/:image', function (req, res) {
  var img = req.params.image
  fs.readFile('./uploads/' + img, function (err, content) {
    if (err) {
      res.status(400).json(err)
      return
    }

    res.writeHead(200, {'content-type': 'image/jpg'})
    res.end(content)
  })
})

app.get('/api/:id', function (req, res) {
  db.open(function (err, mongoclient) {
    if (err) {
      res.json(err)
    }

    mongoclient.collection('postagens', function (err, collection) {
      if (err) {
        res.json(err)
      }

      collection.find(ObjectId(req.params.id)).toArray(function (err, result) {
        if (err) {
          res.json(err)
        } else {
          res.json(result)
        }

        mongoclient.close()
      })
    })
  })
})

app.put('/api/:id', function (req, res) {
  db.open(function (err, mongoclient) {
    if (err) {
      res.json(err)
    }

    mongoclient.collection('postagens', function (err, collection) {
      if (err) {
        res.json(err)
      }

      collection.update(
        {_id: ObjectId(req.params.id)},
        {$push: {
          comentarios: {
            id_comentario: new ObjectId(),
            comentario: req.body.comentario
          }
        }
        },
        {},
        function (err, records) {
          if (err) {
            res.json(err)
          } else {
            res.json(records)
          }
        }
      )

      mongoclient.close()
    })
  })
})

app.delete('/api/:id', function (req, res) {
  db.open(function (err, mongoclient) {
    if (err) {
      res.json(err)
    }

    mongoclient.collection('postagens', function (err, collection) {
      if (err) {
        res.json(err)
      }

      collection.update(
        {},
        { $pull: {
          comentarios: {id_comentario: ObjectId(req.params.id)}
        }
        },
        {multi: true},
        function (err, records) {
          if (err) {
            res.json(err)
          } else {
            res.json(records)
          }
        })

      mongoclient.close()
    })
  })
})
