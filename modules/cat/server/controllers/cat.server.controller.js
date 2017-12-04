'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  db = mongoose.connection,
  _ = require('underscore'),
  Ajv = require('ajv'),
  ajv = new Ajv(),
  metaSchema = require('ajv/lib/refs/json-schema-draft-04.json');
ajv.addMetaSchema(metaSchema);
ajv._opts.defaultMeta = metaSchema.id;
var fs = require('fs'),
  ldapjs = require('ldapjs'),
  assert = require('assert'),
  fs = require('fs'),
  forge = require('node-forge'),
  config = require(path.resolve('./config/config'));

function sanitize(doc) {
  delete doc._id;
  return doc;
}

function create_item(item, cb) {
  var items = db.collection('items');
  items.ensureIndex({ id:1 }, { unique:true }, function(err, indexName) {
    if (err)
      cb('duplicate id', null);
    else {
      items.insert(item, { w:1 }, function(err, rspdoc) {
        if (err)
          cb('insert fail', null);
        else {
          cb(null, rspdoc);
        }
      });
    }
  });
}

function update_item(id, item, cb) {
  var items = db.collection('items');
  items.update({ id:id }, { $set: item }, { safe: true, upsert: true }, function(err, doc) {
    if (err)
      cb('update failed');
    else {
      cb(null);
    }
  });
}

function validateItem(body, res, callback) {
    // var request = require('request');
    // console.log(body);
  var $RefParser = require('json-schema-ref-parser');
    // process.chdir('schemas');
  fs.readFile('schemas/' + body.refCatalogueSchemaRelease + '/' + body.refCatalogueSchema, 'utf8', function(error, data) {
    if (error === null) {
      var fileData = JSON.parse(data);
      var traverse = require('json-schema-traverse');
      traverse(fileData, { allKeys: true }, function(schema, JSONPointer) {
        if (schema.$ref) {
          if (schema.$ref[0] !== '#') {
            var temp = 'schemas/' + body.refCatalogueSchemaRelease + '/' + schema.$ref;
            schema.$ref = temp;
          }
        }
      });
            // console.log(fileData);
      $RefParser.dereference(fileData, function(errDeref, postSchema) {
        if (errDeref) {
          res.send(500);
          console.log(errDeref);
        } else {
          var valid = ajv.validate(postSchema, body);
          if (!valid) {
            res.send(400, ajv.errors);  // bad request
            // console.log(ajv.errors);
          } else {
            callback();
          }
        }
      });
    } else {
      res.send(500, error);
      // console.log(error);
    }
  });
}

function makeFilter(query) {
  var filter = {};
  var re;
  Object.keys(query).forEach(function(key) {
    var temp = new RegExp(query[key]);
    filter[key] = temp;
  });
  return filter;
}

exports.get = function(req, res) {
  // console.log(req.headers);

  var items = db.collection('items');

  var filter = makeFilter(req.query);//makefilter(req.query.href, req.query.rel, req.query.val);
  
  Object.assign(filter, req.body);

  items.find(filter, function(err, cursor) {
    if (err)
      res.send(500, err);
    else {
      cursor.toArray(function(err, docs) {
        if (docs.length === 0) {
          res.send(200, 'No docs found');
        } else {
            //console.log(docs.length)
                // FIXME, this should be done with mongodb find() in the db, not here
                //docs = filterSearch(docs, req.query.href, req.query.rel, req.query.val);
                // construct a catalogue object
          var cat = {
            'item-metadata': [
              {
                rel:'urn:X-rbccps:rels:isContentType',
                val:'application/vnd.rbccps.catalogue+json'
              },
              {
                rel:'urn:X-rbccps:rels:hasDescription:en',
                val:'Catalogue test'
              },
              {
                rel:'urn:X-rbccps:rels:supportsSearch',
                val:'urn:X-rbccps:search:simple'
              }
            ],
            items: _.map(docs, sanitize)
          };
          //res.send(200, cat);
          //res.render('index_pug.pug',{title:'Search Results', message: 'hello'})
          //res.render('index_pug.pug', {title:'Search Results', results: cat}) 
          res.status(200).jsonp(cat);
          //render pug
          //res.render('catlog', {results: cat });

        }
      });
    }
  });
};

