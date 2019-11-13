var users = require('../controllers/users');
var helper = require('../utils/helper');

module.exports = exports = function (options) {
	'use strict';
	var app = options.app;
	app.post('/api/users',helper.canAccessRoute(['admin']), users.newUser);
 	app.post('/user/login', users.login);
  	app.post('/api/user/logout', users.logout);
    app.post('/api/user/logoutByAdmin', users.logoutByAdmin);
    app.post('/client/api/user/logout', users.logout);
	app.post('/api/users/pausedVideo', helper.canAccessRoute(['admin','agent','reviewer','superreviewer']),users.updatePausedVideoId);

	app.get('/api/user/session', users.session);
	app.get('/api/users', helper.canAccessRoute(['admin','agent','reviewer','superreviewer']), users.getUsers);

	app.put('/api/users/:userId', helper.canAccessRoute(['admin','reviewer','superreviewer']),users.updateUser);
    app.post('/api/users/removeUsersByIdsList', helper.canAccessRoute(['admin','reviewer','superreviewer']),users.removeUsersByIdsList);
    app.post('/api/users/assignUsersToSelectedProject', helper.canAccessRoute(['admin','reviewer','superreviewer']),users.assignUsersToSelectedProject);
    app.post('/api/users/getAssignedUsersListByProject', helper.canAccessRoute(['admin','reviewer','superreviewer']),users.getAssignedUsersListByProject);

    app.post('/api/users/getUnassignedUsersList', helper.canAccessRoute(['admin','reviewer','superreviewer']),users.getUnassignedUsersList);

    app.post('/api/users/assignUsersToSelectedTeam', helper.canAccessRoute(['admin','reviewer','superreviewer']),users.assignUsersToSelectedTeam);

    app.post('/api/users/getAssignedUsersListByFilter', helper.canAccessRoute(['admin','reviewer','superreviewer']),users.getAssignedUsersListByFilter);

    app.post('/api/users/getUsersListByFilter', helper.canAccessRoute(['admin','reviewer','superreviewer']),users.getUsersListByFilter);
};

