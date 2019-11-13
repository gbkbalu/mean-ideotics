'use strict';
angular
    .module('ideotics')
    .controller('UserSessionController', UserSessionController);

UserSessionController.$inject = ['$scope','$localStorage', '$rootScope','UserService','UserSessionService'];
function UserSessionController($scope, $localStorage, $rootScope, UserService,UserSessionService) {

    window.dashboard = false;
    $rootScope.setHeaderglobal(6);

    var vm = this;
    vm.usersList = [];

    vm.userNameByIndexArray = [];

    var date = new Date();
    vm.selectedDate = date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate();


    vm.selectedUseId = '0';
    vm.userSessionList = [];

    vm.resetFilterForm = function(type)
    {
        vm.selectedUseId = '0';
        vm.selectedDate = date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate();
        vm.filterByUser();
    }

    vm.filterByUser = function() {
        //if(vm.selectedUseId !== '0')
        //{
            UserSessionService.getUserSessionsByUser(vm.selectedUseId,vm.selectedDate)
                .success(function(data, status) {
                    vm.userSessionList = data;
                    console.log(data)
                    var sessLen = 0;
                    var listLen = vm.userSessionList.length;
                    for(;sessLen<listLen;sessLen++)
                    {
                        if(vm.userSessionList[sessLen].loginTime !== undefined && vm.userSessionList[sessLen].loginTime !== null)
                            vm.userSessionList[sessLen].loginTime = getAvailableFrmOrToDtFrmt(vm.userSessionList[sessLen].loginTime);
                        if(vm.userSessionList[sessLen].logOutTime !== undefined && vm.userSessionList[sessLen].logOutTime !== null)
                            vm.userSessionList[sessLen].logOutTime = getAvailableFrmOrToDtFrmt(vm.userSessionList[sessLen].logOutTime);

                        vm.userSessionList[sessLen].userName = vm.userNameByIndexArray[vm.userSessionList[sessLen].userId];
                    }


                }).error(function(err, status) {
                    console.log(err);
                    console.log(status);
                });
        //}
    }

    UserService
        .getUsers()
        .success(function(data, status) {
            vm.usersList = [];
            var dummyVal = {userId: 0, firstName: 'Select User'};

            for(var userLen = 0; userLen<data.length ; userLen++)
            {
                vm.userNameByIndexArray[data[userLen].userId]  = data[userLen].firstName;

                if($localStorage.user.role == 'reviewer' || $localStorage.user.role === 'superreviewer')
                {
                    if(data[userLen].role == "agent")
                    {
                        vm.usersList.push(data[userLen]);
                    }
                }else
                {
                    vm.usersList.push(data[userLen]);
                }
            }

            vm.usersList.splice(0,0, dummyVal);
            vm.filterByUser();
        }).error(function(err, status) {
            console.log(err);
            console.log(status);
        });

    vm.totalRecords = 100;
    vm.PageSize = 10;
    vm.pageChanged = function()
    {
        console.log('logs..')
    }
    vm.CurrentPageNumber = 1;
    vm.numPages = 20;
}
