let data = require('../controllers/data');
let helper = require('../utils/helper');

module.exports = exports = function(options) {
    'use strict';

    let app = options.app;
    app.post('/api/data/getObjectListByVideo', helper.canAccessRoute(['admin', 'agent', 'reviewer', 'superreviewer']), data.getObjectListByVideo);

};