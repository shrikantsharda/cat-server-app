'use strict';

var Cat = require('../controllers/cat.server.controller');

module.exports = function(app) {
  app.route('/cat').get(Cat.get);
  app.route('/cat').post(Cat.post);
  app.route('/cat').put(Cat.put);
  app.route('/cat').delete(Cat.delete);
  app.route('/catId').get(Cat.getId);
  app.route('/catGraph').get(Cat.getGraphData);
};
