'use strict';
angular
    .module('ideotics')
    .factory('DataService', DataService);

DataService.$inject = ['$http', '$localStorage'];

function DataService($http, $localStorage) {

    var selectedVideo = new Object();
    var heatMapFilterObj = new Object();
    return {
        getEvents: getEvents,
        newEvent: newEvent,
        updateEvent: updateEvent,
        getEventsByVideoPagination: getEventsByVideoPagination,
        removeEvent: deleteEvent,
        getEventsByVideoAggregation: getEventsByVideoAggregation,

        setSelectedVideo: setSelectedVideo,
        getSelectedVideo: getSelectedVideo,

        setHeatMapFilterObj: setHeatMapFilterObj,
        getHeatMapFilterObj: getHeatMapFilterObj,
        getEventsByVideoForHeatMap: getEventsByVideoForHeatMap,
        saveEventssFromCSVWithForm: saveEventssFromCSVWithForm,
        getEventListByVideo: getEventListByVideo,
        getAllEventsByStartTime: getAllEventsByStartTime

    };

    function setSelectedVideo(currentVideo) {
        selectedVideo = currentVideo;
    }

    function getSelectedVideo() {
        return selectedVideo;
    }

    function setHeatMapFilterObj(filterObj) {
        heatMapFilterObj = filterObj;
    }

    function getHeatMapFilterObj() {
        return heatMapFilterObj;
    }

    function getEvents(videoId) {
        return $http.get('/api/data/videoId/' + videoId);
    };

    function getEventsByVideoForHeatMap(filterObj) {
        return $http.post('/api/data/getEventsByVideoForHeatMap', filterObj);
    };

    function getEventsByVideoPagination(pageNo, videoId) {
        return $http.post('/api/data/getEventsByVideoPagination', { page: pageNo, videoId: videoId });
    };

    function getEventsByVideoAggregation(inputObj) {
        return $http.post('/api/data/getEventsByVideoAggregation', inputObj);
    };

    function deleteEvent(eventId, videoId, discarded, discardUserId) {
        return $http.post('/api/removeEventById', { eventId: eventId, videoId: videoId, isDiscarded: discarded, discardUserId: discardUserId });
    };

    function saveEventssFromCSVWithForm(csvData, videoId, videoObj) {
        return $http.post('/api/data/saveEventsFromCSVWithForm', { csvData: csvData, videoId: videoId, frameWidth: videoObj.frameWidth, frameHeight: videoObj.frameHeight });
    }

    function getEventListByVideo(videoId, current_time, frame_rate) {
        return $http.post('/api/data/getEventListByVideo', { videoId, current_time, frame_rate });
    }

    function getEventSubListByVideo(videoId) {
        return $http.post('/api/data/getEventSubListByVideo', { videoId: videoId });
    }

    function newEvent(data) {

        if (data.eventId != undefined) {
            return $http.put('/api/event/update', data);
        } else {
            return $http.post('/api/event', data);
        }

    };

    function updateEvent(data) {
        return $http.put('/api/event/update', data);
    };

    function getAllEventsByStartTime(filterObj) {
        return $http.post('/api/data/getAllEventsByStartTime', filterObj);
    };

}