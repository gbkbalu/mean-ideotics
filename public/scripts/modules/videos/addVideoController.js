'use strict';
angular
    .module('ideotics')
    .controller('AddVideoController', AddVideoController);

AddVideoController.$inject = ['$scope','$timeout','$rootScope','$location', 'UserService','ProjectsService','CamerasService','VideoService'];
function AddVideoController($scope,$timeout, $rootScope,$location, UserService,ProjectsService,CamerasService,VideoService) {

    // window.dashboard === false, terminate polling
    window.dashboard = false;
    $rootScope.setHeaderglobal(5);


    var vm = this;
    vm.users = [];
    vm.errorMessage = '';
    vm.pageTitle = "Add New Video";

    vm.assignStatusType = [
        {value: 0, text: 'Not Assigned'},
        {value: 1, text: 'Assigned'},
        {value: 2, text: 'Submitted'}
    ];

    vm.syncStatusType = [
        {value: 0, text: 'Not Synced'},
        {value: 1, text: 'Synced'}
    ];

    vm.videoFromAws = [
        {value: true, text: 'Video From AWS'},
        {value: false, text: 'Video From Outside'}
    ];

    vm.newEmptyVideo = function(){
        var video = new Object();
        video.name = '';
        video.url = '';
        video.status = 0;
        video.datasynced = 0;
        video.cameraId = '0';
        video.client = '';
        video.project = '';
        video.camera = '';
        return video;
    };

    vm.addVideo = vm.newEmptyVideo();

    vm.editVideoDetails = VideoService.getSelectedVideo();

    vm.saveBtnName = 'Save Video';
    vm.showResetBtn = true;
    vm.showIsEdit = false;

    if(!isEmpty(vm.editVideoDetails))
    {
        vm.pageTitle = "Edit Video";
        vm.saveBtnName = 'Update Video';
        vm.showResetBtn = false;
        vm.showIsEdit = true;
        vm.addVideo = angular.copy(vm.editVideoDetails);
    }

    vm.resetUserForm = function()
    {
        vm.errorMessage = '';
        if(!vm.showIsEdit)
        {
            vm.addVideo = vm.newEmptyVideo();
        }else
        {
            vm.addVideo = angular.copy(vm.editVideoDetails);
        }
    }

    vm.camerasList = [];
    vm.getCamerasList = function()
    {
        vm.cameras = [];
        CamerasService
            .getAllCameras()
            .success(function(data, status) {
                vm.camerasList = data;
            }).error(function(err, status) {
                console.log(err);
                console.log(status);
            });
    }

    vm.getCamerasListByProject = function()
    {
        if(arrayProjects[vm.addVideo.client] !== undefined && arrayProjects[vm.addVideo.client] !== null)
        {
            CamerasService
                .getCamerasListByProject(arrayProjects[vm.addVideo.client])
                .success(function(data, status) {
                    vm.camerasList = data;
                }).error(function(err, status) {
                    console.log(err);
                    console.log(status);
                });
        }
        vm.selectCameraName='0';
    }

    vm.projectsList = [];
    var arrayProjects = [];
    vm.getProjectsList = function()
    {
        var filterObj = {isbase:false};
        ProjectsService
            .getAllProjects(filterObj)
            .success(function(data, status) {
                vm.projectsList = data;
                for(var projLen =0;projLen<vm.projectsList.length;projLen++)
                {
                    arrayProjects[vm.projectsList[projLen].clientsId] = vm.projectsList[projLen]._id;
                }

                vm.getCamerasListByProject();
            }).error(function(err, status) {
                console.log(err);
                console.log(status);
            });
    }
    vm.getProjectsList();

    vm.filterByProject = function() {
        vm.camerasList = [];
        vm.getCamerasListByProject();
    }

    vm.submitted = false;
    vm.successMessage = '';

    vm.saveVideo = function() {
        console.log(vm.addVideo)
        if(vm.addVideo.client === '0')
        {
            vm.errorMessage = "Please select Project";
            return false;
        }
        if(vm.addVideo.cameraId === '0')
        {
            vm.errorMessage = "Please select Camera";
            return false;
        }

        for(var projLen=0;projLen<vm.projectsList.length;projLen++)
        {
            if(vm.addVideo.client  && vm.addVideo.client === vm.projectsList[projLen].clientsId)
            {
                vm.addVideo.project = vm.projectsList[projLen]._id;
                break;
            }
        }

        for(var camLen=0;camLen<vm.camerasList.length;camLen++)
        {
            if(vm.addVideo.cameraId  && vm.addVideo.cameraId === vm.camerasList[camLen].camerasId)
            {
                vm.addVideo.camera = vm.camerasList[camLen]._id;
                break;
            }
        }

        if(vm.addVideo.status === undefined || vm.addVideo.status === null || vm.addVideo.status === '')
        {
            vm.addVideo.status = 0;
        }

        if(vm.addVideo.datasynced === undefined || vm.addVideo.datasynced === null || vm.addVideo.datasynced === '')
        {
            vm.addVideo.datasynced = 0;
        }

        var videoId = '';
        if(vm.showIsEdit)
        {
            videoId = vm.editVideoDetails._id;
        }

        VideoService
            .updateVideoById(vm.addVideo, videoId)
            .success(function(data, status) {
                // TODO add id to user object
                vm.errorMessage = '';

                if(vm.showIsEdit) {
                    vm.successMessage = 'Video Updated SuccessFully.';
                }else
                {
                    vm.successMessage = 'Video Added SuccessFully.';
                }

                $timeout(function() {
                    $location.path('/videos');
                }, 1000);
            }).error(function(err, status) {
                if(err && err.success === false && err.error)
                {
                    vm.errorMessage = err.error;
                }
            });
    };

    vm.cancelTheForm = function()
    {
        $location.path('/videos');
    }

    vm.doAlert = function(msg, noFn) {
        var doAlertBox = $("#alertBox");
        doAlertBox.find(".message").text(msg);
        doAlertBox.find(".no").unbind().click(function () {
            doAlertBox.hide();
        });
        doAlertBox.find(".no").click(noFn);
        doAlertBox.show();
    }

    vm.getCamerasListByProject();
}
