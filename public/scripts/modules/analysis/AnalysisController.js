'use strict';
var videoElement, options, CCTV;
var videoElementInstance = document.getElementById('video');
var videoRelativeContainer = document.createElement('div');
var node = document.createElement('div');
var offsetX = 0;
var offsetY = 0;

angular
    .module('ideotics')
    .controller('AnalysisController', AnalysisController);

AnalysisController.$inject = ['$scope','$timeout','$filter','$rootScope','$location','$localStorage','VideoService', 'CamerasService','UserService', 'ProjectsService','AwsService','CategoryService','IconsService', 'EventService','SubCategoryService'];

function AnalysisController($scope,$timeout,$filter,$rootScope, $location, $localStorage, VideoService, CamerasService, UserService,ProjectsService,AwsService,CategoryService,IconsService,EventService,SubCategoryService) {

    // window.dashboard === false, terminate polling
    window.dashboard = true;
    $rootScope.setHeaderglobal(7);

    var vm = this;
    vm.isDashBorard = false;
    var shopperCount = 0;
    var pausedVideoId = 0;
    var pausedVideo = {};
    var shopperNamePrefix = 'Shopper-';
    var categories = ['Shopper Profile', 'SKU Behaviour','Staff behaviour', 'Others', 'Exit Path'];
    var categoryStartTime = "";
    var startPolling = true;
    var categoriesLen = categories.length;

    var bucket = '';
    var isAwsCredExists = false;

    vm.assignStatusType = [
        {value: 1, text: 'Assigned'},
        {value: 2, text: 'Submitted'}
    ];

    vm.selectVideoAssignType = '2';

    $scope.creds = AwsService.getAwsCredentials();

    vm.userAgentsList = [];
    vm.usersList = [];
    vm.usersArrayList = [];
    UserService
        .getUsers()
        .success(function(data, status) {
            vm.usersList = data;
            var len=0;
            var usersLen = vm.usersList.length;
            for(;len<usersLen;len++)
            {
                vm.usersArrayList[vm.usersList[len].userId] = vm.usersList[len].firstName;

                if(vm.usersList[len].role && vm.usersList[len].role === 'agent' || vm.usersList[len].role === 'admin')
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

    vm.projects = [];
    vm.selectProjectName='0';
    var arrayProjects = [];
    vm.getProjectsList = function()
    {
        var filterObj = {isbase:false};
        ProjectsService
            .getAllProjects(filterObj)
            .success(function(data, status) {
                vm.projects = data;
                for(var projLen =0;projLen<vm.projects.length;projLen++)
                {
                    arrayProjects[vm.projects[projLen].clientsId] = vm.projects[projLen]._id;
                }
                var dummyVal = {clientsId: 0, clientname: 'Project Name'};
                vm.projects.splice(0,0, dummyVal);
            }).error(function(err, status) {
                console.log(err);
                console.log(status);
            });
    }

    vm.camerasList = [];
    vm.getCamerasList = function()
    {
        CamerasService
            .getAllCameras()
            .success(function(data, status) {
                vm.camerasList = data;
            }).error(function(err, status) {
                console.log(status);
            });
    }

    vm.getCamerasList();

    vm.showProject = function(video) {
        var selected = [];
        if(video.client)
            selected = $filter('filter')(vm.projects, {clientsId: video.client});
        return selected.length ? selected[0].clientcode : 'Not set';
    };

    vm.showCameras = function(video) {
        var selected = [];
        if(video.cameraId)
            selected = $filter('filter')(vm.camerasList, {camerasId: video.cameraId});
        return selected.length ? selected[0].cameracode : 'Not set';
    };

    vm.selectedVideoRate = '1.0';
    vm.changeSpeedOfVideo = function(value)
    {
        vm.selectedVideoRate = value;
        var video = document.getElementById('video').playbackRate  = value;
    }

    vm.cameras = [];
    var dummyVal = {camerasId: 0, cameracode: 'Camera Name'};
    vm.cameras.splice(0,0, dummyVal);
    vm.selectCameraName='0';

    var date = new Date();
    vm.selectedDate = date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate();

    vm.mediaPlayerApi = {};
    vm.selectedUseId = '0';
    vm.userSessionList = [];

    vm.resetFilterForm = function(type)
    {
        vm.selectCameraName='0';
        vm.selectProjectName='0';
        vm.selectedUseId = '0';
        vm.selectedVideo = '';
        if(type === 'reset')
            vm.selectedDate = date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate();
        else
            vm.selectedDate = '';

        vm.notSubmittedRecords = '';
        vm.discards = '';
        vm.totalRecords = '';

        vm.clearData();
        vm.filterByUser();
    }

    vm.getCamerasListByProject = function()
    {
        if(arrayProjects[vm.selectProjectName] !== undefined && arrayProjects[vm.selectProjectName] !== null)
        {
            CamerasService
                .getCamerasListByProject(arrayProjects[vm.selectProjectName])
                .success(function(data, status) {
                    vm.cameras = data;
                    vm.cameras.splice(0,0, dummyVal);
                }).error(function(err, status) {
                    console.log(err);
                    console.log(status);
                });
        }
        vm.selectCameraName='0';
    }

    vm.changeProject = function()
    {
        vm.cameras = [];
        vm.cameras.splice(0,0, dummyVal);

        vm.getCamerasListByProject();
        vm.getResultByFilter();
    }

    vm.totalItems = 0;
    vm.currentPage = 1;

    vm.pageChangFlag = false;
    vm.pageChanged = function()
    {
        vm.clearData();
        vm.pageChangFlag = true;
        vm.filterByUser();
    }

    vm.getResultByFilter = function() {
        vm.clearData();
        vm.pageChangFlag = false;
        vm.totalItems = 0;
        vm.currentPage = 1;
        vm.filterByUser();
    }

    var previousIndex = '';

    vm.filterByUser = function() {
        //if(vm.selectedUseId !== '0')
        //{
        vm.showvideo = false;
        vm.videosNoneMsg = '';
        vm.selectedEvent = [];
        vm.videos = [];
        vm.events = [];
        vm.currentCategory = 'OPTION VALUES';
        vm['category'] = [];
        vm.selectedEventIndex = '';
        vm.notSubmittedRecords = '';

        vm.currentVideo = {
            videoId: null
        };

        var userId = $localStorage.user.userId;
        var pausedTime = $localStorage.user.pausedVideoTime || 0;

        VideoService
            .getAllSubmittedVideosByUserAndDate(vm.selectProjectName,vm.selectCameraName,vm.selectedUseId,vm.selectedDate,vm.selectVideoAssignType,'',vm.currentPage)
            .success(function(data, status) {
                previousIndex = '';
                vm.totalItems = data.recordsCount;
                vm.videos = data.resultSet;

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

    $scope.resetValuesOfAws = function()
    {
        $scope.creds = AwsService.getAwsCredentials();

        if(!isEmpty($scope.creds) && $scope.creds.access_key)
        {
            isAwsCredExists = true;
            AWS.config.update({ accessKeyId: $scope.creds.access_key, secretAccessKey: $scope.creds.secret_key });
            AWS.config.region = $scope.creds.region;
            bucket = new AWS.S3({ params: { Bucket: $scope.creds.bucket,ACL: 'authenticated-read'} });
        }
    }

    if(isEmpty($scope.creds))
    {
        AwsService
            .getAwsByAwsType()
            .success(function(data, status)
            {
                if(data && data.length>0)
                {
                    AwsService.setAwsCredentials(data[0]);
                    $scope.resetValuesOfAws();
                }

            }).error(function(err, status) {
                console.log(err);
                console.log(status);
            });
    }else
    {
        $scope.resetValuesOfAws();
    }


    vm.getSignedUrl = function(keyValue)
    {
        var params = {Bucket: $scope.creds.bucket, Key: keyValue, Expires: 7200};
        var url = bucket.getSignedUrl('getObject', params, function (err, url) {
            if (url) console.log("The URL is", url);
            return url;
        });
    }

    vm.getCategoriesListByProject = function(video)
    {
        if(video.project)
        {
            CategoryService
                .getCategoriesListByProject(video.project._id)
                .success(function(data, status) {
                    vm.categoriesDataList = (data);
                }).error(function(err, status) {
                });
        }
    }

    /*CategoryService
        .getCategoriesList()
        .success(function(data, status) {
            vm.categoriesDataList = (data);
        }).error(function(err, status) {
        });*/

    vm.analysing = false;
    vm.eventCreated = false;
    vm.submitForm = false;
    vm.hasError = false;
    vm.analysisFinished = false;

    vm.events = [];
    vm.types = {};
    vm.videos = [];
    vm.currentVideo = {
        videoId: null
    };

    vm.selectedEvent = [];

    vm.event = {};

    vm.currentCategory = 'OPTION VALUES';

    vm.flag = {
        dataEntry: false
    };

    vm.header = {
        controls: true,
        tabs: {
            users: true,
            analysis: true,
            review: true
        }
    };

    vm.category = {

    };

    vm.openVideo = openVideo;
    vm.createEvent = createEvent;
    vm.closeDataEntry = closeDataEntry;
    vm.saveCategory = saveCategory;
    vm.submitEvent = submitEvent;
    vm.pauseAnalysis = pauseAnalysis;
    vm.onInputChange = onInputChange;
    //vm.logout = logout;
    vm.selectedEventInEventsList = selectedEventInEventsList;

    vm.selectedEventIndex = '';

    // Init
    //getUnlockVideos();
    getTypes();

    //pausedVideoId = $localStorage.user.pausedVideoId;

    vm.selectedCurrCategory = false;

    vm.showvideo = false;
    //triggers the function when event was selected .. video moves to perticular position
    function selectedEventInEventsList(index)
    {
        offsetX = 0;
        offsetY = 0;
        vm.comments = '';

        node.innerHTML = '';
        node.setAttribute('style','');

        vm.showvideo = true;
        document.getElementById('event'+index).style.backgroundColor = "lightblue";

        if(previousIndex !== '')
        {
            document.getElementById('event'+previousIndex).style.backgroundColor = "";
        }
        previousIndex = index;

        vm.selectedCurrCategory = true;

        vm.selectedEventIndex = index;
        vm.selectedEvent = [vm.events[index]];
        vm.event =vm.events[index];
        vm.eventCreated = true;

        if(vm.selectedEvent && vm.selectedEvent.length>0 && vm.selectedEvent[0].xaxis && vm.selectedEvent[0].yaxis)
        {
            offsetX = vm.selectedEvent[0].xaxis;
            offsetY = vm.selectedEvent[0].yaxis;

            if(vm.selectedEvent[0].xaxis > 0 && vm.selectedEvent[0].yaxis>0)
            {
                vm.shopperDisplayingId = parseInt(vm.selectedEvent[0].name.split('-')[1]);
                vm.showSelectedEventOnTopOfVideo(false);
            }
        }

        vm.mediaPlayerApi.controls.pause();
        vm.mediaPlayerApi.controls.changePosition(vm.event.startTime);
        vm.mediaPlayerApi.controls.play();

        createEvent('Shopper Profile')
    }

    vm.showSelectedEventOnTopOfVideo = function(firstTimeEdit)
    {
        videoElementInstance = document.getElementById('video');
        videoRelativeContainer = document.createElement('div')

        videoRelativeContainer.style.position = 'relative'
        videoElementInstance.parentNode.insertBefore(videoRelativeContainer, videoElementInstance)
        videoRelativeContainer.appendChild(videoElementInstance)


        var pinPointBoxHTML = 'User Selected<br>'+
            'Time:'+vm.mediaPlayerApi.properties.currentTime();
        node.innerHTML = pinPointBoxHTML;

        var css = {
            "border": "3px solid red",
            "position": "absolute",
            "text-align": "center",
            "pointer-events": "none",
            "display": "inline-block",
            "font-size": "0.9em",
            "box-sizing": "border-box",
            "color": "white",
            "padding": "2px",
            "width":"50px",
            "height":"100px"

        }

        node.setAttribute('style', JSON.stringify(css).replace(/"*\{*\}*/gi, '').replace(/,/gi, ';'))

        if(firstTimeEdit)
        {
            if(offsetX>40)
                offsetX = offsetX-25;
            if(offsetY>70)
                offsetY = offsetY-50;

            if(offsetX>700)
                offsetX = offsetX-25;
            if(offsetY>400)
                offsetY = offsetY-50;

            vm.shopperDisplayingId = angular.copy(shopperCount);
            vm.shopperDisplayingId = vm.shopperDisplayingId+1;
        }

        node.style.left = offsetX + 'px';
        node.style.top = offsetY + 'px';

        var pinPointBoxHTML = 'ID:'+vm.shopperDisplayingId+'<br>'+
            'X:'+offsetX+'<br>'+
            'Y:'+offsetY+'<br>';

        node.innerHTML = pinPointBoxHTML;

        videoRelativeContainer.appendChild(node);
    }

    vm.flipShowVideoFlag = function()
    {
        vm.clearData();
        vm.showvideo = !vm.showvideo
    }
    vm.clearData = function()
    {
        node.innerHTML = '';
        node.setAttribute('style','');
    }

    function getUnlockVideos() {

        var userId = $localStorage.user.userId;
        var pausedTime = $localStorage.user.pausedVideoTime || 0;
        VideoService
            .getAllSubmittedVideos(userId)
            .success(function(data, status) {
                vm.videos = data;

                if(vm.videos.length>0)
                {
                    vm.videos.forEach(function(element) {
                        if (element.status === 1) {
                            pausedVideoId = element.videoId;
                        }
                        element.userName = vm.usersArrayList[element.userId];
                    });
                }else
                {
                    vm.videosNoneMsg = 'Videos List Empty';
                }
                vm.analysing = false;
            }).error(function(err, status)
            {
            });
    }

    var isAnotherSKU = '';

    vm.subCategoriesList = [];

    function createEvent(categoryType) {

        /*if(categoryType === 'Shopper Profile' && vm.selectedEvent.length>0)
         {
         vm.selectedCurrCategory = true;
         }

         vm.flag.dataEntry = true;

         vm.currentCategory = categoryType;

         vm.form = {};
         vm.form[vm.currentCategory] = null;

         if(!vm.eventCreated) {

         vm.event = {
         videoId: vm.currentVideo.videoId
         };
         }

         var indexVal = a = categories.indexOf(categoryType);

         if(vm.subCategoriesList && vm.subCategoriesList.length>0 && !vm.subCategoriesList[vm.categoriesDataList[indexVal]._id])
         SubCategoryService
         .getSubCategoriesByCat(vm.categoriesDataList[indexVal]._id)
         .success(function(data, status) {

         vm.subCategoriesList[vm.categoriesDataList[indexVal]._id] = data;
         if(vm.eventCreated && vm.selectedEvent[0] != undefined && vm.selectedEvent[0]['analysis'] != undefined)
         {
         vm.form[vm.currentCategory] = {};
         var objTest = vm.selectedEvent[0]['analysis'][categoryType];

         if(isAnotherSKU !== '' && isAnotherSKU === 'Add Another SKU')
         {

         }else
         {
         for(var i = 0; i < data.length; i++) {
         if(categoryType === categories[0] || categoryType === categories[3])
         {
         if(objTest !== undefined)
         data[i].selectedValue = objTest[data[i].subCategory];
         }
         else if(categoryType === categories[1])
         {
         if(objTest !== undefined)
         data[i].selectedValue = objTest[0][data[i].subCategory];
         }
         else if(categoryType === categories[2])
         {
         if(objTest !== undefined)
         data[i].selectedValue = objTest[data[i].subCategory];
         }

         if(data[i].selectedValue !== undefined)
         {
         vm.form[vm.currentCategory][data[i].subCategory]=data[i].selectedValue;
         }
         }
         }
         }

         vm['category'][categoryType] = data;
         }).error(function(err, status) {

         });
         */
    }

    function closeDataEntry() {
        vm.form = {};
        vm.flag.dataEntry = false;
    }

    var addAnotherSkuNew = '';

    function saveCategory(openNext, addAnother,saveOrNext) {
        submitEvent();
    }

    function submitEvent() {

        var obj = vm.event;
        if(vm.selectedEvent[0] != undefined && vm.selectedEvent[0].eventId != undefined && vm.selectedEvent[0].eventId != '')
        {
            obj.eventId = vm.selectedEvent[0].eventId;
        }

        var updatableIndex = previousIndex;
        if(updatableIndex !== '')
        {
            updatableIndex = updatableIndex +1;
        }

        if(vm.events.length> updatableIndex)
        {
            selectedEventInEventsList(updatableIndex)
        }
        pauseAnalysis(true);
    }

    function pauseAnalysis (play) {
        var userId = $localStorage.user.userId;
        var videoId = vm.currentVideo.videoId;
        $localStorage.user.pausedVideoId = videoId;
    }

    function openVideo(video, play, time, pausedAnalysis) {
        previousIndex = '';
        vm.showvideo = true;
        time = time ? time: 0;
        //Call API to lock this video
        //TBD
        vm['category'] = [];
        vm.selectedEventIndex = '';
        var userId = $localStorage.user.userId;
        var videoId = video.videoId;

        vm.selectedVideo = video;

        //if(video.status === 2){
            $localStorage.user.pausedVideoId = videoId;
            vm.getCategoriesListByProject(video);
            getEventsListBySelectedVideo(videoId);

            vm.currentVideo = video;
            vm.analysing = true;

            if(pausedAnalysis) {
                shopperCount = vm.events.length ;
            } else {
                shopperCount = shopperCount | 0 ;
                vm.event = {};
                vm.events = [];
                vm.form = {};
            }

            var bucketUrl = '';
            //if(video.project && video.project.awsbuketurl)
            if(video.project && video.project.bucket)
            {
                if(isAwsCredExists)
                {
                    AwsService.setAwsBucketname(video.project.bucket);
                    $scope.resetValuesOfAws();
                    $timeout(function() {
                        var paramsObj = {Bucket: $scope.creds.bucket, Key: video.url, Expires: 7200};
                        var signedUrl = bucket.getSignedUrl('getObject', paramsObj, function (err, signedUrl) {
                            if (signedUrl)
                            {
                                vm.mediaPlayerApi.controls.changeSource(signedUrl, play);
                                vm.mediaPlayerApi.controls.pause();
                            }
                        });
                    }, 1000);
                }
            }else
            {
                bucketUrl = video.url;
                vm.mediaPlayerApi.controls.changeSource(bucketUrl, play);
                vm.mediaPlayerApi.controls.pause();
            }

            vm.eventCreated = false;
            vm.flag.dataEntry = false;
        /*}
        else {
            // Todo
        }*/
    }

    vm.notSubmittedRecords = '';
    var notCheckedRecords = 0;
    var discardedRecords = 0

    vm.isOpenedForReview = true;
    vm.videoDataEventsToExport = [];
    function getEventsListBySelectedVideo(selectedVideoId)
    {
        EventService
            .getEvents(selectedVideoId)
            .success(function(data, status) {
                vm.events = data;
                vm.videoDataEventsToExport = [];
                if (vm.events.length > 0) {
                    shopperCount = parseInt(vm.events[vm.events.length-1].name.split('-')[1]);
                }

                notCheckedRecords = 0;
                discardedRecords=0;
                var lenCount = 0;
                var eventsLength = vm.events.length;

                for(;lenCount<eventsLength;lenCount++)
                {
                    var currentEvent = vm.events[lenCount];
                    var catLoopLen = 0;

                    if(currentEvent.isAnalysed && currentEvent.isAnalysed === 1)
                    {
                        currentEvent.color = 'green';
                    }else
                    {
                        notCheckedRecords++;
                        currentEvent.color = 'blue';
                    }

                    var totalTimeSpent = 0;
                    var isChecked = false;
                    for(;catLoopLen<categoriesLen;catLoopLen++)
                    {
                        /*if(!currentEvent.analysis[categories[catLoopLen]] && !isChecked)
                        {
                            isChecked = true;
                            notCheckedRecords++;
                            vm.events[lenCount].color='red';
                        }*/

                        if(currentEvent.analysis[categories[catLoopLen]])
                        {
                            if(currentEvent.analysis[categories[catLoopLen]].timeSpent)
                                totalTimeSpent = totalTimeSpent +currentEvent.analysis[categories[catLoopLen]].timeSpent;
                            if(catLoopLen === 1 || catLoopLen === 2)
                            {
                                var skuBehaviourTimeSpent = 0 ;
                                for(var shopCount=0;shopCount<currentEvent.analysis[categories[catLoopLen]].length;shopCount++)
                                {
                                    if(currentEvent.analysis[categories[catLoopLen]][shopCount].timeSpent)
                                        skuBehaviourTimeSpent = skuBehaviourTimeSpent +currentEvent.analysis[categories[catLoopLen]][shopCount].timeSpent;
                                }

                                totalTimeSpent = totalTimeSpent + skuBehaviourTimeSpent;

                                currentEvent.timeSpent = skuBehaviourTimeSpent;
                            }
                        }
                    }

                    if(currentEvent.isDiscarded && currentEvent.isDiscarded === 1)
                    {
                        notCheckedRecords--;
                        discardedRecords++;
                        currentEvent.color = 'red';
                    }

                    currentEvent.totalTimeSpent = totalTimeSpent;
                }

                if(notCheckedRecords>0)
                {
                    vm.notSubmittedRecords = 'UnChecked: '+notCheckedRecords;
                }else
                {
                    vm.notSubmittedRecords = '';
                }

                if(discardedRecords>0)
                {
                    vm.discards = 'Discarded:'+discardedRecords+'   /';
                }else
                {
                    vm.discards = '';
                }

                if(eventsLength>0)
                {
                    vm.totalRecords = 'Total:'+eventsLength+'  / ';
                }else
                {
                    vm.totalRecords = '';
                }

            }).error(function(err, status)
            {
            });
    }

    function onInputChange() {
        if(Object.keys(vm.form[vm.currentCategory]).length === 1) {
        }

        if(Object.keys(vm.form[vm.currentCategory]).length > 0) {
        }
    }

    function getTypes() {
        IconsService
            .getAllIcons()
            .success(function(data, status) {
                angular.forEach(data, function(item) {
                    vm.types[item.name] = item.imageUrl;
                });
            }).error(function(err, status) {
            });
    }

    vm.videosNoneMsg = '';

    vm.exportData = function () {
        if(vm.currentVideo && vm.currentVideo.videoId && isVaulueValid(vm.currentVideo.videoId))
        {
            VideoService.getSubmittedVideoEventToCSVExport('events',vm.currentVideo.videoId)
                .success(function(data, status) {
                    if(data && data.length>0)
                        alasql('SELECT * INTO XLSX("event.xlsx",{headers:true}) FROM ?',[data]);
                }).error(function(err, status) {
                    console.log(err);
                    console.log(status);
                });

            VideoService.getSubmittedVideoEventToCSVExport('skubehaviour',vm.currentVideo.videoId)
                .success(function(data, status) {
                    if(data && data.length>0)
                        alasql('SELECT * INTO XLSX("skubehaviour.xlsx",{headers:true}) FROM ?',[data]);
                }).error(function(err, status) {
                    console.log(err);
                    console.log(status);
                });
        }
    };
};

