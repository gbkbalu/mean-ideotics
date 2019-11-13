'use strict';
angular
    .module('ideotics')
    .factory('ClientUplodadedVideoService', ClientUplodadedVideoService);

ClientUplodadedVideoService.$inject = ['$http'];
function ClientUplodadedVideoService($http) {

    return {
        clientUploadVideo:clientUploadVideo,
        getAllUploadedVideosByUserAndDate:getAllUploadedVideosByUserAndDate
    };

    function clientUploadVideo(data, _id) {

        data = setUndefinedToEmpty(data);
        return $http.post('/api/clientuploadedvideos/newClientUploadVideo', data);
    }

    function getAllUploadedVideosByUserAndDate(client,userId,selectedDate)
    {
        return $http.post('/api/clientuploadedvideos/getAllUploadedVideosByUserAndDate', {client:client,userId:userId,selectedDate:selectedDate});
    }
}
