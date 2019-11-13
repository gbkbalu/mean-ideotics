var  vIpconfig= require('../controllers/ipconfig');
var helper = require('../utils/helper');

module.exports = exports = function (options) {
    'use strict';

    var app = options.app;

    app.get('/api/ipconfig', helper.canAccessRoute(['admin','agent','reviewer','superreviewer']),vIpconfig.getIpconfig);
    app.post('/api/ipconfig/updateIpconfig', helper.canAccessRoute(['admin']),vIpconfig.updateIpconfig);
    app.post('/api/ipconfig', helper.canAccessRoute(['admin']),vIpconfig.saveIpconfig);
    app.post('/api/ipconfig/removeIpconfigsByIdList', helper.canAccessRoute(['admin']),vIpconfig.removeIpconfigsByIdList);
 };
