var videos = require('../controllers/videos');
var reports = require('../controllers/reports');
var helper = require('../utils/helper');

module.exports = exports = function (options) {
	'use strict';

	var app = options.app;


    app.post('/api/video', videos.newVideo);
    app.post('/api/video/saveUploadedVideo', videos.newVideo);
    app.post('/api/video/saveUploadedVideoAws', videos.saveUploadedVideoAws);
    app.post('/api/clientuploadvideo/newClientUploadVideo', videos.newClientUploadVideo);
    app.post('/client/api/clientuploadvideo/newClientUploadVideo', videos.newClientUploadVideo);

	// app.post('/api/video', helper.canAccessRoute(['admin','agent']), videos.newVideo);
	app.post('/api/videos/unlock', helper.canAccessRoute(['admin']), videos.unlockAllVideos);
	app.post('/api/videos/unlock/:videoId', helper.canAccessRoute(['admin']), videos.unlockVideo);
    app.post('/api/videos/getVideosListByCamera', helper.canAccessRoute(['admin','reviewer','superreviewer']), videos.getVideosListByCamera);

	app.get('/api/videos', helper.canAccessRoute(['admin','agent','reviewer','superreviewer']), videos.getVideos);
	app.get('/api/videos/:userId', helper.canAccessRoute(['admin','agent','reviewer','superreviewer']), videos.getVideosForUserId);

    app.get('/api/video/:videoId/status', helper.canAccessRoute(['admin','agent','reviewer','superreviewer']), videos.getVideoStatus);

	app.put('/api/video/update', helper.canAccessRoute(['admin','agent','reviewer','superreviewer']), videos.updateVideo);

    app.put('/api/video/syncSubmittedVideosToMysql', helper.canAccessRoute(['admin','agent','reviewer','superreviewer']), videos.syncSubmittedVideosToMysql);
	app.put('/api/video/lock', helper.canAccessRoute(['admin','agent','reviewer','superreviewer']), videos.lockVideo);

    app.get('/api/videos/getAllSubmittedVideos/:status', helper.canAccessRoute(['admin','agent','reviewer','superreviewer']), videos.getAllSubmittedVideos);

    app.get('/api/video/calculateAndUpdateAgentsTime', helper.canAccessRoute(['admin','agent','reviewer','superreviewer']), videos.calculateAndUpdateAgentsTime);

    app.get('/api/video/getAllVideos', helper.canAccessRoute(['admin','agent','reviewer','superreviewer']), videos.getAllVideos);
    app.post('/api/videos/updateVideoById', helper.canAccessRoute(['admin','agent','reviewer','superreviewer']), videos.updateVideoById);
    
    app.post('/api/video/getVideosListByProject', helper.canAccessRoute(['admin','agent','reviewer','superreviewer']), videos.getVideosListByProject);
    app.post('/api/video/getCountListByProject', helper.canAccessRoute(['admin','agent','reviewer','superreviewer']), videos.getCountListByProject);

    app.post('/api/video/updateVideoByVideoId', helper.canAccessRoute(['admin','agent','reviewer','superreviewer']), videos.updateVideoByVideoId);
    app.post('/api/video/unAssignVideosFromUsers', helper.canAccessRoute(['admin','reviewer','superreviewer']), videos.unAssignVideosFromUsers);

    app.post('/api/video/saveVideosFromCSV', helper.canAccessRoute(['admin']),videos.saveVideosFromCSV);
    app.post('/api/video/saveVideosFromCSVWithForm', helper.canAccessRoute(['admin']),videos.saveVideosFromCSVWithForm);
    app.post('/api/video/removeVideoById', helper.canAccessRoute(['admin']),videos.deleteVideoById);

    app.post('/api/video/hideVideosByVideoIds', helper.canAccessRoute(['admin']),videos.hideVideosByVideoIds);

    app.post('/api/video/setHasEventsVideosByVideoIds', helper.canAccessRoute(['admin']),videos.setHasEventsVideosByVideoIds);

    app.post('/api/videos/getAllSubmittedVideosByUserAndDate', helper.canAccessRoute(['admin','agent','reviewer','superreviewer']),videos.getAllSubmittedVideosByUserAndDate);

    app.post('/api/video/getSubmittedVideoEventToCSVExport', helper.canAccessRoute(['admin','agent','reviewer','superreviewer']), videos.getSubmittedVideoEventToCSVExport);
    //app.post('/api/video/getSubmittedEventToCSVExport', helper.canAccessRoute(['admin','agent','reviewer','superreviewer']), videos.getSubmittedEventToCSVExport);
    app.post('/api/video/getSubmittedEventToCSVExport', helper.canAccessRoute(['admin','agent','reviewer','superreviewer']), reports.getSubmittedEventToCSVExport);

    app.post('/api/video/updatecamvideos', helper.canAccessRoute(['admin','agent','reviewer','superreviewer']), videos.updatecamvideos);
    app.get('/api/video/getCamResult', helper.canAccessRoute(['admin','agent','reviewer','superreviewer']), videos.getCamResult);
};

