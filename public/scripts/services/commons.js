'use strict';
angular
    .module('ideotics')
    .factory('CommonService', CommonService);

CommonService.$inject = ['$http'];
function CommonService($http) {

    return {
        getDashBoardData:getDashBoardData,
        getVideosCountsByFilter:getVideosCountsByFilter
    };

    function getDashBoardData() {
        return $http.post('/api/common/getDashBoardData',{});
    };

    function getVideosCountsByFilter(filterObj) {
        return $http.post('/api/common/getVideosCountsByFilter',filterObj);
    };
}