exports.getId = function(req, res) {
  // console.log(req.headers);

  var items = db.collection('items');

  var filter = makeFilter(req.query);//makefilter(req.query.href, req.query.rel, req.query.val);
  
  Object.assign(filter, req.body);

  items.find(filter, function(err, cursor) {
    if (err)
      res.send(500, err);
    else {
      cursor.project({ id: 1 }).toArray(function(err, docs) {
        if (docs.length === 0) {
          res.send(200, 'No docs found');
        } else {
            //console.log(docs.length)
                // FIXME, this should be done with mongodb find() in the db, not here
                //docs = filterSearch(docs, req.query.href, req.query.rel, req.query.val);
                // construct a catalogue object
          var cat = {
            'item-metadata': [
              {
                rel:'urn:X-rbccps:rels:isContentType',
                val:'application/vnd.rbccps.catalogue+json'
              },
              {
                rel:'urn:X-rbccps:rels:hasDescription:en',
                val:'Catalogue test'
              },
              {
                rel:'urn:X-rbccps:rels:supportsSearch',
                val:'urn:X-rbccps:search:simple'
              }
            ],
            items: _.map(docs, sanitize)
          };
          //res.send(200, cat);
          //res.render('index_pug.pug',{title:'Search Results', message: 'hello'})
          //res.render('index_pug.pug', {title:'Search Results', results: cat}) 
          res.status(200).jsonp(cat);
          //render pug
          //res.render('catlog', {results: cat });

        }
      });
    }
  });
};

var insertToDoc = function(itemData, nestArray, val) {
  // console.log(itemData);
  // console.log(val);
  var i;
  var prevRef = itemData;
  for (i = 0; i < nestArray.length; i++) {
    if (prevRef[nestArray[i]] === undefined) {
      prevRef[nestArray[i]] = {};
      if (i < nestArray.length - 1) {
        prevRef = prevRef[nestArray[i]];
      }
    } else {
      if (i < nestArray.length - 1) {
        prevRef = prevRef[nestArray[i]];
      }
    }
  }
  prevRef[nestArray[i-1]] = val;
  // console.log(itemData);
};

var decrypt = function(cipherText, password, salt, iv, options) {
  var key = forge.pkcs5.pbkdf2(password, forge.util.decode64(salt), 4, 16);
  var decipher = forge.cipher.createDecipher('AES-CBC', key);
  decipher.start({ iv: forge.util.decode64(iv) });
  decipher.update(forge.util.createBuffer(forge.util.decode64(cipherText)));
  decipher.finish();
  if(options !== undefined && options.hasOwnProperty('output') && options.output === 'hex') {
    return decipher.output.toHex();
  } else {
    return decipher.output.toString();
  }
};

var putItem = function(req, res) {
  var items = db.collection('items');
  items.findOne({ id:req.query.id }, function(findErr, doc) {
    if (findErr !== null) {
      res.send(400, findErr);
    } else if (doc !== null) {
      var updateDoc = req.body;
      updateDoc.id = doc.id;
      updateDoc.accessMechanism = doc.accessMechanism;
      validateItem(updateDoc, res, function() {
        update_item(req.query.id, updateDoc, function(err) {
          if (err) {
            res.send(400);  // problem
          } else {
            res.send(200, 'updated');
          }
        });
      });
    } else {
      res.send(404);  // not found
    }
  });
};

exports.put = function(req, res) {
  if (req.headers['no-check']) {
    fs.readFile('pwd.txt', 'utf8', function (err,data) {
      if (err) {
        return console.log(err);
      }
      var temp = JSON.parse(data);
      var decrypted;
      try {
        decrypted = decrypt(temp.cipher_text, req.headers.pwd, temp.salt, temp.iv);
      } catch (e) {
      }

      if (decrypted === 'SmartCity') {
              // console.log('Password is correct');
        putItem(req, res);
      } else {
        res.send(403, 'Incorrect Password');
      }
    });
  } else {
    var client = ldapjs.createClient({
      url: config.ldap.url
    });

    client.search('uid=' + req.query.id + ',' + config.ldap.baseDN, {}, function(searchErr, searchRes) {
          // assert.ifError(searchErr);

      searchRes.on('searchEntry', function(entry) {
        var authHeader = req.headers.authorization;
        console.log(new Buffer('b64', authHeader).toString('hex'));
              // console.log(entry.object);
        if (entry.object.owner === Buffer.from(req.headers.authorization, 'base64').toString('utf8').split(':')[0]) {
          putItem(req, res);
        } else {
          res.send(403, 'You dont have access to edit this item');
        }
      });

      searchRes.on('error', function(resErr) {
              // console.log('err: ' + resErr.message);
        res.send(400, resErr.message);
      });

      client.destroy();
    });
  }
};

var postItem = function(req, res) {
  validateItem(req.body, res, function() {
    var items = db.collection('items');
    items.findOne({ id:req.query.id }, function(err, doc) {
      if (err !== null){
        res.send(400);
      } else if (doc !== null) {
        res.send(400, 'Cannot update an already existing item. Use put to update item');
      } else {
        if (req.query.id !== req.body.id) {
                    // console.log('query id not equal to id!');
          res.send(409,'query id: ' + req.query.id + ' is not equal to body id: ' + req.body.id.toString() + '!');  // conflict
          return;
        }
        create_item(req.body, function(err) {
          if (err) {
            res.send(409, err);  // conflict
                        // console.log(err);
          } else {
            res.location('/cat');
            res.send(201);  // created
          }
        });
      }
    });
  });
};

