'use strict';
angular
    .module('ideotics')
    .factory('TestService', TestService);

TestService.$inject = ['$http', '$localStorage'];

function TestService($http, $localStorage) {

    return {
        getEvents: getEvents,

        getEventListByVideo: getEventListByVideo
    };

    function getEvents(videoId) {
        return $http.get('/api/tests/videoId/' + videoId);
    };

    function getEventListByVideo(videoId, current_time, frame_rate) {
        return $http.post('/api/tests/getEventListByVideo', { videoId, current_time, frame_rate });
    }

}