
var  vFiles= require('../controllers/files');
var helper = require('../utils/helper');

module.exports = exports = function (options) {
    'use strict';

    var app = options.app;

    app.post('/api/file/upload', helper.canAccessRoute(['admin','agent','client']),vFiles.uploadFile);
    app.delete('/api/file/delete', helper.canAccessRoute(['admin','agent','client']),vFiles.deleteFile);
};
