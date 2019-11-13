var videos = require('../controllers/clientuploadedvideos');
var helper = require('../utils/helper');

module.exports = exports = function (options) {
	'use strict';
    var app = options.app;

    app.post('/api/clientuploadedvideos/newClientUploadVideo', videos.newClientUploadVideo);

	app.get('/api/clientuploadedvideos', helper.canAccessRoute(['admin','agent']), videos.getAllClientUploadedVideos);
    app.post('/api/clientuploadedvideos/getAllUploadedVideosByUserAndDate', helper.canAccessRoute(['admin']),videos.getAllUploadedVideosByUserAndDate);

};
