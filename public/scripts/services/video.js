'use strict';
angular
    .module('ideotics')
    .factory('VideoService', VideoService);

VideoService.$inject = ['$http'];
function VideoService($http) {

    var selectedVideoDetails = new Object();
    return {
        saveUploadedVideo:saveUploadedVideo,
        saveUploadedVideoAws:saveUploadedVideoAws,
        getVideos: getVideos,
        getUnlockedVideos: getUnlockedVideos,
        lockVideo: lockVideo,
        getStatus: getStatus,
        unlockAllVideos: unlockAllVideos,
        pauseAnalysis: pauseAnalysis,
        updateVideoStatus: updateVideoStatus,
        syncSubmittedVideosToMysql:syncSubmittedVideosToMysql,
        getAllVideos:getAllVideos,
        updateVideoById:updateVideoById,
        getListOfVideosToSync:getListOfVideosToSync,
        syncMysqlToMongoAndUpdate:syncMysqlToMongoAndUpdate,
        updateVideoByUsingVideoId:updateVideoByUsingVideoId,
        saveVideosFromCSV:saveVideosFromCSV,
        saveVideosFromCSVWithForm:saveVideosFromCSVWithForm,
        removeVideoById:removeVideoById,
        hideVideosByVideoIds:hideVideosByVideoIds,
        setHasEventsVideosByVideoIds:setHasEventsVideosByVideoIds,
        clientUploadVideo:clientUploadVideo,
        getAllSubmittedVideos:getAllSubmittedVideos,
        getAllSubmittedVideosByUserAndDate:getAllSubmittedVideosByUserAndDate,
        getVideosListByProject:getVideosListByProject,

        setSelectedVideo : setSelectedVideo,
        getSelectedVideo : getSelectedVideo,
        clearSelectedVideo:clearSelectedVideo,

        getSubmittedVideoEventToCSVExport:getSubmittedVideoEventToCSVExport,
        unAssignVideosFromUsers:unAssignVideosFromUsers,

        getCountListByProject:getCountListByProject,
        getVideosListByCamera:getVideosListByCamera,
        updatecamvideos:updatecamvideos,
        getCamResult:getCamResult

    };

    function setSelectedVideo(project)
    {
        selectedVideoDetails = project;
    }

    function getSelectedVideo()
    {
        return selectedVideoDetails;
    }

    function clearSelectedVideo()
    {
        selectedVideoDetails = new Object();
    }

    function getVideosListByCamera(cameraId,hidden)
    {
        return $http.post('/api/videos/getVideosListByCamera',{cameraId:cameraId, hidden:hidden});
    }

    function updatecamvideos(videosObj)
    {
        return $http.post('/api/video/updatecamvideos',videosObj);
    }

    function getCamResult()
    {
        return $http.get('/api/video/getCamResult');
    }

    function getSubmittedVideoEventToCSVExport(eventOrSku,videoId) {
        return $http.post('/api/video/getSubmittedVideoEventToCSVExport',{eventOrSku:eventOrSku,videoId:videoId});
    }

    function getVideos() {
        return $http.get('/api/videos?status=0');
    }

    function getUnlockedVideos(userId) {
        return $http.get('/api/videos/'+ userId);
    }

    function getAllSubmittedVideos() {
        return $http.get('/api/videos/getAllSubmittedVideos/'+ 2);
    }

    function getAllSubmittedVideosByUserAndDate(client,camera,userId,selectedDate,status,hiddenFlag,pageNum,pageSize)
    {
        //return $http.get('/api/video/convertTimeToMilliSeconds');
        //return $http.get('/api/video/calculateAndUpdateAgentsTime');
        return $http.post('/api/videos/getAllSubmittedVideosByUserAndDate', {client:client,camera:camera,userId:userId,selectedDate:selectedDate,status:status,hidden:hiddenFlag,pageNum:pageNum,pageSize:pageSize});
    }

    function getVideosListByProject(filterObj)
    {
        return $http.post('/api/video/getVideosListByProject', filterObj);
    }

    function getCountListByProject(filterObj)
    {
        return $http.post('/api/video/getCountListByProject', filterObj);
    }

    function unlockAllVideos() {
        return $http.post('/api/videos/unlock');
    }

    function lockVideo(userId, videoId){
        return $http.put('/api/video/lock', {userId: userId, videoId: videoId});
    }

    function updateVideoStatus(videoId, status,videoTimeAtSubmitted){
        return $http.put('/api/video/update', {videoId: videoId, status: status,videoSubmittedTime:videoTimeAtSubmitted});
    }

    function syncSubmittedVideosToMysql(inputObject){
        return $http.put('/api/video/syncSubmittedVideosToMysql', inputObject);
    }

    function getStatus(videoId) {
        return $http.get('/api/video/'+ videoId + '/status');
    }

    function pauseAnalysis(userId, videoId, videoTime) {

        videoTime = videoTime ? videoTime: 0;

        return $http.post('/api/users/pausedVideo', {userId: userId, videoId: videoId, videoTime: videoTime});
    }

    function getAllVideos() {
        return $http.get('/api/videos');
    }

    function updateVideoById(data, _id) {

        data = setUndefinedToEmpty(data);
        if(_id !== '' && _id !== 'undefined' && _id !== undefined && _id !== null )
        {
            return $http.post('/api/videos/updateVideoById', {_id: _id, data: data});
        }
        else
        {
            return $http.post('/api/video', data);
        }
    }

    function clientUploadVideo(data, _id) {

        data = setUndefinedToEmpty(data);
        return $http.post('/api/clientuploadvideo/newClientUploadVideo', data);

    }

    function saveUploadedVideo(data)
    {
        data = setUndefinedToEmpty(data);
        return $http.post('/api/video/saveUploadedVideo', data);
    }

    function saveUploadedVideoAws(arrObjsList, copyObjParams)
    {
        return $http.post('/api/video/saveUploadedVideoAws', {videoList:arrObjsList, s3objList:copyObjParams});
    }

    function getListOfVideosToSync() {
        return $http.get('/api/video/getListOfVideosToSync');
    }

    function syncMysqlToMongoAndUpdate(videoId,resetUserAndStatus)
    {
        return $http.post('/api/video/syncMysqlToMongoAndUpdate', {videoId: videoId,resetUserAndStatus:resetUserAndStatus});
    }

    function updateVideoByUsingVideoId(videoData)
    {
        return $http.post('/api/video/updateVideoByVideoId', videoData);
    }

    function saveVideosFromCSV(data) {
        return $http.post('/api/video/saveVideosFromCSV',data);
    }

    function saveVideosFromCSVWithForm(csvData,formData) {
        return $http.post('/api/video/saveVideosFromCSVWithForm',{csvData:csvData,formDetails:formData});
    }

    function removeVideoById(videoData)
    {
        return $http.post('/api/video/removeVideoById', videoData);
    }

    function hideVideosByVideoIds(hidden,videoData)
    {
        return $http.post('/api/video/hideVideosByVideoIds', {videoIds:videoData,hidden:hidden});
    }

    function setHasEventsVideosByVideoIds(hasMysqlEvents,videoData)
    {
        return $http.post('/api/video/setHasEventsVideosByVideoIds', {videoIds:videoData,hasMysqlEvents:hasMysqlEvents});
    }

    function unAssignVideosFromUsers(videoData)
    {
        return $http.post('/api/video/unAssignVideosFromUsers', {videoIds:videoData});
    }
}