exports.post = function(req, res) {

  if (req.headers['no-check']) {
    fs.readFile('pwd.txt', 'utf8', function (err,data) {
      if (err) {
        return console.log(err);
      }
      var temp = JSON.parse(data);
      var decrypted;
      try {
        decrypted = decrypt(temp.cipher_text, req.headers.pwd, temp.salt, temp.iv);
      } catch (e) {
      }

      if (decrypted === 'SmartCity') {
        // console.log('Password is correct');
        postItem(req, res);
      } else {
        res.send(403, 'Incorrect Password');
      }
    });
  } else {
    var client = ldapjs.createClient({
      url: config.ldap.url
    });

    client.search('uid=' + req.query.id + ',' + config.ldap.baseDN, {}, function(searchErr, searchRes) {
      // assert.ifError(searchErr);

      searchRes.on('searchEntry', function(entry) {
        if (entry.object.owner === Buffer.from(req.headers.authorization, 'base64').toString('utf8').split(':')[0]) {
          postItem(req, res);
        } else {
          res.send(403, 'You dont have access to post this item');
        }
      });

      searchRes.on('error', function(resErr) {
        console.log(resErr.message);
        res.send(400, resErr.message);
      });

      client.destroy();
    });
  }
};

exports.delete = function(req, res) {
  if (req.headers.pwd) {
    fs.readFile('pwd.txt', 'utf8', function (err,data) {
      if (err) {
        return console.log(err);
      }
      var temp = JSON.parse(data);
      var decrypted;
      try {
        decrypted = decrypt(temp.cipher_text, req.headers.pwd, temp.salt, temp.iv);
      } catch (e) {
      }

      if (decrypted === 'SmartCity') {
        // console.log('Password is correct');
        var items = db.collection('items');
        var filter = { id:req.query.id };
        items.remove(filter, function(err, doc) {
          if (err) {
            res.send(500);  // not found
          } else {
          	// console.log(doc);
            if (doc.result.n === 1) {
              res.send(200, 'item deleted');
            } else {
              res.send(404, 'item not found');
            }
          }
        });
      } else {
        res.send(403, 'Incorrect Password');
      }
    });
  } else {
    res.send(403, 'You are not authorized to delete');
  }
};

var graphResStatic = {
  chartData: [],
  ownersData: [],
  providersData: [],
};

var findItems = function(filter, graphRes) {
  var items = db.collection('items');
  items.find(filter, function(err, cursor) {
    if (err)
      console.log(err);
    else {
      cursor.toArray(function(err, docs) {
        var itemsArr = _.map(docs, sanitize);

        var providers = {};
        var owners = {};
        var resources = {};
        for (var i = 0; i < itemsArr.length; i++) {
          var currItem = itemsArr[i];

          if (resources[currItem.resourceType]) {
            resources[currItem.resourceType]++;
          } else {
            resources[currItem.resourceType] = 1;
          }

          if (providers[currItem.provider.name]) {
            providers[currItem.provider.name]++;
          } else {
            providers[currItem.provider.name] = 1;
          }

          if (owners[currItem.owner.name]) {
            owners[currItem.owner.name]++;
          } else {
            owners[currItem.owner.name] = 1;
          }
        }

        graphRes.chartData = [];
        graphRes.ownersData = [];
        graphRes.providersData = [];

        var keysArr = Object.keys(resources);

        for (i = 0; i < keysArr.length; i++) {
          var temp = {};
          temp.key = keysArr[i];
          temp.y = resources[keysArr[i]];
          graphRes.chartData.push(temp);
        }

        keysArr = Object.keys(owners);

        for (i = 0; i < keysArr.length; i++) {
          var temp1 = {};
          temp1.name = keysArr[i];
          temp1.num = owners[keysArr[i]];
          graphRes.ownersData.push(temp1);
        }

        keysArr = Object.keys(providers);

        for (i = 0; i < keysArr.length; i++) {
          var temp2 = {};
          temp2.name = keysArr[i];
          temp2.num = providers[keysArr[i]];
          graphRes.providersData.push(temp2);
        }
      });
    }
  });
};

setTimeout(function() {
  findItems({}, graphResStatic);
}, 1 * 1000);

setInterval(function() {
  findItems({}, graphResStatic);
}, 6 * 60 * 60 * 1000);

exports.getGraphData = function(req, res) {
  if (Object.keys(req.query).length === 0) {
    res.status(200).jsonp(graphResStatic);
  } else {
    var graphRes = {
      chartData: [],
      ownersData: [],
      providersData: [],
    };

    findItems(makeFilter(req.query), graphRes);

    setTimeout(function() {
      res.status(200).jsonp(graphRes);
    }, 1 * 1000);
  }
};