var  vClients= require('../controllers/clients');
var helper = require('../utils/helper');

module.exports = exports = function (options) {
	'use strict';

	var app = options.app;

    app.post('/api/clients', helper.canAccessRoute(['admin','agent','reviewer','superreviewer']),vClients.getClients);
    app.post('/api/clients/updateClient', helper.canAccessRoute(['admin']),vClients.updateClient);
    app.post('/api/clients/saveNewClient', helper.canAccessRoute(['admin']),vClients.saveClient);
    app.get('/api/clients/removeClientById/:iconId', helper.canAccessRoute(['admin']), vClients.removeIconByClientId);

    app.post('/api/clients/updateClientById', helper.canAccessRoute(['admin']), vClients.updateClientById);

    app.post('/api/clients/removeClientsByIdList', helper.canAccessRoute(['admin']),vClients.removeClientsByIdList);
    app.post('/api/clients/createCatsFromBaseProjectToProject', helper.canAccessRoute(['admin']),vClients.createCatsFromBaseProjectToProject);
    app.post('/api/clients/createProjectCatsFromBaseProject', helper.canAccessRoute(['admin']),vClients.createProjectCatsFromBaseProject);

};
