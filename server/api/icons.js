var  vIcons= require('../controllers/icons');
var helper = require('../utils/helper');

module.exports = exports = function (options) {
	'use strict';

	var app = options.app;

    app.get('/api/icons', helper.canAccessRoute(['admin','agent','reviewer','superreviewer']),vIcons.getIcons);

	app.post('/api/icons/getListOfIcons', helper.canAccessRoute(['admin','agent','reviewer','superreviewer']),vIcons.getListOfIcons);
    app.post('/api/icons/updateIcon', helper.canAccessRoute(['admin']),vIcons.updateIcon);
    app.post('/api/icons/saveIcon', helper.canAccessRoute(['admin']),vIcons.saveIcon);
    app.get('/api/icons/removeIconById/:iconId', helper.canAccessRoute(['admin']), vIcons.removeIconByIconId);
    app.get('/api/icons/getSubCatCountByIcon/:iconId', helper.canAccessRoute(['admin']), vIcons.getSubCatCountByIcon);

};

