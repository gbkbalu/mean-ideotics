'use strict';
angular
    .module('ideotics')
    .factory('EventService', EventService);

EventService.$inject = ['$http', '$localStorage'];

function EventService($http, $localStorage) {

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
        getAllShoppersByStartTime: getAllShoppersByStartTime

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
        return $http.get('/api/events/videoId/' + videoId);
    };

    function getEventsByVideoForHeatMap(filterObj) {
        return $http.post('/api/events/getEventsByVideoForHeatMap', filterObj);
    };

    function getEventsByVideoPagination(pageNo, videoId) {
        return $http.post('/api/events/getEventsByVideoPagination', { page: pageNo, videoId: videoId });
    };

    function getEventsByVideoAggregation(inputObj) {
        return $http.post('/api/events/getEventsByVideoAggregation', inputObj);
    };

    function deleteEvent(eventId, videoId, discarded, discardUserId) {
        return $http.post('/api/removeEventById', { eventId: eventId, videoId: videoId, isDiscarded: discarded, discardUserId: discardUserId });
    };

    function saveEventssFromCSVWithForm(csvData, videoId, videoObj) {
        return $http.post('/api/events/saveEventsFromCSVWithForm', { csvData: csvData, videoId: videoId, frameWidth: videoObj.frameWidth, frameHeight: videoObj.frameHeight });
    }

    function getEventListByVideo(videoId) {
        return $http.post('/api/events/getEventListByVideo', { videoId: videoId });
    }

    function getEventSubListByVideo(videoId) {
        return $http.post('/api/events/getEventSubListByVideo', { videoId: videoId });
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

    function getAllShoppersByStartTime(filterObj) {
        return $http.post('/api/events/getAllShoppersByStartTime', filterObj);
    };

}