var  vCommons= require('../controllers/commons');
var helper = require('../utils/helper');

module.exports = exports = function (options) {
	'use strict';

	var app = options.app;

    app.post('/api/common/getDashBoardData', helper.canAccessRoute(['admin','agent','client','reviewer','superreviewer']),vCommons.getDashBoardData);
    app.post('/api/common/getVideosCountsByFilter', helper.canAccessRoute(['admin','agent','client','reviewer','superreviewer']),vCommons.getVideosCountsByFilter);

};

