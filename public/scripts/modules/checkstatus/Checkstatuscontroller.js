'use strict';
angular
    .module('ideotics')
    .controller('CheckLoginStatusController', CheckLoginStatusController);

CheckLoginStatusController.$inject = ['$location','$rootScope'];
function CheckLoginStatusController($location,$rootScope) {
    $rootScope.currentLoggedInUserId = '';
    var vm = this;
    vm.loadmsg = {
        showMessage: true,
        msg: 'Loading Ideotics Please Wait.....'
    };

    $rootScope.tabs = [];
    $rootScope.uniqueTabArr = [];

    var userObjFrmLocalStrg = $rootScope.getCookie("userObject");
    if(isVaulueValid(userObjFrmLocalStrg) && userObjFrmLocalStrg  && userObjFrmLocalStrg !== undefined && userObjFrmLocalStrg !== 'undefined'
        && userObjFrmLocalStrg !== '' && userObjFrmLocalStrg !== null)
    {
        $rootScope.openPageByUserRole(userObjFrmLocalStrg);
    }else
    {
        $location.path('/Login');
    }
};
