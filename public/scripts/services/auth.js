'use strict';
angular
    .module('ideotics')
    .factory('AuthService', AuthService);

AuthService.$inject = ['$http', '$localStorage','$location','$rootScope','$cookies'];
function AuthService($http, $localStorage,$location,$rootScope,$cookies) {

    var authService = {};

    authService.login = login;
    authService.isAuthenticated = isAuthenticated;
    authService.isAuthorized = isAuthorized;
    authService.logout = logout;
    authService.clearAllSessions = clearAllSessions;
    authService.clearSessionAndCookie = clearSessionAndCookie;

    function login(credentials) {
        var encodedData = btoa(JSON.stringify(credentials));
        credentials.data = encodedData;
        return $http
            .post('/user/login', credentials)
            .then(function(res) {
                $localStorage.id = res.data.id;
                $rootScope.token = res.data.token;
                $localStorage.token = res.data.token;
                $localStorage.role = res.data.user.role;

                // Set token in header
                //$http.defaults.headers.common.session_id = res.data.token;
                $http.defaults.headers.common.session_id = $localStorage.id;
                return res.data.user;
            });
    }

    function logout() {
        return $http
            .post('/api/user/logout')
            .then(function(res) {
                clearAllSessions();
                return true;
            });
    }

    function clearAllSessions() {
        $rootScope = $rootScope.$new(true);

        $localStorage.id = null;
        $localStorage.role = null;
        $localStorage.user = null;
        $rootScope.TimeOutTimerValue = 20*60*1000;

        var cookies = $cookies.getAll();
        angular.forEach(cookies, function (v, k) {
            $cookies.remove(k);
        });
        $location.path('/Login');
    }

    function clearSessionAndCookie() {
        if (isVaulueValid($localStorage.id)) {
            logout();
        }else
        {
            clearAllSessions()
        }
    }

    function isAuthenticated() {
        return !!$localStorage.id;
    }

    function isAuthorized(authorizedRoles) {
        if(!angular.isArray(authorizedRoles)){
            authorizedRoles = [authorizedRoles];
        }

        return (authService.isAuthenticated() && authorizedRoles.indexOf($localStorage.role) !== -1);
    }

    return authService;
}
