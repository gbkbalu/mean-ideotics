"use strict";
angular
    .module('ideotics')
    .controller('HomeController', HomeController);

HomeController.$inject = ['$scope', '$http', '$localStorage', '$cookies', '$rootScope', 'CommonService', 'HelperService', 'ProjectsService', 'CamerasService'];

function HomeController($scope, $http, $localStorage, $cookies, $rootScope, CommonService, HelperService, ProjectsService, CamerasService) {

    window.dashboard = true;
    $rootScope.setHeaderglobal(16);

    var vm = this;

    vm.countListObj = { teamsCount: 0, usersCount: 0, projectCount: 0, cameraCount: 0, videoCount: 0 };
    $scope.labels = ["Not Processed", "Under Processing", "Processed"];
    $scope.series = ['Series A'];
    $scope.data = [
        [150, 5, 900]
    ];
    $scope.options = {
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero: true
                }
            }],
            xAxes: [{
                ticks: {
                    beginAtZero: true,
                    mirror: true
                }
            }]
        }
    }

    $scope.onClick = function(points, evt) {
        console.log(points, evt);
    };

    vm.getHomeDashBoardData = function() {
        CommonService.getDashBoardData().success(function(data, status) {
            vm.countListObj = data;
            $scope.data[0] = data.videosStatus.NotProcessed;
            $scope.data[1] = data.videosStatus.UnderProcessing;
            $scope.data[2] = data.videosStatus.Processed;

            HelperService.getHelperDataService();
        }).error(function(err, status) {});
    }

    vm.isAdmin = false;
    if ($localStorage.user.role == 'admin') {
        vm.isAdmin = true;
    }
    vm.getHomeDashBoardData();

    vm.selectProjectName = '0';
    var arrayProjects = [];
    vm.projects = [];
    vm.projOriginalList = [];
    vm.getProjectsList = function() {
        var filterObj = { isbase: false };
        ProjectsService
            .getAllProjects(filterObj)
            .success(function(data, status) {
                vm.projects = data;
                for (var projLen = 0; projLen < vm.projects.length; projLen++) {
                    arrayProjects[vm.projects[projLen].clientsId] = vm.projects[projLen]._id;
                }
                vm.projOriginalList = angular.copy(vm.projects);

                var dummyVal = { _id: 0, clientname: 'Project Name' };
                vm.projects.splice(0, 0, dummyVal);
            }).error(function(err, status) {
                console.log(err);
                console.log(status);
            });
    }

    vm.selectCameraName = '0';
    var dummyVal = { _id: 0, cameracode: 'Camera Name' };
    vm.cameras = [];
    vm.cameras.push(dummyVal);
    vm.getCamerasListByProject = function() {
        if (vm.selectProjectName !== undefined && vm.selectProjectName !== null && vm.selectProjectName !== 0) {
            CamerasService
                .getCamerasListByProject(vm.selectProjectName)
                .success(function(data, status) {
                    vm.cameras = data;
                    vm.cameras.splice(0, 0, dummyVal);
                }).error(function(err, status) {
                    console.log(err);
                    console.log(status);
                });
        }
        vm.selectCameraName = '0';
    }

    vm.filterByProject = function() {
        vm.cameras = [];
        vm.cameras.splice(0, 0, dummyVal);

        vm.getCamerasListByProject();
        vm.getVideosCountsByFilter();
    }

    vm.resetFilterForm = function() {
        vm.selectProjectName = '0';
        vm.selectCameraName = '0';
        vm.getVideosCountsByFilter();
    }

    vm.getVideosCountsByFilter = function() {
        var filterObj = { project: vm.selectProjectName, camera: vm.selectCameraName };
        CommonService.getVideosCountsByFilter(filterObj).success(function(data, status) {
            $scope.data[0] = data.videosStatus.NotProcessed;
            $scope.data[1] = data.videosStatus.UnderProcessing;
            $scope.data[2] = data.videosStatus.Processed;
        }).error(function(err, status) {});
    }

    vm.downloadLogsFiles = function() {
        $http.post("/logs/downloadLogFiles", {}, { responseType: 'arraybuffer' })
            .then(function(response) {
                var a = document.createElement('a');
                var blob = new Blob([response.data], { 'type': "application/octet-stream" });
                a.href = URL.createObjectURL(blob);
                a.download = "logfiles.zip";
                a.click();
            });
    }

};