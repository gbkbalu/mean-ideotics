var  vCameras= require('../controllers/cameras');
var helper = require('../utils/helper');

module.exports = exports = function (options) {
	'use strict';

	var app = options.app;

    app.get('/api/cameras', helper.canAccessRoute(['admin','agent','reviewer','superreviewer']),vCameras.getCameras);
    app.post('/api/cameras/updateCamera', helper.canAccessRoute(['admin']),vCameras.updateCamera);
    app.post('/api/cameras', helper.canAccessRoute(['admin']),vCameras.saveCamera);
    app.get('/api/cameras/removeCameraById/:cameraId', helper.canAccessRoute(['admin']), vCameras.removeCameraById);

    app.post('/api/cameras/updateCameraById', helper.canAccessRoute(['admin']), vCameras.updateCameraById);
    app.post('/api/cameras/getCamerasListByProject', helper.canAccessRoute(['admin','agent','reviewer','superreviewer']), vCameras.getCamerasListByProject);

    app.post('/api/cameras/removeCamerassByIdList', helper.canAccessRoute(['admin']),vCameras.removeCamerassByIdList);

    app.post('/api/cameras/getAllBaseConfigCameras', helper.canAccessRoute(['admin']),vCameras.getAllBaseConfigCameras);
    app.post('/api/cameras/getAllBaseConfigCamerasByFiltler', helper.canAccessRoute(['admin']),vCameras.getAllBaseConfigCamerasByFiltler);
    app.post('/api/cameras/getCamerasListByFilter', helper.canAccessRoute(['admin','agent','reviewer','superreviewer']),vCameras.getCamerasListByFilter);

    app.post('/api/cameras/copyParamsFromSelectedBaseCam', helper.canAccessRoute(['admin']),vCameras.copyParamsFromSelectedBaseCam);

};

