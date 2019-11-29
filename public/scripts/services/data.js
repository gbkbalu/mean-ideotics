'use strict';
angular
    .module('ideotics')
    .factory('DataService', DataService);

DataService.$inject = ['$http', '$localStorage'];

function DataService($http, $localStorage) {

    return {
        getEventListByVideo: getEventListByVideo
    };

    function getEventListByVideo(videoId, frame_no, buff_request_size) {
        return $http.post('/api/data/getObjectListByVideo', { videoId, frame_no, buff_request_size });
    }
}