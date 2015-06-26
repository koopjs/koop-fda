var crypto = require('crypto')
var Path = require('path')

// a function that is given an instance of Koop at init
var Controller = function (FDA, BaseController) {
  var controller = BaseController()

  // drops the cache for an item
  controller.drop = function (req, res) {
    FDA.drop(function (error, itemJson) {
      if (error) {
        res.send(error, 500)
      } else {
        res.json(itemJson)
      }
    })
  }

  controller.findRecalls = function (req, res) {
    // Get the item
    FDA.getRecalls(req.query, function (error, itemJson) {
      if (error) {
        return res.status(500).send(error)
      } else if (req.params.format) {
        // change geojson to json
        req.params.format = req.params.format.replace('geojson', 'json')
        var dir = 'FDA'
        console.log(dir)
        // build the file key as an MD5 hash that's a join on the paams and look for the file
        var toHash = JSON.stringify(req.params) + JSON.stringify(req.query)
        var key = crypto.createHash('md5').update(toHash).digest('hex')
        var filePath = ['files', dir, key].join('/')
        console.log(filePath)
        var fileName = key + '.' + req.params.format
        FDA.files.exists(filePath, fileName, function (exists, path) {
          if (exists) {
            if (path.substr(0, 4) === 'http') {
              res.redirect(path)
            } else {
              res.sendFile(path)
            }
          } else {
            FDA.exportToFormat(req.params.format, dir, key, itemJson[0], {rootDir: FDA.files.localDir}, function (err, file) {
              if (err) return res.status(500).send(err)
              res.status(200).sendFile(Path.resolve(process.cwd(), file.file))
            })
          }
        })
      } else {
        var geojson = itemJson
        if (geojson && geojson.features && geojson.features.length) {
          geojson.features = geojson.features.slice(0, req.query.limit || 100)
        }
        res.status(200).json(geojson[0])
      }
    })
  }

  // shared dispath for feature service responses
  controller.featureserver = function (req, res) {
    var callback = req.query.callback
    delete req.query.callback
    for (var k in req.body) {
      req.query[k] = req.body[k]
    }
    // if this is a count request then go straight to the db
    if (req.query.returnCountOnly) {
      controller.featureserviceCount(req, res)
    } else {
      // else send this down for further processing
      controller.featureservice(req, res, callback)
    }
  }

  controller.featureserviceCount = function (req, res) {
    // first check if the dataset is new, in the cache, or processing
    // ask for a single feature becasue we just want to know if the data is there
    req.query.limit = 1
    FDA.getRecalls(req.query, function (err, geojson) {
      if (err) {
        res.status(500).send(err)
      } else if (geojson[0] && geojson[0].status === 'processing') {
        res.status(202).json(geojson)
      } else {
        // it's not processing so send for the count
        FDA.getCount(req.query, function (err, count) {
          if (err) {
            console.log('Could not get feature count', req.params.item)
            res.status(500).send(err)
          } else {
            var response = {count: count}
            res.status(200).json(response)
          }
        })
      }
    })
  }

  controller.featureservice = function (req, res, callback) {
    var err
    req.query.limit = req.query.limit || req.query.resultRecordCount || 1000
    req.query.offset = req.query.resultOffset || null
    // Get the item
    FDA.getRecalls(req.query, function (error, geojson) {
      if (error) {
        res.status(500).send(error)
      } else if (geojson[0] && geojson[0].status === 'processing') {
        res.status(202).json(geojson)
      } else {
        // pass to the shared logic for FeatureService routing
        delete req.query.geometry
        delete req.query.where
        controller.processFeatureServer(req, res, err, geojson, callback)
      }
    })
  }

  return controller
}

module.exports = Controller
