var data = require('../controllers/data');
var helper = require('../utils/helper');

module.exports = exports = function(options) {
    'use strict';

    var app = options.app;

    app.get('/api/data', helper.canAccessRoute(['admin', 'agent', 'reviewer', 'superreviewer']), data.getEvents);
    app.get('/api/data/:frameId', helper.canAccessRoute(['admin', 'agent', 'reviewer', 'superreviewer']), data.getEventByFrameId);

    app.post('/api/data/getEventListByVideo', helper.canAccessRoute(['admin', 'agent', 'reviewer', 'superreviewer']), data.getEventListByVideo);

};