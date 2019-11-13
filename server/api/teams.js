var  vTeams= require('../controllers/teams');
var helper = require('../utils/helper');

module.exports = exports = function (options) {
	'use strict';

	var app = options.app;

    app.get('/api/teams', helper.canAccessRoute(['admin','reviewer','superreviewer']),vTeams.getTeams);
    app.get('/api/teams/getActiveTeamsList', helper.canAccessRoute(['admin']),vTeams.getActiveTeamsList);
    app.post('/api/teams', helper.canAccessRoute(['admin']),vTeams.saveTeam);
    app.post('/api/teams/updateTeamById', helper.canAccessRoute(['admin']), vTeams.updateTeamById);
    app.post('/api/teams/removeTeamsByIdList', helper.canAccessRoute(['admin']),vTeams.removeTeamsByIdList);
    app.post('/api/teams/assignTeamToSelectedProject', helper.canAccessRoute(['admin']),vTeams.assignTeamToSelectedProject);
    app.post('/api/teams/getTeamsListByFilter', helper.canAccessRoute(['admin','agent','reviewer','superreviewer']),vTeams.getTeamsListByFilter);

};

