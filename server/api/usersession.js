var userSession = require('../controllers/usersessions');
var helper = require('../utils/helper');

module.exports = exports = function (options) {
	'use strict';

	var app = options.app;

	app.get('/api/usersession', helper.canAccessRoute(['admin','reviewer','superreviewer']), userSession.getAllUserSessions);
	app.post('/api/usersession/getUserSessionsByUser', helper.canAccessRoute(['admin','reviewer','superreviewer']),userSession.getUserSessionsByUser);


};
