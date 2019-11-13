"use strict";
angular
    .module('ideotics')
    .controller('ClientUploadedVideosController', ClientUploadedVideosController);

ClientUploadedVideosController.$inject = ['$scope','$rootScope','$http','$window', '$q' ,'$filter','$location', 'UserService','ClientUplodadedVideoService','ProjectsService','CamerasService'];
function ClientUploadedVideosController($scope,$rootScope,$http,$window, $q ,$filter, $location, UserService,ClientUplodadedVideoService,ProjectsService,CamerasService) {

    window.dashboard = false;
    $rootScope.setHeaderglobal(8);
    $rootScope.setSortColumnAndOrder('client',false);

    var vm = this;

    vm.videos = [];
    vm.videosCopy = [];

    vm.usersList = [];
    vm.usersListCopy = [];

    vm.userObjList = {};

    vm.selectedVideo = '';

    vm.resluts = '';
    vm.userAgentsList = [];
    vm.usersList = [];
    vm.usersArrayList = [];
    vm.selectedUseId = '0';

    var date = new Date();
    vm.selectedDate = date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate();

    UserService
        .getUsers()
        .success(function(data, status) {
            vm.usersList = data;
            var len=0;
            var usersLen = vm.usersList.length;
            for(;len<usersLen;len++)
            {
                vm.usersArrayList[vm.usersList[len].userId] = vm.usersList[len].firstName;

                if(vm.usersList[len].role && vm.usersList[len].role === 'client')
                {
                    vm.userAgentsList.push(vm.usersList[len]);
                }
            }

            var dummyVal = {userId: 0, firstName: 'Select User'};
            vm.userAgentsList.splice(0,0, dummyVal);

            vm.filterByUser();
        }).error(function(err, status) {
            console.log(err);
            console.log(status);
        });

    vm.resetFilterForm = function(type)
    {
        vm.selectedUseId = '0';
        vm.selectedDate = date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate();
        vm.selectProjectName='0';
        vm.filterByUser();
    }

    vm.filterByUser = function() {
        ClientUplodadedVideoService
            .getAllUploadedVideosByUserAndDate(vm.selectProjectName,vm.selectedUseId,vm.selectedDate)
            .success(function(data, status) {
                vm.videos = data;

                if(vm.videos.length>0)
                {
                    vm.videos.forEach(function(element) {
                        element.userName = vm.usersArrayList[element.userId];
                    });
                }else
                {
                    vm.events = [];
                    vm.videosNoneMsg = 'Videos List Empty';
                }
                vm.analysing = false;
            }).error(function(err, status)
            {
            });
        //}
    }

    vm.showProject = function(user) {
        var selected = [];
        if(user.client)
            selected = $filter('filter')(vm.projects, {clientsId: user.client});
        return selected.length ? selected[0].clientname : 'Not set';
    };

    vm.projects = [];
    vm.getProjectsList = function()
    {
        var filterObj = {isbase:false};
        ProjectsService
            .getAllProjects(filterObj)
            .success(function(data, status) {
                vm.projects = data;
                var dummyVal = {clientsId: 0, clientname: 'Project Name'};
                vm.projects.splice(0,0, dummyVal);
            }).error(function(err, status) {
                 console.log(err);
                 console.log(status);
        });
    }

    vm.selectProjectName='0';

    $("#checkAll").change(function () {
        $("input:checkbox").prop('checked', $(this).prop("checked"));

        for(var len=0;len<vm.videos.length;len++)
        {
            vm.videos[len].checked = $(this).prop("checked");
        }
    });
}
