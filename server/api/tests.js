var tests = require('../controllers/tests');
var helper = require('../utils/helper');

module.exports = exports = function(options) {
    'use strict';

    var app = options.app;

    app.get('/api/tests', helper.canAccessRoute(['admin', 'agent', 'reviewer', 'superreviewer']), tests.getEvents);
    app.get('/api/test/:frameId', helper.canAccessRoute(['admin', 'agent', 'reviewer', 'superreviewer']), tests.getEventByFrameId);

    app.post('/api/tests/getEventListByVideo', helper.canAccessRoute(['admin', 'agent', 'reviewer', 'superreviewer']), tests.getEventListByVideo);

};