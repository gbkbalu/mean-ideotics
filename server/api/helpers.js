var  vHelpers= require('../controllers/helpers');
var helper = require('../utils/helper');

module.exports = exports = function (options) {
	'use strict';
	var app = options.app;

    app.get('/api/helpers', helper.canAccessRoute(['admin','agent','reviewer','superreviewer']),vHelpers.getHelpers);
    app.post('/api/helpers/updateHelper', helper.canAccessRoute(['admin']),vHelpers.updateHelper);
    app.post('/api/helpers', helper.canAccessRoute(['admin','agent','reviewer','superreviewer']),vHelpers.saveHelper);
    app.post('/api/helpers/updateHelperById', helper.canAccessRoute(['admin']), vHelpers.updateHelperById);

    app.post('/api/helpers/getHelperById', helper.canAccessRoute(['admin','agent','reviewer','superreviewer']),vHelpers.getHelperById);
 };

