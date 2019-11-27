'use strict';
angular
    .module('ideotics')
    .controller('VideoController', VideoController);

VideoController.$inject = ['uiGridExporterConstants', 'uiGridExporterService', '$timeout', '$uibModal', '$scope', '$rootScope', '$localStorage', '$http', '$filter', '$location', 'helpers', 'EventService', 'UserService', 'VideoService', 'ProjectsService', 'CamerasService', 'AwsService'];

function VideoController(uiGridExporterConstants, uiGridExporterService, $timeout, $uibModal, $scope, $rootScope, $localStorage, $http, $filter, $location, helpers, EventService, UserService, VideoService, ProjectsService, CamerasService, AwsService) {

    //alert(angular.version.full)
    window.dashboard = false;
    $rootScope.setHeaderglobal(5);
    $rootScope.setSortColumnAndOrder('cameraId', false);

    var vm = this;

    var paginationOptions = {
        sort: null
    };

    $scope.gridOptions = {
        columnDefs: [
            { field: 'videoId', displayName: 'Video Id', enableHiding: false },
            {
                field: 'client',
                enableHiding: false,
                displayName: 'Project',
                cellTemplate: '<div class="ui-grid-cell-contents">{{grid.appScope.videoVM.showProject(row.entity)}}</div>'
            },
            {
                field: 'cameraId',
                visible: true,
                displayName: 'Camera',
                cellTemplate: '<div class="ui-grid-cell-contents">{{grid.appScope.videoVM.showCameras(row.entity)}}</div>'
            },
            { field: 'name', visible: true, resizable: true, enableHiding: false, displayName: "FileName" },
            { field: 'url', visible: true, displayName: "URL" },
            {
                field: 'dateOfTheVideo',
                visible: true,
                enableHiding: true,
                displayName: "VideoDate",
                cellTemplate: '<div class="ui-grid-cell-contents">{{row.entity.dateOfTheVideo | date:"dd/MM/yyyy"}}</div>'
            },
            {
                field: 'assignedDate',
                visible: true,
                enableHiding: true,
                displayName: 'Assigned On',
                cellTemplate: '<div class="ui-grid-cell-contents">{{row.entity.assignedDate | date:"dd/MM/yyyy  HH:mm:ss"}}</div>'
            },
            {
                field: 'submittedDate',
                visible: true,
                displayName: "Submitted On",
                cellTemplate: '<div class="ui-grid-cell-contents">{{row.entity.submittedDate | date:"dd/MM/yyyy  HH:mm:ss"}}</div>'
            },
            {
                field: 'status',
                visible: false,
                displayName: 'Assigned Status',
                cellTemplate: '<div class="ui-grid-cell-contents">{{grid.appScope.videoVM.showStatus(row.entity)}}</div>'
            },
            { field: 'hidden', visible: false, displayName: 'Hidden' },
            { field: 'userName', visible: true, displayName: 'User Name' },
            { field: 'spentTime', visible: true, displayName: 'Time Spent' },
            { field: 'discardedTime', visible: true, displayName: 'Discarded Time Spent' },
            { field: 'netTime', visible: true, displayName: 'Net Time Spent' },
            {
                field: 'play',
                displayName: 'Play',
                enableHiding: false,
                cellTemplate: '<span class="input-group-addon" ng-click="grid.appScope.videoVM.playVideo(row.entity)"><span class="glyphicon glyphicon-play-circle" aria-hidden="true"></span></span>'
            },
            {
                name: 'Edit',
                enableHiding: true,
                enableColumnMenu: false,
                cellTemplate: '<div class="buttons" ><button class="btn btn-primary btn-padding"  ng-click="grid.appScope.videoVM.openVideoEditDetails(row.entity)"><span class="glyphicon glyphicon-edit" aria-hidden="true"></span></button></div>'
            }
        ],
        exporterSuppressColumns: ['Edit'],
        enableColumnResizing: true,
        enableHorizontalScrollbar: 1,
        enableRowSelection: false,
        enableRowHeaderSelection: true,

        enablePaging: true,
        enablePaginationControls: true,
        enablePagination: true,
        useExternalPagination: true,
        totalItems: 0,
        paginationPageSizes: [10, 25, 50, 100],
        paginationPageSize: 25,
        rowHeight: 35,
        currentPage: 1,
        showFooter: true,

        enableGridMenu: true,
        enableSelectAll: true,
        exporterMenuPdf: false, // ADD THIS
        exporterCsvFilename: 'videos.csv',
        exporterMenuCsv: false,
        exporterMenuAllData: false,
        exporterMenuVisibleData: false,
        exporterCsvLinkElement: angular.element(document.querySelectorAll(".custom-csv-link-location")),
        onRegisterApi: function(gridApi) {
            $scope.gridApi = gridApi;

            gridApi.pagination.on.paginationChanged($scope, function(newPage, pageSize) {
                //if(getPage) {
                //    getPage(newPage, pageSize, paginationOptions.sort);
                //}
                vm.filterByUserPreferrence(newPage, pageSize);
            });

            gridApi.selection.on.rowSelectionChanged($scope, function(row) {
                vm.selectedvideoToSync(row.entity)
            });
        },

        gridMenuCustomItems: [{
            title: 'Export All Data As CSV',
            order: 100,
            action: function($event) {
                vm.downloadCurrentGridData();
            }
        }]
    };
    $scope.gridOptions.multiSelect = true;

    vm.isAdmin = false;
    if ($localStorage.user.role == 'admin') {
        vm.isAdmin = true;
    } else {
        $scope.gridOptions.columnDefs.splice(12, 1);
    }

    var bucket = '';
    var isAwsCredExists = false;
    vm.resetValuesOfAws = function() {
        $scope.creds = AwsService.getAwsCredentials();

        if (!isEmpty($scope.creds) && $scope.creds.access_key) {
            AWS.config.update({ accessKeyId: $scope.creds.access_key, secretAccessKey: $scope.creds.secret_key });
            AWS.config.region = $scope.creds.region;
            bucket = new AWS.S3({ params: { Bucket: $scope.creds.bucket, ACL: 'authenticated-read' } });
        }
    }

    vm.showDateTime = false;
    vm.editMsg = "Edit";
    vm.showEditDateTime = function() {
        vm.showDateTime = !vm.showDateTime;
        vm.editMsg = "Cancel";
        if (!vm.showDateTime) {
            vm.editMsg = "Edit";
        }
    }

    vm.updatable = { selectedDate: '', selectedTime: '' };
    vm.mediaPlayerApi = {};
    vm.showPlayingVideo = false;
    vm.videoLoading = false;
    vm.playingVideoId = 0;
    vm.playingSelectedVideo = '';
    vm.playVideo = function(selectedVideo) {
        vm.playingSelectedVideo = selectedVideo;
        var dTOfVideo = new Date();
        if (selectedVideo.dateOfTheVideo && selectedVideo.dateOfTheVideo != null && selectedVideo.dateOfTheVideo != undefined) {
            dTOfVideo = new Date(selectedVideo.dateOfTheVideo);
        }

        vm.updatable.selectedDate = dTOfVideo.getFullYear() + '-' + ('0' + (dTOfVideo.getMonth() + 1)).slice(-2) + '-' + ('0' + dTOfVideo.getDate()).slice(-2);
        vm.updatable.selectedTime = dTOfVideo

        vm.playingVideoId = selectedVideo.videoId;
        vm.playingVideoUrl = "";
        if (!vm.videoLoading) {
            vm.videoLoading = true;
            vm.resetValuesOfAws();
            vm.setBucketName(selectedVideo);
            vm.showPlayingVideo = true;
            let paramsObj = { Bucket: $scope.creds.bucket, Key: selectedVideo.url, Expires: 7200 };

            /*var signedUrl = bucket.getSignedUrl('getObject', paramsObj, function (err, signedUrl)
            {
                if (signedUrl)
                {
                    $timeout(function() {
                        vm.mediaPlayerApi.controls.changeSource(signedUrl, true);
                        vm.mediaPlayerApi.controls.play();
                    }, 1000);
                }
            });*/

            if (selectedVideo.videoFromAws) {
                AwsService
                    .authenticateUrl({ paramsObj: paramsObj })
                    .success(function(data, status) {
                        vm.mediaPlayerApi.controls.changeSource(data.signedUrl, true);
                        vm.mediaPlayerApi.controls.pause();
                        //showCustomProgressBar();
                    }).error(function(err, status) {
                        console.log(err);
                        console.log(status);
                    });
            } else {
                $timeout(function() {
                    vm.mediaPlayerApi.controls.changeSource(selectedVideo.url, true);
                    vm.mediaPlayerApi.controls.pause();
                }, 100);
            }
        }
    }

    vm.updateDateTimeOfVideo = function() {
        var selectedTime = vm.updatable.selectedTime;
        var startingTime = ('0' + selectedTime.getHours()).slice(-2) + ':' + ('0' + selectedTime.getMinutes()).slice(-2) + ':' + ('0' + selectedTime.getSeconds()).slice(-2);
        var updatedDateTime = vm.updatable.selectedDate + ' ' + startingTime;

        VideoService
            .updateVideoById({ dateOfTheVideo: updatedDateTime, startingTime: startingTime }, vm.playingSelectedVideo._id)
            .success(function(data, status) {
                toastr.success('Video Date, Time Updated Successfully', 'Done');
            }).error(function(err, status) {
                console.log(err);
                console.log(status);
            });
    }

    vm.updatecamvideos = function() {
        VideoService
            .getCamResult()
            .success(function(data, status) {
                var videosList = data;
                for (var len = 0; len < videosList.length; len++) {
                    videosList[len] = getUpdatedValues(videosList[len]);
                }
                console.log(videosList)

                VideoService
                    .updatecamvideos({ videos: videosList })
                    .success(function(data, status) {
                        toastr.success('Video Date, Time Updated Successfully', 'Done');
                    }).error(function(err, status) {
                        console.log(err);
                        console.log(status);
                    });
            });
    }

    function getUpdatedValues(video) {
        var startDateOfVideo = '';
        var dateOfTheVideo = '';
        var startingTime = '';
        var videoClipLen = 0;
        var containsCheck = "Ideo_";
        var metaDataObj = {};
        metaDataObj.FPS = parseInt(30);
        metaDataObj.GFPS = parseInt(30);
        metaDataObj.FK = parseInt(2);
        metaDataObj.FS = parseInt(1);
        var awsFileName = video.name;
        var filename = awsFileName.substr(0, awsFileName.lastIndexOf('.')) || awsFileName;
        var ideoIndex = awsFileName.indexOf(containsCheck) + 5;
        var YYYYIndex = ideoIndex; //nameformat.indexOf("YYYY");
        var MMIndex = ideoIndex + 4; //nameformat.indexOf("MM");
        var DDIndex = ideoIndex + 6; //nameformat.indexOf("DD");

        var HHIndex = ideoIndex + 8; //nameformat.indexOf("HH");
        var MIIndex = ideoIndex + 10; //nameformat.indexOf("MI");
        var SSIndex = ideoIndex + 12; //nameformat.indexOf("SS");

        var lenSubStr = filename.substring(SSIndex + 2, filename.lastIndexOf('_'));
        videoClipLen = lenSubStr.substring(lenSubStr.lastIndexOf('_') + 1, lenSubStr.length);

        var isToUpload = 0;
        dateOfTheVideo = '';
        startingTime = filename.substring(HHIndex, HHIndex + 2) + ':' + filename.substring(MIIndex, MIIndex + 2) + ':' + filename.substring(SSIndex, SSIndex + 1) + '0';
        if (HHIndex >= 0 && MIIndex >= 0 && SSIndex >= 0) {
            startingTime = startingTime
        }
        if (YYYYIndex >= 0 && MMIndex >= 0 && DDIndex >= 0) {
            startDateOfVideo = filename.substring(YYYYIndex, YYYYIndex + 4) + '-' + filename.substring(MMIndex, MMIndex + 2) + '-' + filename.substring(DDIndex, DDIndex + 2);
            dateOfTheVideo = filename.substring(YYYYIndex, YYYYIndex + 4) + '-' + filename.substring(MMIndex, MMIndex + 2) + '-' + filename.substring(DDIndex, DDIndex + 2);
            dateOfTheVideo = dateOfTheVideo + 'T' + startingTime;
        }
        metaDataObj.StartDate = startDateOfVideo;
        metaDataObj.StartTime = startingTime;
        var clipNumber = parseInt(awsFileName.substring(1, 3));
        metaDataObj.ClipNumber = parseInt(awsFileName.substring(1, 3));
        var convertedDate = new Date(dateOfTheVideo);
        var fps_fk = metaDataObj.FPS * metaDataObj.FK;
        var Clip_Length = parseInt(videoClipLen);
        var convertibleSeconds = (metaDataObj.GFPS * Clip_Length * (metaDataObj.FK + metaDataObj.FS)) / fps_fk;
        var calculatedSeconds = (clipNumber - 1) * convertibleSeconds;
        console.log(dateOfTheVideo)
        convertedDate.setSeconds(convertedDate.getSeconds() + calculatedSeconds);

        var startdate_yyyymmdd = convertedDate.getFullYear() + '-' + ('0' + (convertedDate.getMonth() + 1)).slice(-2) + '-' + ('0' + convertedDate.getDate()).slice(-2);
        var starttime_hhmiss = ('0' + convertedDate.getHours()).slice(-2) + ':' + ('0' + convertedDate.getMinutes()).slice(-2) + ':' + ('0' + convertedDate.getSeconds()).slice(-2);
        console.log(startdate_yyyymmdd)
        var c_start_date_time = startdate_yyyymmdd + ' ' + starttime_hhmiss;

        convertedDate.setSeconds(convertedDate.getSeconds() + convertibleSeconds);

        var enddate_yyyymmdd = convertedDate.getFullYear() + '-' + ('0' + (convertedDate.getMonth() + 1)).slice(-2) + '-' + ('0' + convertedDate.getDate()).slice(-2);
        var endtime_hhmiss = ('0' + convertedDate.getHours()).slice(-2) + ':' + ('0' + convertedDate.getMinutes()).slice(-2) + ':' + ('0' + convertedDate.getSeconds()).slice(-2);


        var c_end_date_time = enddate_yyyymmdd + ' ' + endtime_hhmiss;
        video.startingTime = starttime_hhmiss;
        video.dateOfTheVideo = c_start_date_time;
        video.endingTime = endtime_hhmiss;
        video.endDateOfTheVideo = c_end_date_time;
        return video;
    }

    var intervalRewind = '';
    $(window).keypress(function(e) {
        if (e.keyCode == 65 || e.keyCode == 97) {
            clearInterval(intervalRewind);
            if (vm.mediaPlayerApi.videoStatus()) {
                vm.mediaPlayerApi.controls.play();
            } else {
                vm.mediaPlayerApi.controls.pause();
            }
        } else if (e.keyCode == 68 || e.keyCode == 100) {
            var rewindVideo = document.getElementById('video');
            if (vm.mediaPlayerApi.videoStatus()) {
                vm.mediaPlayerApi.controls.play();
                clearInterval(intervalRewind);
                intervalRewind = setInterval(function() {

                    if (rewindVideo != null && rewindVideo != undefined) {
                        rewindVideo.playbackRate = 1.0;
                        if (rewindVideo.currentTime == 0) {
                            clearInterval(intervalRewind);
                            vm.mediaPlayerApi.controls.pause();
                        } else {
                            rewindVideo.currentTime += -.05;
                        }
                    }
                }, 50);
            } else {
                vm.mediaPlayerApi.controls.pause();
                clearInterval(intervalRewind);
            }

        }
    });


    vm.setBucketName = function(selectedVideo) {
        if (selectedVideo.bucket && selectedVideo.bucket != null && selectedVideo.bucket != undefined) {
            $scope.creds.bucket = selectedVideo.bucket
        } else if (selectedVideo.project && selectedVideo.project.bucket && selectedVideo.project.bucket != null && selectedVideo.project.bucket != undefined) {
            $scope.creds.bucket = selectedVideo.project.bucket
        }
    }

    vm.downloadCurrentGridData = function() {
        var myElement = angular.element(document.querySelectorAll(".custom-csv-link-location"));
        $scope.gridOptions.exporterCsvFilename = "videos.csv";
        $scope.gridApi.exporter.csvExport('all', 'all', myElement);

        var exportService = uiGridExporterService;
        var grid = $scope.gridApi.grid;
        var fileName = "videos.csv";

        exportService.loadAllDataIfNeeded(grid, uiGridExporterConstants.ALL, uiGridExporterConstants.VISIBLE).then(function() {
            var exportColumnHeaders = exportService.getColumnHeaders(grid, uiGridExporterConstants.VISIBLE);
            var exportData = exportService.getData(grid, uiGridExporterConstants.ALL, uiGridExporterConstants.VISIBLE);
            var csvContent = exportService.formatAsCsv(exportColumnHeaders, exportData, grid.options.exporterCsvColumnSeparator);
            exportService.downloadFile(fileName, csvContent, grid.options.exporterOlderExcelCompatibility);

            var hiddenElement = document.createElement('a');

            hiddenElement.href = 'data:attachment/csv,' + encodeURI(csvContent);
            hiddenElement.target = '_blank';
            hiddenElement.download = 'videos.csv';
            hiddenElement.click();
        });
    }

    /*$scope.$on('csvResults', function (evt, csvRowsResuls) {
     $rootScope.loadingAndBlockUI('Saving In Progress...');
     VideoService.saveVideosFromCSV(csvRowsResuls).success(function(data, status) {
     console.log(data)
     vm.getAllVideos();
     }).error(function(err, status) {
     console.log(err);
     console.log(status);
     });
     });*/

    /*$scope.$on('csvResults', function (evt, csvRowsResuls) {
     $rootScope.loadingAndBlockUI('Saving In Progress...');
     VideoService.saveVideosFromCSVWithForm(csvRowsResuls,vm.filledFormData).success(function(data, status) {
     vm.filterByUserPreferrence();
     }).error(function(err, status) {
     console.log(status);
     });
     });*/

    $scope.$on('csvResults', function(evt, csvRowsResuls) {
        $rootScope.loadingAndBlockUI('Saving Event To Video In Progress...');
        EventService.saveEventssFromCSVWithForm(csvRowsResuls, vm.videoEventUploadId, vm.assignVideosList[0]).success(function(data, status) {
            toastr.success('Events Uploaded Successfully', 'Done');
            $rootScope.stopLoadingBlockUI();
        }).error(function(err, status) {
            toastr.success('Events Uploaded Failed', 'error');
            $rootScope.stopLoadingBlockUI();
        });
    });

    var fileObjs = [];
    $scope.loadData = function(objFile) {
        //setTimeout(function() {
        var video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = function() {
            window.URL.revokeObjectURL(this.src)
            var duration = video.duration;
            var obj = new Object();
            obj.name = objFile.name;
            obj.lengthOfVideo = Math.floor(duration);

            var str = objFile.name;
            var res = str.substring(14, 16) + ':' + str.substring(16, 18) + ':' + str.substring(18, 20);
            obj.startTime = res;
            fileObjs.push(obj)
        }
        video.src = URL.createObjectURL(objFile);
        //}, 100);
    }

    $scope.onFilesSelected = function(files) {
        for (var filesLen = 0; filesLen < files.length; filesLen++) {
            $scope.loadData(files[filesLen]);
        }

        $rootScope.loadingAndBlockUI('Saving In Progress...');
        $timeout(function() {
            VideoService.saveVideosFromCSVWithForm(fileObjs, vm.filledFormData).success(function(data, status) {
                fileObjs = [];
                vm.filterByUserPreferrence();
            }).error(function(err, status) {
                console.log(status);
            });
        }, 1500);
    };

    vm.videos = [];
    vm.videosCopy = [];

    vm.usersList = [];
    vm.usersListCopy = [];

    vm.userObjList = {};

    vm.selectedVideo = '';

    vm.resluts = '';

    UserService
        .getUsers()
        .success(function(data, status) {
            vm.usersList = data;
            vm.usersListCopy = angular.copy(vm.usersList);

            for (var userLen = 0; userLen < vm.usersListCopy.length; userLen++) {
                var key = vm.usersListCopy[userLen].userId;
                vm.userObjList['key' + key] = vm.usersListCopy[userLen].firstName;
            }

        }).error(function(err, status) {
            console.log(err);
            console.log(status);
        });

    vm.assignStatusType = [
        { value: 0, text: 'Not Processed' },
        { value: 1, text: 'Under Processing' },
        { value: 2, text: 'Processed' }
    ];

    vm.role = [
        { value: 'agent', text: 'Agent' },
        { value: 'admin', text: 'Admin' }
    ];

    /*vm.active = [
     {value: 1, text: 'Active'},
     {value: 2, text: 'Inactive'}
     ];*/

    vm.active = [
        { value: 0, text: 'Not Processed' },
        { value: 1, text: 'Under Processing' },
        { value: 2, text: 'Processed' }
    ];

    vm.groups = [];
    vm.loadGroups = function() {
        return vm.groups.length ? null : $http.get('/groups').success(function(data) {
            vm.groups = data;
        });
    };

    vm.showRole = function(user) {
        var selected = [];
        if (user.role) {
            selected = $filter('filter')(vm.role, { value: user.role });
        }
        return selected.length ? selected[0].text : 'Not set';
    };

    vm.showStatus = function(user) {
        var selected = [];
        if (user.status) {
            selected = $filter('filter')(vm.active, { value: user.status });
        }
        return selected.length ? selected[0].text : vm.active[0].text;
    };

    vm.sync = [
        { value: 0, text: 'Not Synced' },
        { value: 1, text: 'Synced' }
    ];

    vm.showSynced = function(user) {
        var selected = [];
        if (user.datasynced) {
            selected = $filter('filter')(vm.sync, { value: user.datasynced });
        }
        return selected.length ? selected[0].text : 'Not Synced';
    };

    vm.showProject = function(video) {
        var selected = [];
        if (video.client)
            selected = $filter('filter')(vm.projects, { clientsId: video.client });
        return selected.length ? selected[0].clientcode : 'Not set';
    };

    vm.showCameras = function(video) {
        var selected = [];
        if (video.cameraId)
            selected = $filter('filter')(vm.originalCamerasList, { camerasId: video.cameraId });
        return selected.length ? selected[0].cameracode : 'Not set';
    };

    vm.statuses = [
        { value: 1, text: 'status1' },
        { value: 2, text: 'status2' },
        { value: 3, text: 'status3' },
        { value: 4, text: 'status4' }
    ];

    vm.test = {
        dob: new Date(1984, 4, 15)
    };

    vm.checkName = function(data, id) {
        if (id === 2 && data !== 'awesome') {
            return "Username 2 should be `awesome`";
        }
    };

    vm.saveVideo = function(data, id) {
        for (var projLen = 0; projLen < vm.projects.length; projLen++) {
            if (data.client && data.client === vm.projects[projLen].clientsId) {
                data.project = vm.projects[projLen]._id;
                break;
            }
        }

        if (data.status === undefined || data.status === null || data.status === '') {
            data.status = 0;
        }

        VideoService
            .updateVideoById(data, id)
            .success(function(data, status) {
                vm.getAllVideos();
                vm.videos.push(data);
            }).error(function(err, status) {
                console.log(err);
                console.log(status);
            });
    };

    // remove user
    /*vm.removeVideo = function(index) {
     var id = vm.videos[index].id;
     if (!id) return false;
     UserService.removeUser(id)
     .success(function () {
     vm.videos.splice(index, 1);
     })
     .error(function () {
     // TODO
     });
     };*/

    vm.removeVideo = function(index) {
        var id = vm.videos[index]._id;
        if (!id) {
            vm.videos.splice(index, 1);
            return false;
        }
        swal({
                title: "Are you sure?",
                text: "Would you like to delete the video. Do you want to continue?",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "Yes, delete it!",
                closeOnConfirm: true
            },
            function() {
                var videoData = { _id: vm.videos[index].videoId };

                vm.videos.splice(index, 1);

                VideoService.removeVideoById(videoData)
                    .success(function(data, status) {
                        //swal("Deleted!", "Your imaginary videos has been deleted.", "success");
                        toastr.success("Your imaginary videos has been deleted.", 'Done');
                        vm.getAllVideos();
                    }).error(function(err, status) {
                        console.log(err);
                        console.log(status);
                    });
            });
    };

    // add video
    vm.addVideo = function() {
        VideoService.clearSelectedVideo();
        $location.path('/addOrEditVideo');
    };

    vm.openVideoEditDetails = function(video) {
        VideoService.setSelectedVideo(video);
        $location.path('/addOrEditVideo');
    }

    vm.buttonText = 'Sync Mysql Data';
    vm.showVideosList = true;

    vm.changeVideosList = function() {
        vm.buttonText = 'Sync Mysql Data';
        vm.showVideosList = !vm.showVideosList;

        if (!vm.showVideosList) {
            vm.loadVideosToSyncData();
            vm.buttonText = 'Show videos List';
        }
    }

    vm.listOfVideostoSync = [];

    vm.loadVideosToSyncData = function() {
        vm.videoLstbgclrIndex = '';
        VideoService
            .getListOfVideosToSync()
            .success(function(data, status) {
                vm.listOfVideostoSync = data;
            }).error(function(err, status) {
                console.log(err);
                console.log(status);
            });
    }

    vm.videoLstbgclrIndex = '';

    vm.selectedUserFromList = '';
    vm.selecteduserToAssign = function(index) {
        for (var len = 0; len < vm.assignToUserList.length; len++) {
            vm.assignToUserList[len].color = '';
        }
        vm.assignToUserList[index].color = 'lightblue';

        vm.selectedUserFromList = index;
    }

    vm.selectedVideFromList = '';
    vm.selectedvideoToSync = function(video) {
        for (var len = 0; len < vm.videos.length; len++) {
            vm.videos[len].color = '';
        }
        video.color = 'lightblue';
        video.checked = !video.checked;

        vm.selectedVideFromList = video;

        vm.selectedVideo = video;

    }

    vm.updateSelection = function(video) {
        video.checked = !video.checked;
    };

    vm.showUsersList = function(msg, yesFn, noFn) {
        vm.selectedUserFromList = '';
        var usersListBox = $("#usersListBox");
        usersListBox.find(".message").text(msg);
        usersListBox.find(".yes,.no").unbind().click(function() {
            usersListBox.hide();
        });
        usersListBox.find(".yes").click(yesFn);
        usersListBox.find(".no").click(noFn);
        usersListBox.show();
    }

    vm.syncMysqlDataByVideoId = function() {
        getListOfVideoIds();

        if (vm.videoIdsList.length > 0) {
            if (vm.isPreviouslyDataSynced) {
                swal({
                        title: "Are you sure?",
                        text: "The following video is already synced. Do you want to continue?",
                        type: "warning",
                        showCancelButton: true,
                        confirmButtonColor: "#DD6B55",
                        confirmButtonText: "Yes, Sync it!",
                        closeOnConfirm: true
                    },
                    function() {
                        vm.syncVideoData(1);
                    });
            } else {
                vm.syncVideoData(1);
            }
        } else if (vm.selectedVideFromList !== '') {
            if (vm.selectedVideFromList.datasynced === 1) {
                swal({
                        title: "Are you sure?",
                        text: "The following video is already synced. Do you want to continue?",
                        type: "warning",
                        showCancelButton: true,
                        confirmButtonColor: "#DD6B55",
                        confirmButtonText: "Yes, Sync it!",
                        closeOnConfirm: true
                    },
                    function() {
                        vm.syncVideoData(1);
                    });
            } else {
                vm.syncVideoData(1);
            }
        } else {
            showNotificationMessage("Please select video to sync", errorType.error)
        }
    }

    vm.showAlertMessageExtension = function(text) {
        showNotificationMessage(text, errorType.error)
    }

    vm.unlockAndResetVideoById = function() {
        getListOfVideoIds();

        if (vm.videoIdsList.length > 0) {
            if (vm.isPreviouslyDataSynced) {
                swal({
                        title: "Are you sure?",
                        text: "The following video is already assigned.Do you want to continue?",
                        type: "warning",
                        showCancelButton: true,
                        confirmButtonColor: "#DD6B55",
                        confirmButtonText: "Yes, Assign it!",
                        closeOnConfirm: false
                    },
                    function() {
                        swal("Assigned!", "Your imaginary videos has assigned.", "success");
                        vm.syncVideoData(0);
                    });
            } else {
                vm.syncVideoData(0);
            }
        } else if (vm.selectedVideFromList !== '') {
            if (vm.selectedVideFromList.datasynced === 1) {
                swal({
                        title: "Are you sure?",
                        text: "The following video is already assigned.Do you want to continue?",
                        type: "warning",
                        showCancelButton: true,
                        confirmButtonColor: "#DD6B55",
                        confirmButtonText: "Yes, Assign it!",
                        closeOnConfirm: false
                    },
                    function() {
                        swal("Assigned!", "Your imaginary videos has been assigned.", "success");
                        vm.syncVideoData(0);
                    });
            } else {
                vm.syncVideoData(0);
            }
        } else {
            showNotificationMessage("Please select video to unlock", errorType.error)
        }
    }

    vm.assignVideosList = [];
    vm.assignUserToVideo = function() {
        vm.assignVideosList = [];
        getListOfVideoIds();

        if (vm.assignVideosList.length > 1) {
            showNotificationMessage("Please select Only one Video to Assign user.", errorType.error)
        } else if (vm.assignVideosList.length == 1 && vm.selectedVideFromList !== '') {
            if (vm.assignVideosList[0].status == 2) {
                showNotificationMessage("Please select Video Which has not submitted.", errorType.error)
            } else {
                vm.usersList = [];
                vm.usersList = angular.copy(vm.usersListCopy);

                for (var len = 0; len < vm.videos.length; len++) {
                    var userId = Number(vm.videos[len].userId);
                    var statusVid = Number(vm.videos[len].status);
                    if (userId !== 0 || statusVid === 2) {
                        for (var usersLen = 0; usersLen < vm.usersList.length; usersLen++) {
                            var selectUser = Number(vm.usersList[usersLen].userId);
                            if (userId === selectUser) {
                                vm.usersList.splice(usersLen, 1);
                            } else if (vm.usersList[usersLen].role === 'client' || vm.usersList[usersLen].role === 'reviewer') {
                                vm.usersList.splice(usersLen, 1);
                            }
                        }
                    }
                }

                if (vm.selectedVideFromList.userId !== '0' && vm.selectedVideFromList.userId !== 0) {
                    swal({
                            title: "Are you sure?",
                            text: "The following video is already assigned to the user.Do you want to re assign the user?",
                            type: "warning",
                            showCancelButton: true,
                            confirmButtonColor: "#DD6B55",
                            confirmButtonText: "Yes, Assign it!",
                            closeOnConfirm: false
                        },
                        function() {
                            swal("Assigned!", "Your imaginary videos has been assigned.", "success");
                            vm.showUsersListToAssign();
                        });
                } else {
                    vm.showUsersListToAssign();
                }
            }

        } else {
            showNotificationMessage("Please select video to Assign user.", errorType.error)
        }
    }

    vm.deleteSelectedVideo = function() {
        if (vm.selectedVideFromList !== '') {
            swal({
                    title: "Are you sure?",
                    text: "Would you like to delete the video. Do you want to continue?",
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#DD6B55",
                    confirmButtonText: "Yes, delete it!",
                    closeOnConfirm: false
                },
                function() {
                    var videoData = { _id: vm.selectedVideFromList.videoId };
                    VideoService.removeVideoById(videoData)
                        .success(function(data, status) {
                            //vm.videos.splice(vm.selectedVideFromList,1);
                            //swal("Deleted!", "Your imaginary videos has been deleted.", "success");
                            toastr.success("Your imaginary videos has been deleted.", 'Done');
                            vm.getAllVideos();
                        }).error(function(err, status) {
                            console.log(err);
                            console.log(status);
                        });
                });
        } else {
            showNotificationMessage("Please select video to Delete.", errorType.error)
        }
    }

    vm.deleteSelectedVideoSListByCheckBox = function() {
        getListOfVideoIds();

        if (vm.videoIdsList.length > 0) {
            swal({
                    title: "Are you sure?",
                    text: "Would you like to delete the video. Do you want to continue?",
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#DD6B55",
                    confirmButtonText: "Yes, delete it!",
                    closeOnConfirm: true
                },
                function() {
                    VideoService.removeVideoById(vm.videosMysqlIds)
                        .success(function(data, status) {
                            //vm.videos.splice(vm.selectedVideFromList,1);
                            toastr.success("Deleted!", "Your imaginary videos has been deleted.", "success");
                            vm.getAllVideos();
                        }).error(function(err, status) {
                            console.log(err);
                            console.log(status);
                        });
                });
        } else {
            vm.deleteSelectedVideo();
        }
    }

    vm.showUsersListFlag = true;
    vm.assignToUserList = [];
    vm.showUsersListToAssign = function() {
        vm.showUsersListFlag = false;

        if (vm.usersList.length > 0) {
            vm.showUsersListFlag = true;
        }
        vm.assignToUserList = [];
        UserService
            .getUnassignedUsersList()
            .success(function(data, status) {
                vm.assignToUserList = data;
                vm.showUsersList("test", function yes() {
                    if (vm.selectedUserFromList === '') {
                        showNotificationMessage("Please select a User to Assign.", errorType.error)
                    } else {
                        var dataToUpdate = { videoId: vm.selectedVideFromList.videoId, userId: vm.assignToUserList[vm.selectedUserFromList].userId, status: 1 };
                        VideoService.updateVideoByUsingVideoId(dataToUpdate)
                            .success(function(data, status) {
                                vm.getAllVideos();
                            }).error(function(err, status) {});
                    }
                }, function no() {
                    vm.selectedUserFromList = '';
                });

            }).error(function(err, status) {});

    }


    vm.syncVideoData = function(resetUserAndStatus) {
        getListOfVideoIds();
        $rootScope.loadingAndBlockUI('Mysql Sync In Progress...');

        if (vm.videoIdsList.length > 0) {
            VideoService
                .syncMysqlToMongoAndUpdate(vm.videosMysqlIds, resetUserAndStatus)
                .success(function(data, status) {
                    vm.getAllVideos();
                }).error(function(err, status) {
                    console.log(err);
                    console.log(status);
                });
        } else {
            VideoService
                .syncMysqlToMongoAndUpdate(vm.selectedVideFromList.videoId, resetUserAndStatus)
                .success(function(data, status) {
                    vm.getAllVideos();
                }).error(function(err, status) {
                    console.log(err);
                    console.log(status);
                });
        }

    }

    vm.assignVideosList = [];

    function getListOfVideoIds() {
        vm.videoIdsList = [];
        vm.videosMysqlIds = [];
        vm.assignVideosList = [];
        vm.isPreviouslyDataSynced = false;
        /*for(var len=0;len<vm.videos.length;len++)
        {
            if(vm.videos[len] && vm.videos[len].checked)
            {
                vm.videoIdsList.push(vm.videos[len]._id);
                vm.videosMysqlIds.push(vm.videos[len].videoId);
                vm.assignVideosList.push(vm.videos[len]);
            }

            if(vm.videos[len].datasynced === 1)
            {
                vm.isPreviouslyDataSynced = true;
            }
        }*/
        for (var len = 0; len < $scope.gridApi.selection.getSelectedRows().length; len++) {
            var selectedGridVideo = $scope.gridApi.selection.getSelectedRows()[len];
            //vm.userIdsList.push($scope.gridApi.selection.getSelectedRows()[len].userId);
            //vm.selectedUsersList.push($scope.gridApi.selection.getSelectedRows()[len]);
            vm.videoIdsList.push(selectedGridVideo._id);
            vm.videosMysqlIds.push(selectedGridVideo.videoId);
            vm.assignVideosList.push(selectedGridVideo);
        }
    }

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

                var dummyVal = { clientsId: 0, clientname: 'Project Name' };
                vm.projects.splice(0, 0, dummyVal);
            }).error(function(err, status) {
                console.log(err);
                console.log(status);
            });
    }

    var dummyVal = { camerasId: 0, cameracode: 'Camera Name' };
    vm.cameras = [];
    vm.cameras.push(dummyVal);
    vm.getCamerasListByProject = function() {
        if (arrayProjects[vm.selectProjectName] !== undefined && arrayProjects[vm.selectProjectName] !== null) {
            CamerasService
                .getCamerasListByProject(arrayProjects[vm.selectProjectName])
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

    vm.selectVideoAssignType = '0';

    vm.filterByAssignType = function() {
        vm.selectedVideFromList = '';
        vm.videos = [];

        vm.selectedValue = Number(vm.selectVideoAssignType);
        if (vm.selectedValue !== 4) {
            for (var len = 0; len < vm.videosCopy.length; len++) {
                vm.presentVideo = Number(vm.videosCopy[len].status);
                if (vm.presentVideo === vm.selectedValue) {
                    vm.videos.push(vm.videosCopy[len]);
                }
            }
        } else {
            vm.videos = angular.copy(vm.videosCopy);
        }
    }

    vm.originalCamerasList = [];
    vm.getCamerasList = function() {
        CamerasService
            .getAllCameras()
            .success(function(data, status) {
                vm.camerasList = data;
                var dummyVal = { camerasId: 0, cameracode: 'Camera Name' };
                vm.camerasList.splice(0, 0, dummyVal);
                vm.originalCamerasList = angular.copy(vm.camerasList);
                ProjectsService.setCamerasList(angular.copy(vm.camerasList));
            }).error(function(err, status) {
                console.log(err);
                console.log(status);
            });
    }

    vm.selectCameraName = '0';
    vm.filterByCamera = function() {
        vm.selectedVideFromList = '';
        vm.videos = [];
        //vm.videos = angular.copy(vm.videosCopy);

        vm.selectedValue = Number(vm.selectCameraName);
        if (vm.selectedValue !== 0) {
            for (var len = 0; len < vm.videosCopy.length; len++) {
                vm.presentCamId = Number(vm.videosCopy[len].cameraId);
                if (vm.presentCamId === vm.selectedValue) {
                    vm.videos.push(vm.videosCopy[len]);
                }
            }
        } else {
            vm.videos = angular.copy(vm.videosCopy);
        }
    }

    vm.filterByUserPreferrence = function() {
        VideoService
            .getAllSubmittedVideosByUserAndDate(vm.selectProjectName, vm.selectCameraName, '', '', vm.selectVideoAssignType, vm.selectHiddenType, $scope.gridApi.pagination.getPage(), $scope.gridOptions.paginationPageSize)
            .success(function(data, status) {
                $rootScope.stopLoadingBlockUI();

                if (!vm.pageChangFlag) {
                    vm.totalItems = data.recordsCount;
                    $scope.gridOptions.totalItems = vm.totalItems;
                }

                vm.videos = data.resultSet;

                vm.selectedVideo = '';
                for (var len = 0; len < vm.videos.length; len++) {
                    var userListId = vm.videos[len].userId;
                    vm.videos[len].color = '';
                    vm.videos[len].checked = false;
                    vm.videos[len].userName = vm.userObjList['key' + userListId]
                }

                $scope.gridOptions.data = angular.copy(vm.videos);
                vm.videosCopy = angular.copy(vm.videos);
            }).error(function(err, status) {});
        //}
    }

    vm.getAllVideos = function() {
        vm.filterByUserPreferrence();
    };

    vm.selectProjectName = '0';

    vm.hiddenType = [
        { value: 2, text: 'Hidden Type' },
        { value: 0, text: 'Hidden' },
        { value: 1, text: 'UnHidden' }
    ];

    vm.selectHiddenType = '2';
    vm.filterByHiddenType = function() {
        vm.selectedVideFromList = '';
        vm.videos = [];

        vm.selectedValue = Number(vm.selectHiddenType);
        if (vm.selectedValue !== 2) {
            for (var len = 0; len < vm.videosCopy.length; len++) {
                if (vm.selectedValue === 0 && vm.videosCopy[len].hidden) {
                    vm.videos.push(vm.videosCopy[len]);
                } else if (vm.selectedValue === 1 && !(vm.videosCopy[len].hidden)) {
                    vm.videos.push(vm.videosCopy[len]);
                }
            }
        } else {
            vm.videos = angular.copy(vm.videosCopy);
        }
    }

    vm.hideSelectedVideoSListByCheckBox = function(hiddenFlag) {
        getListOfVideoIds();

        if (vm.videoIdsList.length > 0) {
            var confirmMessage = "Would you like to hide the videos. Do you want to continue?";
            if (!hiddenFlag) {
                confirmMessage = "Would you like to unhide the videos. Do you want to continue?";
            }
            swal({
                    title: "Are you sure?",
                    text: confirmMessage,
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#DD6B55",
                    confirmButtonText: "Yes, Hide/UnHide it!",
                    closeOnConfirm: true
                },
                function() {
                    VideoService.hideVideosByVideoIds(hiddenFlag, vm.videosMysqlIds)
                        .success(function(data, status) {
                            //swal("Hide/UnHide!", "Your imaginary videos has been Hidden/UnHidden.", "success");
                            toastr.success("Hide/UnHide!", "Your imaginary videos has been Hidden/UnHidden.", "success");
                            vm.getAllVideos();
                        }).error(function(err, status) {
                            console.log(status);
                        });
                });
        } else {
            var alertMessage = "Please select video to Hide.";
            if (!hiddenFlag) {
                alertMessage = "Please select video to UnHide.";
            }
            showNotificationMessage(alertMessage, errorType.error)
        }
    }

    vm.setHasEventsExistsInMysqlVideosByCheckBox = function(hasMysqlEvents) {
        getListOfVideoIds();

        if (vm.videoIdsList.length > 0) {
            var confirmMessage = "Would you like to set video has events in mysql. Do you want to continue?";
            if (!hasMysqlEvents) {
                confirmMessage = "Would you like to set video has events in mysql. Do you want to continue?";
            }
            swal({
                    title: "Are you sure?",
                    text: confirmMessage,
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#DD6B55",
                    confirmButtonText: "Yes, delete it!",
                    closeOnConfirm: false
                },
                function() {
                    VideoService.setHasEventsVideosByVideoIds(hasMysqlEvents, vm.videosMysqlIds)
                        .success(function(data, status) {
                            vm.getAllVideos();
                        }).error(function(err, status) {
                            console.log(status);
                        });
                });
        } else {
            var alertMessage = "Please select video to set it has events.";
            if (!hasMysqlEvents) {
                alertMessage = "Please select video to set doesn't has events.";
            }
            showNotificationMessage(alertMessage, errorType.error)
        }
    }

    vm.unAssignVideosFromUsers = function() {
        getListOfVideoIds();

        if (vm.videoIdsList.length > 0) {
            var confirmMessage = "Would you like to Cancel Processing the selected videos. Do you want to continue?";
            swal({
                    title: "Are you sure?",
                    text: confirmMessage,
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#DD6B55",
                    confirmButtonText: "Yes, Cancel Processing it!",
                    closeOnConfirm: true
                },
                function() {
                    VideoService.unAssignVideosFromUsers(vm.videosMysqlIds)
                        .success(function(data, status) {
                            swal("Cancelled Processing!", "Your imaginary videos has been Cancelled Processing.", "success");
                            toastr.success("Cancelled Processing!", "Your imaginary videos has been Cancelled Processing.", "success");
                            vm.getAllVideos();
                        }).error(function(err, status) {
                            console.log(status);
                        });
                });
        } else {
            var alertMessage = "Please select video to Cancel Processing.";
            showNotificationMessage(alertMessage, errorType.error)
        }
    }

    vm.showHeatMapForSelectedVideo = function() {
        getListOfVideoIds();
        var alertMessage = "Please select a video to show heat map.";
        var camImageUrl = "https://images-na.ssl-images-amazon.com/images/I/51M0E6J290L._SL1000_.jpg";
        if (vm.assignVideosList.length > 0) {
            var cams = [];
            var isSubmitted = true;
            for (var len = 0; len < vm.assignVideosList.length; len++) {
                if (vm.assignVideosList[len].status != '2') {
                    isSubmitted = false;
                    break;
                }
                var cameraId = vm.assignVideosList[len].cameraId;
                if (cams.indexOf(cameraId) == -1) {
                    cams.push(cameraId);
                    for (var camsLen = 0; camsLen < vm.originalCamerasList.length; camsLen++) {
                        if (vm.originalCamerasList[camsLen].camerasId == cameraId) {
                            camImageUrl = vm.originalCamerasList[camsLen].camImageUrl;
                        }
                    }
                }
            }

            if (!isSubmitted) {
                alertMessage = "Please select a processed video to show heat map.";
                showNotificationMessage(alertMessage, errorType.error)
            } else if (cams.length > 1) {
                alertMessage = "Please select a videos of same camera to show heat map.";
                showNotificationMessage(alertMessage, errorType.error)
            } else {
                EventService.setHeatMapFilterObj({ filterObj: { videoId: vm.videosMysqlIds }, cameraImgObj: { camImageUrl: camImageUrl } });
                $location.path('/heatmap');
            }
        } else {
            showNotificationMessage(alertMessage, errorType.error)
        }
    }


    $("#checkAll").change(function() {
        $("input:checkbox").prop('checked', $(this).prop("checked"));

        for (var len = 0; len < vm.videos.length; len++) {
            vm.videos[len].checked = $(this).prop("checked");
        }
    });

    vm.exportData = function() {
        getListOfVideoIds();

        var alertMessage = "Please select a video to download report.";
        var project = '';
        if (vm.assignVideosList.length > 0) {
            project = vm.assignVideosList[0].project._id;
            var cams = [];
            var isSubmitted = true;
            for (var len = 0; len < vm.assignVideosList.length; len++) {
                if (vm.assignVideosList[len].status != '2') {
                    isSubmitted = false;
                    break;
                }
                var cameraId = vm.assignVideosList[len].cameraId;
                if (cams.indexOf(cameraId) == -1) {
                    cams.push(cameraId);
                }
            }

            if (!isSubmitted) {
                alertMessage = "Please select a processed video to download report.";
                showNotificationMessage(alertMessage, errorType.error);
            } else if (cams.length > 1) {
                alertMessage = "Please select a videos of same camera to download report.";
                showNotificationMessage(alertMessage, errorType.error);
            } else {
                if (vm.videosMysqlIds.length > 0) {

                    var selectedCamObj = vm.assignVideosList[0];
                    vm.fetchResultObject = {
                        videoId: vm.videosMysqlIds,
                        project: project,
                        cameraId: selectedCamObj.cameraId,
                        camera: selectedCamObj.camera._id,
                        cameracode: selectedCamObj.camera.cameracode,
                        clientsId: selectedCamObj.project.clientsId,
                        clientname: selectedCamObj.project.clientname
                    };

                    var zipFileName = selectedCamObj.project.clientname + '_' + selectedCamObj.camera.cameracode;

                    for (var vidLen = 0; vidLen < vm.videosMysqlIds.length; vidLen++) {
                        zipFileName = zipFileName + '_' + vm.videosMysqlIds[vidLen];
                    }

                    $http.post("/api/video/getSubmittedEventToCSVExport", vm.fetchResultObject, { responseType: 'arraybuffer' })
                        .then(function(response) {
                            var a = document.createElement('a');
                            var blob = new Blob([response.data], { 'type': "application/octet-stream" });
                            a.href = URL.createObjectURL(blob);
                            a.download = zipFileName + ".zip";
                            a.click();
                        });
                }
            }
        } else {
            showNotificationMessage(alertMessage, errorType.error);
        }
    };


    vm.animationsEnabled = true;

    $rootScope.loadVideoUploadModel = function() {
        vm.open();
    }

    vm.open = function(size) {
        var modalInstance = $uibModal.open({
            animation: vm.animationsEnabled,
            templateUrl: 'myModalContent.html',
            controller: 'ModalInstanceCtrl',
            size: size,
            resolve: {
                projects: function() {
                    return vm.projOriginalList;
                },
                cameras: function() {
                    return vm.originalCamerasList;
                },
                filledFormDetails: function() {
                    return ProjectsService.getUploadFormDetails();
                }
            }
        });

        modalInstance.result.then(function(videoFormDetails) {
            vm.filledFormData = videoFormDetails;
            for (var len = 0; len < vm.projOriginalList.length; len++) {
                if (vm.projOriginalList[len]._id == vm.filledFormData.project) {
                    ProjectsService.setVideoSelectedProject(vm.projOriginalList[len]);
                    break;
                }
            }

            $timeout(function() {
                //$('#uploadVideoCsv').trigger('click');
                //$('#importVideoFiles').trigger('click');

                ProjectsService.setUploadFormDetails(vm.filledFormData);
                $('#uploadVideoFiles').modal('show', {
                    backdrop: true,
                    keyboard: false
                });
            }, 100);
            $timeout(function() {
                $rootScope.$emit("CallUploaderMethod", {});
            }, 300);

        }, function() {});
    };

    vm.videoEventUploadId = '';
    vm.uploadFramestoSelectedVideo = function() {
        getListOfVideoIds();

        if (vm.videoIdsList.length == 1) {
            var confirmMessage = "Do you want to continue with uploading events to selected video?";

            swal({
                    title: "Are you sure?",
                    text: confirmMessage,
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "green",
                    confirmButtonText: "Yes, Upload it!",
                    closeOnConfirm: true
                },
                function() {
                    vm.videoEventUploadId = vm.assignVideosList[0].videoId;
                    $("#importVideoEvents").click();
                });

        } else {
            var alertMessage = "Please select video to upload events to video.";
            showNotificationMessage(alertMessage, errorType.error)
        }
    }

    vm.resetFilterForm = function() {
        vm.videoLoading = false;
        vm.showPlayingVideo = false;

        vm.selectProjectName = '0';
        vm.selectCameraName = '0';
        vm.selectVideoAssignType = '0';
        vm.selectHiddenType = '2';

        vm.pageChangFlag = false;
        vm.totalItems = 0;
        vm.currentPage = 1;

        vm.filterByUserPreferrence()
    }

    vm.filledFormData = '';
    vm.totalItems = 0;
    vm.currentPage = 1;

    vm.pageChangFlag = false;
    vm.pageChanged = function() {
        vm.pageChangFlag = true;
        $("input:checkbox").prop('checked', false);
        vm.filterByUserPreferrence()
    }

    $rootScope.reloadVideosData = function() {
        vm.getResultByFilter();
    }

    vm.getResultByFilter = function() {
        vm.pageChangFlag = false;
        $("input:checkbox").prop('checked', false);
        vm.totalItems = 0;
        vm.currentPage = 1;
        vm.filterByUserPreferrence();
    }

    vm.filterByProject = function() {
        vm.cameras = [];
        vm.cameras.splice(0, 0, dummyVal);

        vm.getCamerasListByProject();
        vm.getResultByFilter();
    }
}

angular.module('ideotics').controller('ModalInstanceCtrl', function($scope, $uibModalInstance, projects, cameras, filledFormDetails) {

    $scope.selectedProject = '';

    var dummyProjVal = { _id: 0, clientname: 'Project Name' };
    $scope.projects = [];
    $scope.projects = angular.copy(projects);
    $scope.projects.splice(0, 0, dummyProjVal);


    var dummyCamVal = { _id: 0, cameracode: 'Camera Name' };
    $scope.cameras = [];
    $scope.originalCamsList = angular.copy(cameras);
    $scope.cameras.splice(0, 0, dummyCamVal);

    $scope.srcBucketList = [{ name: "Source of the clips", value: "0" }, { name: "Malysia", value: "ideotics-uploader-pro-data" }, { name: "India", value: "ideotics-ideoload-in" }];

    $scope.destBucketList = [{ name: "Destination of the clips", value: "0" }, { name: "Malysia", value: "ideotics-ideocap" }, { name: "India", value: "ideotics-ideocap-in" }];

    $scope.details = {};
    var date = new Date();

    function getMonth(month) {
        if (month < 10)
            month = '0' + month;
        return month;
    }
    $scope.details.selectedDate = date.getFullYear() + '-' + (getMonth(date.getMonth() + 1)) + '-' + date.getDate();

    var dateStr = $scope.details.selectedDate;
    dateStr = dateStr.replace(/-/g, '');

    $scope.details.project = '0';
    $scope.details.camera = '0';
    $scope.details.url = '';
    $scope.details.nameFormat = 'YYYYMMDDHHMISS';
    $scope.details.getFromAws = true;
    $scope.details.srcbucket = $scope.srcBucketList[0].value;
    $scope.details.destBucket = $scope.destBucketList[0].value;

    var destFolder = '';

    $scope.$watch("details.selectedDate", function(newValue, oldValue) {
        dateStr = newValue.replace(/-/g, '');

        if (destFolder && destFolder != undefined && destFolder != null && destFolder != '' && destFolder.length > 0) {
            $scope.details.url = destFolder + dateStr + '/';
        }
    });

    $scope.filterByProject = function() {
        $scope.cameras = [];
        $scope.details.camera = '0';
        $scope.details.url = '';

        if ($scope.details.project !== '0') {
            for (var len = 0; len < $scope.originalCamsList.length; len++) {
                if ($scope.originalCamsList[len].project === $scope.details.project) {
                    $scope.cameras.push($scope.originalCamsList[len]);
                }
            }

            for (var projLen = 0; projLen < $scope.projects.length; projLen++) {
                if ($scope.projects[projLen]._id === $scope.details.project) {
                    $scope.details.clientId = $scope.projects[projLen].clientsId;
                    destFolder = $scope.projects[projLen].destFolder;
                    $scope.details.url = destFolder + dateStr + '/';
                    $scope.selectedProject = $scope.projects[projLen];
                    break;
                }
            }
        }
        $scope.cameras.splice(0, 0, dummyCamVal);
    }

    if (filledFormDetails != null && filledFormDetails != undefined && filledFormDetails !== '' && !isEmpty(filledFormDetails)) {
        $scope.details.project = filledFormDetails.project;
        $scope.details.clientId = filledFormDetails.clientId;

        $scope.details.srcbucket = filledFormDetails.srcbucket;
        $scope.details.destBucket = filledFormDetails.destBucket;

        $scope.details.url = filledFormDetails.url;
        $scope.details.selectedDate = filledFormDetails.selectedDate;
        $scope.details.getFromAws = filledFormDetails.getFromAws;
        $scope.filterByProject();

        $scope.details.camera = filledFormDetails.camera;
        $scope.details.camerasId = filledFormDetails.camerasId;
    }

    $scope.ok = function() {
        var validLen = 0;
        $scope.invalidMessage = "";
        if ($scope.details.project === '0') {
            validLen++;
            $scope.invalidMessage = "Please Select Project";
            return false;
        }
        if ($scope.details.camera === '0') {
            validLen++;
            $scope.invalidMessage = "Please Select Camera";
            return false;
        }

        if ($scope.details.srcbucket === '0') {
            validLen++;
            $scope.invalidMessage = "Please Select Source Bucket";
            return false;
        }

        if ($scope.details.destBucket === '0') {
            validLen++;
            $scope.invalidMessage = "Please Select Destination Bucket";
            return false;
        }

        if ($scope.details.url === '' || ($scope.details.url).trim().length === 0) {
            validLen++;
            $scope.invalidMessage = "Please Mention Url";
            return false;
        }

        if ($scope.details.nameFormat === '' || ($scope.details.nameFormat).trim().length === 0) {
            validLen++;
            $scope.invalidMessage = "Please Mention File Name Format To Track Start Time.";
            return false;
        }

        if (validLen === 0) {
            $scope.details.camerasId = '';

            for (var camsLen = 0; camsLen < $scope.originalCamsList.length; camsLen++) {
                if ($scope.originalCamsList[camsLen]._id === $scope.details.camera) {
                    $scope.details.camerasId = $scope.originalCamsList[camsLen].camerasId;
                    $scope.details.fps = $scope.originalCamsList[camsLen].fps;
                    $scope.details.gfps = $scope.originalCamsList[camsLen].gfps;
                    $scope.details.fks = $scope.originalCamsList[camsLen].fks;
                    $scope.details.fss = $scope.originalCamsList[camsLen].fss;
                    break;
                }
            }

            $uibModalInstance.close($scope.details);
        }
    };

    $scope.cancel = function() {
        $uibModalInstance.dismiss('cancel');
    };
});