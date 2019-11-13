'use strict';
angular
    .module('ideotics')
    .factory('UserSessionService', UserSessionService);

UserSessionService.$inject = ['$http'];
function UserSessionService($http) {

    return {
        getUserSessions: getUserSessions,
        getUserSessionsByUser: getUserSessionsByUser
    };

    function getUserSessions() {
        return $http.get('/api/usersession');
    }

    function getUserSessionsByUser(userId,selectedDate)
    {
        return $http.post('/api/usersession/getUserSessionsByUser', {userId:userId,selectedDate:selectedDate});
    }
}
