'use strict';

var videoControllers = angular.module('videoControllers', []);

videoControllers.controller('VideoUploadController',['$scope','$timeout','$window','$localStorage','$rootScope','$http','$upload','AuthService','VideoService','AwsService','ProjectsService',
    function($scope,$timeout,$window,$localStorage,$rootScope,$http,$upload,AuthService,VideoService,AwsService,ProjectsService) {

        var destinationBucket = "ideotics-ideocap";
        var sourceBucket = "ideotics-uploader-pro-data";

        $scope.uploadModal = "Video Upload";
        $scope.totalVideosLen = 0;
        var bucket = '';
        var isAwsCredExists = false;

        $rootScope.gridModalTable = "height:"+($window.innerHeight-250)+"px;";

        $scope.hideModal = function()
        {
            $scope.uploadProgress =0;
            $scope.file = '';
            $scope.fileUploadLen = 0;
            $scope.filesToUploaded = [];

            $scope.removeAllUploadingFilse();

            $('#uploadVideoFiles').modal('hide');
        }

        $scope.hideAndLoadPreviousModal = function()
        {
            $scope.hideModal();
            $rootScope.loadVideoUploadModel()
        }

        //$rootScope.setHeaderglobal(10);
        AwsService.clearAwsCredentials();
        $scope.filesToUploaded = [];
        $rootScope.innerHeightAwsUploadFileTable = "height:"+($window.innerHeight-320)+"px;";

        $scope.fileOrDirectoryType = '0';
        $scope.typeOfFileSelected = false;

        $scope.fromAws = false;
        $scope.awsFolderListWise = [{Prefix:sourceBucket,key:sourceBucket,value:sourceBucket}];
        $rootScope.$on("CallUploaderMethod", function(){
            $scope.filledFormDetails = ProjectsService.getUploadFormDetails();
            $scope.filledFormDetails.getFromName = true;
            $scope.filledFormDetails.isMetaFileLoaded = false;

            destinationBucket = $scope.filledFormDetails.destBucket;
            sourceBucket = $scope.filledFormDetails.srcbucket;

            $scope.awsFolderListWise = [{Prefix:sourceBucket,key:sourceBucket,value:sourceBucket}];
            $scope.uploadModal = "Amazon S3 >";

            $scope.awsCopyMethod();
        });

        $scope.gridAwsOptions = {
            columnDefs: [
                { field: 'Prefix' ,displayName: 'Name',enableHiding:false,
                    cellTemplate:'<a href ="" class="Open" ng-click="grid.appScope.showSubDirectories(row.entity)" style="font-size: 15px;">{{row.entity.Prefix}}</a>'},
                { name: 'Open',enableHiding:true,enableColumnMenu: false,width:100,
                    cellTemplate:'<div class="Open" ><button class="btn btn-primary btn-padding"  ng-click="grid.appScope.showSubDirectories(row.entity)" style="margin:auto;display: block;"><span class="glyphicon glyphicon-folder-open" aria-hidden="true" ></span></button></div>' }
            ],
            enableColumnResizing:true,
            enableHorizontalScrollbar:1,
            enableRowSelection: false,
            enableRowHeaderSelection: true,
            rowHeight: 35,
            currentPage:1,
            showFooter: true,
            multiSelect:false,
            onRegisterApi: function(gridApi){
                $scope.gridApi = gridApi;
                gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                    //console.log(row.entity)
                });
            }
        };

        $scope.gridAwsFilesOptions = {
            columnDefs: [
                { field: 'Key' ,displayName: 'Name',enableHiding:false},
                { name: 'Load',enableHiding:true,enableColumnMenu: false,width:80,
                    cellTemplate:'<div ng-if="grid.appScope.showLoadButton(row.entity)" class="Open" ><button class="btn btn-primary btn-padding"  ng-click="grid.appScope.loadTextFile(row.entity)" style="margin:auto;display: block;"><span class="glyphicon glyphicon-cloud-download" aria-hidden="true" ></span></button></div>' },
                { name: 'Edit',enableHiding:true,enableColumnMenu: false,width:80,
                    cellTemplate:'<div ng-if="grid.appScope.showLoadButton(row.entity)" class="Open" ><button class="btn btn-primary btn-padding"  ng-click="grid.appScope.loadTextFile(row.entity,true)" style="margin:auto;display: block;"><span class="glyphicon glyphicon-edit" aria-hidden="true" ></span></button></div>' }
            ],
            enableColumnResizing:true,
            enableHorizontalScrollbar:1,
            enableRowSelection: false,
            enableRowHeaderSelection: true,
            rowHeight: 35,
            currentPage:1,
            showFooter: true,
            multiSelect:true,

            onRegisterApi: function(gridFilesApi){
                $scope.gridFilesApi = gridFilesApi;
                gridFilesApi.selection.on.rowSelectionChanged($scope, function (row) {
                });
            }
        };

        $scope.showLoadButton = function(selectedRow)
        {
            var keyValue = selectedRow.Key;
            var index = keyValue.lastIndexOf(".txt");
            var showLoad = false;
            if(index>-1)
            {
                showLoad = true;
            }

            return showLoad;
        }

        $scope.metaDataObj = {};
        $scope.showMetaContent = false;
        $scope.metaObj = {metaObjDataEditStr:""};
        $scope.destinationFileName = "";
        $scope.loadTextFile = function(selectedEntity, showContent)
        {
            $scope.filledFormDetails.isMetaFileLoaded = false;
            $scope.metaDataObj = {};
            $scope.metaObj = {metaObjDataEditStr:""};
            $rootScope.loadingAndBlockUI('Loading Content of file.');
            var metaFileName = selectedEntity.Key;
            $scope.destinationFileName = metaFileName;
            var indexLen = metaFileName.lastIndexOf(".txt");
            if(indexLen>-1)
            {
                var params = {Bucket: sourceBucket,Key: metaFileName};
                AwsService
                    .getObjectsDetailContent({paramsObj:params})
                    .success(function(data, status)
                    {
                        $rootScope.stopLoadingBlockUI();
                        $scope.metaObj = {metaObjDataEditStr:data.content};
                        try {
                            $scope.metaDataObj = JSON.parse(data.content);
                        } catch(e) {
                            toastr.error('Not a valid json format', 'Done'); // error in the above string (in this case, yes)!
                        }
                        if($scope.metaDataObj)
                        {
                            $scope.metaDataObj.FPS =  parseInt($scope.metaDataObj.FPS);
                            $scope.metaDataObj.GFPS =  parseInt($scope.metaDataObj.GFPS);
                            $scope.metaDataObj.Clip_Length =  parseInt($scope.metaDataObj.Clip_Length);
                            $scope.metaDataObj.FK =  parseInt($scope.metaDataObj.FK);
                            $scope.metaDataObj.FS =  parseInt($scope.metaDataObj.FS);
                        }
                        if(showContent)
                        {
                            $scope.showMetaContent = true;
                        }else
                        {
                            $scope.filledFormDetails.isMetaFileLoaded = true;
                        }
                    }).error(function(err, status) {
                        $rootScope.stopLoadingBlockUI();
                        console.log(err);
                    });
            }
        }

        $scope.enableForEdit = function()
        {
            $scope.enableMetaContext = !$scope.enableMetaContext;
        }

        $scope.saveEditedMetaContent = function()
        {
            $scope.enableForEdit();
            $scope.cancelMetaEditContent();

            var metaFileContObj = {bucketName:sourceBucket,destinationFile:$scope.destinationFileName, metaContent:$scope.metaObj.metaObjDataEditStr};
            AwsService
                .saveMetaFileContent(metaFileContObj)
                .success(function(data, status)
                {
                    if(data && data.length>0)
                    {
                        //AwsService.setAwsCredentials(data[0]);
                        //$scope.resetValuesOfAws();
                    }

                }).error(function(err, status) {
                    console.log(err);
                });
        }

        $scope.cancelMetaEditContent = function()
        {
            $scope.showMetaContent = !$scope.showMetaContent;
        }

        var containsCheck = "Ideo_";
        $scope.copyAwsFiles = function()
        {
            if(!$scope.filledFormDetails.getFromName && (isEmpty($scope.metaDataObj) || !$scope.filledFormDetails.isMetaFileLoaded))
            {
                toastr.error("Please load text file before copy","Warning");

                return;
            }

            var selectedVideosLen = $scope.gridFilesApi.selection.getSelectedRows().length;
            $scope.mp4SelectedVideosLen = 0;
            for(var len=0;len<selectedVideosLen;len++)
            {
                var currentObj = $scope.gridFilesApi.selection.getSelectedRows()[len];
                var awsFileName = currentObj.Key;
                if(awsFileName != null && awsFileName != undefined && awsFileName.endsWith("mp4"))
                {
                    $scope.mp4SelectedVideosLen++;
                }
            }

            swal({
                    title: "Are you sure?",
                    text: "You have selected "+$scope.mp4SelectedVideosLen+" Out Of "+$scope.totalVideosLen+" ! Would you like to copy selected videos. Do you want to continue?",
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#32CD32",
                    confirmButtonText: "Yes, copy it!",
                    closeOnConfirm: true
                },
                function(){
                    $scope.filledFormDetails = ProjectsService.getUploadFormDetails();
                    $scope.selectedProject = ProjectsService.getVideoSelectedProject();

                    var nameformat = $scope.filledFormDetails.nameFormat;
                    var nameFormatLen = ($scope.filledFormDetails.nameFormat).length;

                    var hrsIndex = nameformat.indexOf("HHMISS");

                    $rootScope.TimeOutTimerValue = 60*60*1000;

                    var inputObjArrList = [];
                    var copyObjParamsList = [];
                    for(var len=0;len<selectedVideosLen;len++)
                    {
                        var currentObj = $scope.gridFilesApi.selection.getSelectedRows()[len];
                        var awsFileName = currentObj.Key;
                        if(awsFileName.endsWith("mp4") && (!$scope.filledFormDetails.getFromName || ($scope.filledFormDetails.getFromName &&awsFileName.includes(containsCheck))))
                        {
                            var indexLen = awsFileName.lastIndexOf("/");
                            if (indexLen > -1) {
                                awsFileName = awsFileName.substring(indexLen + 1, awsFileName.length);
                            }

                            var copyObjParams = {
                                Bucket: destinationBucket,
                                CopySource: $scope.fetchedDetails.Name + "/" + currentObj.Key,
                                Key: $scope.filledFormDetails.url + awsFileName
                            };

                            var filename = awsFileName;
                            filename = filename.substr(0, filename.lastIndexOf('.')) || filename;
                            var startDateOfVideo = '';
                            var dateOfTheVideo = '';
                            var startingTime = '';
                            var videoClipLen = 0;

                            if (filename.length == nameFormatLen || awsFileName.includes(containsCheck)) {
                                var ideoIndex = awsFileName.indexOf(containsCheck)+5;
                                var YYYYIndex = ideoIndex;//nameformat.indexOf("YYYY");
                                var MMIndex = ideoIndex+4;//nameformat.indexOf("MM");
                                var DDIndex = ideoIndex+6;//nameformat.indexOf("DD");

                                var HHIndex = ideoIndex+8;//nameformat.indexOf("HH");
                                var MIIndex = ideoIndex+10;//nameformat.indexOf("MI");
                                var SSIndex = ideoIndex+12;//nameformat.indexOf("SS");

                                var lenSubStr = filename.substring(SSIndex+2,filename.lastIndexOf('_'));
                                videoClipLen = lenSubStr.substring(lenSubStr.lastIndexOf('_')+1,lenSubStr.length);
                                //var LengthIndex = nameformat.indexOf("LLL");

                                var isToUpload = 0;
                                dateOfTheVideo = '';
                                startingTime = filename.substring(HHIndex, HHIndex + 2) + ':' + filename.substring(MIIndex, MIIndex + 2) + ':' + filename.substring(SSIndex, SSIndex + 2);
                                if (HHIndex >= 0 && MIIndex >= 0 && SSIndex >= 0) {
                                    startingTime = startingTime
                                }

                                if (YYYYIndex >= 0 && MMIndex >= 0 && DDIndex >= 0) {
                                    startDateOfVideo = filename.substring(YYYYIndex, YYYYIndex + 4) + '-' + filename.substring(MMIndex, MMIndex + 2) + '-' + filename.substring(DDIndex, DDIndex + 2);
                                    dateOfTheVideo = filename.substring(YYYYIndex, YYYYIndex + 4) + '-' + filename.substring(MMIndex, MMIndex + 2) + '-' + filename.substring(DDIndex, DDIndex + 2);
                                    dateOfTheVideo = dateOfTheVideo + ' ' + startingTime;
                                }

                                /*if(LengthIndex >=0)
                                {
                                    videoClipLen = filename.substring(LengthIndex, LengthIndex + 3);
                                }*/
                            }

                            var awsbucketurl = '';
                            var user = $rootScope.globals.user;
                            var projectId = '';

                            var inputNewVideoObj = {
                                project: $scope.filledFormDetails.project,
                                client: $scope.filledFormDetails.clientId,
                                format: $scope.filledFormDetails.nameFormat,
                                camera: $scope.filledFormDetails.camera,
                                cameraId: $scope.filledFormDetails.camerasId,
                                name: awsFileName,
                                status: 0,
                                hidden: false,
                                datasynced: 0,
                                url: $scope.filledFormDetails.url + awsFileName,
                                destinationFolder: ($scope.filledFormDetails.url),
                                bucket: destinationBucket,
                                startingTime: startingTime,
                                dateOfTheVideo: dateOfTheVideo,
                                copyObj:{selectedLen:selectedVideosLen, totalVideos:$scope.totalVideosLen},
                                lengthOfVideo:parseInt(videoClipLen)
                            };

                            if($scope.filledFormDetails.getFromName)
                            {
                                if(inputNewVideoObj.lengthOfVideo === 0)
                                {
                                    continue;
                                }

                                var loadLen = 0;
                                if($scope.metaDataObj.Clip_Length != null && $scope.metaDataObj.Clip_Length != undefined)
                                {
                                    loadLen = $scope.metaDataObj.Clip_Length;
                                }
                                $scope.metaDataObj = {};
                                $scope.metaDataObj.FPS =  parseInt($scope.filledFormDetails.fps);
                                $scope.metaDataObj.GFPS =  parseInt($scope.filledFormDetails.gfps);
                                $scope.metaDataObj.Clip_Length =  parseInt(videoClipLen);
                                $scope.metaDataObj.FK =  parseInt($scope.filledFormDetails.fks);
                                $scope.metaDataObj.FS =  parseInt($scope.filledFormDetails.fss);
                                $scope.metaDataObj.StartDate = startDateOfVideo;
                                $scope.metaDataObj.StartTime = startingTime;
                                $scope.metaDataObj.Load_Length = 0;
                                if(loadLen != 0)
                                {
                                    $scope.metaDataObj.Load_Length = loadLen;
                                }

                            }

                            if(len == selectedVideosLen-1)
                            {
                                $scope.metaDataObj.isLast = true;
                            }

                            inputNewVideoObj = setMetaDataAndComputeTime(filename, inputNewVideoObj, awsFileName)

                            if (user && user.project && user.project.awsbuketurl) {
                                inputNewVideoObj.project = user.project._id;
                            }

                            if(awsFileName.endsWith("mp4"))
                            {
                                inputNewVideoObj = setUndefinedToEmpty(inputNewVideoObj);
                                inputObjArrList.push(inputNewVideoObj);
                                copyObjParamsList.push(copyObjParams);
                            }
                        }
                    }
                    if(copyObjParamsList.length>0)
                    {
                        //saveToAwsAndMongo(copyObjParamsList);
                        saveVideoToMongo(inputObjArrList, copyObjParamsList);
                    }else
                    {
                        toastr.error('Please Check File Name Format, It doesnot matches', 'Failed');
                    }
                });
        }

        function setMetaDataAndComputeTime(keyName, inputNewVideoObj, originalFileName)
        {
            var clipNumber = parseInt(keyName.substring(1, 3));
            $scope.metaDataObj.ClipNumber =  parseInt(keyName.substring(1, 3));
            var dateOfTheVideo = $scope.metaDataObj.StartDate+' '+$scope.metaDataObj.StartTime;
            inputNewVideoObj.startingTime = $scope.metaDataObj.StartTime;
            inputNewVideoObj.dateOfTheVideo = dateOfTheVideo;

            var convertedDate = new Date(dateOfTheVideo);
            var convertibleSeconds = computeValue($scope.metaDataObj.Clip_Length);
            if($scope.metaDataObj.Load_Length != null && $scope.metaDataObj.Load_Length != undefined && $scope.metaDataObj.Load_Length != 0)
            {
                convertibleSeconds = computeValue($scope.metaDataObj.Load_Length);
            }
            var calculatedSeconds = (clipNumber-1) * convertibleSeconds;

            convertedDate.setSeconds(convertedDate.getSeconds() + calculatedSeconds);

            var startdate_yyyymmdd = convertedDate.getFullYear()+'-'+ ('0'+(convertedDate.getMonth()+1)).slice(-2)+'-'+ ('0' +convertedDate.getDate()).slice(-2);
            var starttime_hhmiss = ('0'+convertedDate.getHours()).slice(-2)+':'+ ('0'+convertedDate.getMinutes()).slice(-2)+':'+ ('0' +convertedDate.getSeconds()).slice(-2);

            var c_start_date_time = startdate_yyyymmdd + ' ' + starttime_hhmiss;

            inputNewVideoObj.startingTime = starttime_hhmiss;
            inputNewVideoObj.dateOfTheVideo = c_start_date_time;

            if(originalFileName === $scope.metaDataObj['L-clip'])
            {
                convertibleSeconds = computeValue($scope.metaDataObj.Last_Clip_Length);
            }else if($scope.metaDataObj.isLast != null && $scope.metaDataObj.isLast != undefined && $scope.metaDataObj.isLast)
            {
                convertibleSeconds = computeValue($scope.metaDataObj.Clip_Length);
            }

            convertedDate.setSeconds(convertedDate.getSeconds() + convertibleSeconds);

            startdate_yyyymmdd = convertedDate.getFullYear()+'-'+ ('0'+(convertedDate.getMonth()+1)).slice(-2)+'-'+ ('0' +convertedDate.getDate()).slice(-2);
            starttime_hhmiss = ('0'+convertedDate.getHours()).slice(-2)+':'+ ('0'+convertedDate.getMinutes()).slice(-2)+':'+ ('0' +convertedDate.getSeconds()).slice(-2);


            var c_end_date_time = startdate_yyyymmdd + ' ' + starttime_hhmiss;

            inputNewVideoObj.endingTime = starttime_hhmiss;
            inputNewVideoObj.endDateOfTheVideo = c_end_date_time;
            inputNewVideoObj.metaDataObj = $scope.metaDataObj;
            inputNewVideoObj.forwardDuration = calculateForwardDuration();

            return inputNewVideoObj;
        }

        function computeValue(Clip_Length)
        {
            var fps_fk = $scope.metaDataObj.FPS * $scope.metaDataObj.FK;
            var calculatedTime = ($scope.metaDataObj.GFPS*Clip_Length*($scope.metaDataObj.FK+$scope.metaDataObj.FS))/fps_fk;
            return calculatedTime;
        }

        function calculateForwardDuration()
        {
            var forwardDuration = $scope.metaDataObj.FK/($scope.metaDataObj.FK+$scope.metaDataObj.FS);
            return forwardDuration;
        }

        function saveToAwsAndMongo(copyObjParams)
        {
            var bucket1 = new AWS.S3({ params: { Bucket: copyObjParams.Bucket, ACL: 'authenticated-read'} });
            angular.forEach(copyObjParams, function(value, key) {
                bucket1.copyObject(value, function (err, data) {
                    if (err) {
                        console.log(err, err.stack); // an error occurred
                    } else {
                    }
                });
            })
        }

        function saveVideoToMongo(arrObjsList, copyObjParams)
        {
            $scope.metaDataObj = {};
            VideoService
                .saveUploadedVideoAws(arrObjsList, copyObjParams)
                .success(function (data, status) {
                    //$scope.hideModal();
                    $scope.awsFolderListWise.pop();
                    $scope.getAwsListOnClick($scope.awsFolderListWise[$scope.awsFolderListWise.length-1],$scope.awsFolderListWise.length-1);
                    toastr.success('Videos Copied Successfully', 'Done');
                    $rootScope.reloadVideosData();
                }).error(function (err, status) {
                    console.log(err);
                });
        }

        $scope.fetchedDetails = '';
        $scope.folderList = true;
        $scope.showSubDirectories = function(selectedRow)
        {
            $scope.metaDataObj = {};
            $scope.filledFormDetails.getFromName = true;
            $scope.filledFormDetails.isMetaFileLoaded = false;
            $rootScope.loadingAndBlockUI('Loading Files List.');
            var awsVal = selectedRow.Prefix;
            var indexLen = awsVal.lastIndexOf("/");
            if(indexLen>-1)
            {
                awsVal = awsVal.substring(0, indexLen);
                indexLen = awsVal.lastIndexOf("/");
                if(indexLen>-1)
                {
                    awsVal = awsVal.substring(indexLen+1, awsVal.length);
                }
            }
            $scope.awsFolderListWise.push({Prefix:selectedRow.Prefix,key:selectedRow.Prefix,value:awsVal});

            bucket = new AWS.S3({ params: { Bucket: sourceBucket, Delimiter: '/',Prefix:selectedRow.Prefix} });

            var params = {Bucket: sourceBucket};
            if(params.Bucket != undefined && params.Bucket != 'undefined' && params.Bucket != '')
            {
                AwsService
                    .getObjectsList({paramsObj:{ Bucket: sourceBucket, Delimiter: '/',Prefix:selectedRow.Prefix}})
                    .success(function(data, status)
                    {
                        $scope.folderList = true;
                        $scope.fetchedDetails = data;
                        $scope.gridAwsOptions.data = [];
                        $scope.gridAwsFilesOptions.data = data.Contents;

                        if(data.CommonPrefixes.length>0)
                        {
                            $scope.gridAwsOptions.data = data.CommonPrefixes;
                            $scope.gridApi.core.refresh();
                        }else
                        {
                            $scope.folderList = false;
                            //$scope.gridAwsFilesOptions.data = data.Contents;
                            $scope.gridApi.core.refresh();
                            $scope.totalVideosLen = 0;
                            var objectsList = [];
                            for(var len =0;len<data.Contents.length;len++)
                            {
                                var objKey = data.Contents[len];
                                if(objKey != null && objKey != undefined && objKey.Key != null && objKey.Key != undefined && (objKey.Key).endsWith("mp4"))
                                {
                                    $scope.totalVideosLen++;
                                }

                                if(objKey != null  && objKey != undefined  && objKey.Size != null  && objKey.Size != undefined && objKey.Size != 0 )
                                {
                                    objectsList.push(objKey);
                                }
                            }

                            $scope.gridAwsFilesOptions.data = objectsList;
                        }
                        $rootScope.stopLoadingBlockUI();
                    }).error(function(err, status) {
                        console.log(err);
                        console.log(status);
                    });
            }
        }

        $scope.getAwsListOnClick = function(record,index)
        {
            $scope.folderList = true;
            if(index == 0)
            {
                $scope.awsFolderListWise = $scope.awsFolderListWise.splice(0,index+1);
                $scope.awsCopyMethod();
            }else
            {
                $scope.awsFolderListWise = $scope.awsFolderListWise.splice(0,index);
                $scope.showSubDirectories(record);
            }

        }

        $scope.awsCopyMethod = function() {
            $scope.filledFormDetails = ProjectsService.getUploadFormDetails();
            if($scope.filledFormDetails.getFromAws)
            {
                bucket = new AWS.S3({ params: { Bucket: sourceBucket,Delimiter:"/"} });

                if($scope.gridFilesApi != undefined)
                {
                    $scope.gridFilesApi.selection.clearSelectedRows();
                }

                var params = {Bucket: sourceBucket};
                if(params.Bucket != undefined && params.Bucket != 'undefined' && params.Bucket != '')
                {
                    AwsService
                        .getObjectsList({paramsObj:{ Bucket: sourceBucket,Delimiter:"/"}})
                        .success(function(data, status)
                        {
                            $scope.fetchedDetails = data;
                            $scope.folderList = true;
                            $scope.gridAwsOptions.data = [];
                            $scope.gridAwsFilesOptions.data = data.Contents;
                            if(data.CommonPrefixes.length>0)
                            {
                                $scope.gridAwsOptions.data = data.CommonPrefixes;
                                $scope.gridApi.core.refresh();
                            }else
                            {
                                $scope.folderList = false;
                                $scope.gridAwsFilesOptions.data = data.Contents;
                                $scope.gridFilesApi.core.refresh();
                            }
                        }).error(function(err, status) {
                            console.log(err);
                            console.log(status);
                        });
                }
            }
        }
        //when the file type changed from file to directory or vice versa
        $scope.changeFileUploadType = function()
        {
            $scope.typeOfFileSelected = !$scope.typeOfFileSelected;
            $scope.uploadProgress =0;
            $scope.file = '';
            $scope.fileUploadLen = 0;
            $scope.filesToUploaded = [];
        }

        $scope.filledFormDetails = {};
        $scope.selectedProject = {};
        var dateOfTheVideo = '';

        //when we uploaded the files at client side all the uploaded files will comes here
        $scope.uploadedFiles = function( $files, $event, $flow )
        {
            $flow.files = [];
            $scope.filledFormDetails = ProjectsService.getUploadFormDetails();
            $scope.selectedProject = ProjectsService.getVideoSelectedProject();
            $rootScope.resetValuesOfAws();

            var nameformat = $scope.filledFormDetails.nameFormat;
            var nameFormatLen = ($scope.filledFormDetails.nameFormat).length;

            var hrsIndex = nameformat.indexOf("HHMISS");

            $rootScope.TimeOutTimerValue = 60*60*1000;
            $scope.filesToUploaded = [];
            $scope.filesNotValid = [];

            for(var len=0;len<$files.length;len++)
            {
                var objFile =  $files[len].file;

                var filename = objFile.name;
                filename = filename.substr(0, filename.lastIndexOf('.')) || filename;

                objFile.uploadProgress = 0;
                objFile.fileSize = Math.round(parseInt(objFile.size)/1000);

                objFile.isToUpload = false;

                if(filename.length == nameFormatLen)
                {
                    var YYYYIndex = nameformat.indexOf("YYYY");
                    var MMIndex = nameformat.indexOf("MM");
                    var DDIndex = nameformat.indexOf("DD");

                    var HHIndex = nameformat.indexOf("HH");
                    var MIIndex = nameformat.indexOf("MI");
                    var SSIndex = nameformat.indexOf("SS");

                    var isToUpload = 0;
                    var res = filename.substring(HHIndex,HHIndex+2)+':'+filename.substring(MIIndex,MIIndex+2)+':'+filename.substring(SSIndex,SSIndex+2);
                    if(HHIndex>=0 && MIIndex>=0 && SSIndex >=0)
                    {
                        objFile.startTime = res;
                        isToUpload++;
                    }

                    if(YYYYIndex>=0 && MMIndex>=0 && DDIndex >=0)
                    {
                        var dateOfTheVideo = filename.substring(YYYYIndex,YYYYIndex+4)+'-'+filename.substring(MMIndex,MMIndex+2)+'-'+filename.substring(DDIndex,DDIndex+2);
                        dateOfTheVideo = dateOfTheVideo +' '+res;
                        objFile.dateOfTheVideo = dateOfTheVideo;
                        isToUpload++;
                    }else
                    {
                        objFile.dateOfTheVideo = ($scope.filledFormDetails.selectedDate +' '+res);
                    }

                    objFile.isToUpload = true;
                }else
                {
                    $scope.filesNotValid.push(objFile);
                }

                $scope.filesToUploaded.push(objFile);
            }

            $scope.file = $scope.filesToUploaded[0];
        }

        $scope.removeUploadingVideo = function(index)
        {
            delete $scope.filesToUploaded.splice(index,1);
            if($scope.filesToUploaded.length<1)
            {
                $scope.removeAllUploadingFilse();
            }

            if($scope.fileUploadLen !== 0 && $scope.currentUploadingFile !== 0 && $scope.fileUploadLen === $scope.currentUploadingFile)
            {
                setTimeout($scope.request.abort.bind($scope.request), 100);
                $scope.fileUploadLen--;
                $timeout(function(){
                    if($scope.fileUploadLen <$scope.filesToUploaded.length)
                    {
                        $scope.file = $scope.filesToUploaded[$scope.fileUploadLen];
                        $scope.upload();
                    }
                },500);
            }

        }
        $scope.removeAllUploadingFilse = function()
        {
            $scope.uploadProgress =0;
            $scope.file = undefined;
            $scope.fileUploadLen = 0;
            $scope.filesToUploaded = [];

            if($scope.request !== '' && $scope.request)
            {
                setTimeout($scope.request.abort.bind($scope.request), 100);
                $timeout(function(){
                    $scope.uploadProgress =0;
                },100);
            }
        }

        $scope.sizeLimit      = 10585760; // 10MB in Bytes
        $scope.uploadProgress = 0;

        $scope.fileUploadFlag = false;
        $scope.fileUploadLen = 0;
        $scope.filesUploadedProgress = [];
        $scope.hideCancelButton = false;
        $scope.request = '';
        $scope.currentUploadingFile = 0;

        $scope.upload = function() {
            $scope.hideCancelButton = false;
            if($scope.file) {
                $rootScope.TimeOutTimerValue = 60*60*1000;

                var relativePath = $scope.file.webkitRelativePath;
                var folder = relativePath.split("/");

                $scope.fileUploadLen++;
                $scope.currentUploadingFile++;
                // Perform File Size Check First
                var fileSize = Math.round(parseInt($scope.file.size)/1000);
                // Prepend Unique String To Prevent Overwrites
                var uniqueFileName = $scope.file.name;

                var fileNamePath = $scope.file.name;

                if($scope.typeOfFileSelected)
                {
                    fileNamePath = $scope.file.webkitRelativePath;
                }

                fileNamePath =  ($scope.filledFormDetails.url) + fileNamePath;

                var startingTime = $scope.file.startTime;
                dateOfTheVideo = $scope.file.dateOfTheVideo;

                var params = { Key: fileNamePath, ContentType: $scope.file.type, Body: $scope.file, ServerSideEncryption: 'AES256' };

                if($scope.file.isToUpload === false)
                {
                    $scope.filesToUploaded[$scope.fileUploadLen-1].sizeUploaded = 'Not Valid Format';
                    if($scope.fileUploadLen <$scope.filesToUploaded.length)
                    {
                        $scope.hideCancelButton = false;
                        $scope.uploadProgress = 0;
                        $scope.file = $scope.filesToUploaded[$scope.fileUploadLen];
                        $scope.upload();
                    }else
                    {
                        $scope.uploadProgress =100;
                        $scope.file = undefined;
                        $scope.fileUploadLen = 0;
                        $scope.hideCancelButton = true;
                        $scope.request = '';

                        if($scope.filesNotValid && $scope.filesNotValid.length>0)
                        {
                            $scope.uploadModal = "Video File Name Format not supported for upload";
                        }
                    }
                }else
                {
                    $scope.request = bucket.completeMultipartUpload(params);
                    $scope.request = bucket.putObject(params);
                    $scope.request.on('complete',function(response) {
                        if(response.error) {
                            var err = response.error;
                            toastr.error(err.message,err.code);
                            return false;
                        }
                        else
                        {
                            // Upload Successfully Finished
                            toastr.success('File Uploaded Successfully', 'Done');

                            // Reset The Progress Bar
                            setTimeout(function() {
                                $scope.$digest();

                                var awsbucketurl = '';
                                var user = $rootScope.globals.user;
                                var projectId = '';

                                var inputNewVideoObj = {
                                    project:$scope.filledFormDetails.project,
                                    client:$scope.filledFormDetails.clientId,
                                    format:$scope.filledFormDetails.nameFormat,
                                    camera:$scope.filledFormDetails.camera,
                                    cameraId:$scope.filledFormDetails.camerasId,
                                    name:uniqueFileName,
                                    status:0,
                                    hidden:false,
                                    datasynced:0,
                                    url:fileNamePath,
                                    destinationFolder:($scope.filledFormDetails.url),
                                    bucket:destinationBucket,
                                    startingTime:startingTime,
                                    dateOfTheVideo:dateOfTheVideo
                                };

                                if(user && user.project && user.project.awsbuketurl)
                                {
                                    inputNewVideoObj.project = user.project._id;
                                }

                                VideoService
                                    .saveUploadedVideo(inputNewVideoObj)
                                    .success(function(data, status) {

                                    }).error(function(err, status) {
                                        toastr.error(err, 'Failed');
                                        console.log(err);
                                        console.log(status);
                                    });

                                if($scope.fileUploadLen <$scope.filesToUploaded.length)
                                {
                                    $scope.hideCancelButton = false;
                                    $scope.uploadProgress = 0;
                                    $scope.file = $scope.filesToUploaded[$scope.fileUploadLen];
                                    $scope.upload();
                                }else
                                {
                                    $scope.uploadProgress =100;
                                    $scope.file = undefined;
                                    $scope.fileUploadLen = 0;
                                    $scope.hideCancelButton = true;
                                    $scope.request = '';

                                    if($scope.filesNotValid && $scope.filesNotValid.length>0)
                                    {
                                        $scope.uploadModal = "Video File Name Format not supported for upload";
                                    }
                                }
                            }, 3000);
                        }
                    })
                        .on('httpUploadProgress',function(progress) {
                            $scope.uploadProgress = Math.round(progress.loaded / progress.total * 100);
                            if(!isNaN($scope.uploadProgress))
                            {
                                var calcSize = Math.round(((fileSize / 100) * $scope.uploadProgress));
                                $scope.sizeUploaded = '('+calcSize +'KB/'+fileSize+'KB)';
                                if($scope.filesToUploaded.length>0)
                                {
                                    $scope.filesToUploaded[$scope.fileUploadLen-1].uploadProgress = Number($scope.uploadProgress);
                                    $scope.filesToUploaded[$scope.fileUploadLen-1].sizeUploaded = $scope.sizeUploaded;
                                }
                            }
                            $scope.$digest();
                        }).send();
                }
            }
            else {
                toastr.error('Please select a file to upload');
            }
        }
        $scope.fileSizeLabel = function() {
            return Math.round($scope.sizeLimit / 1024 / 1024) + 'MB';
        };
    }])

