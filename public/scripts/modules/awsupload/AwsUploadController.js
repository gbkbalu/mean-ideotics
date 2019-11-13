'use strict';

var controllers = angular.module('controllers', []);

controllers.controller('UploadController',['$scope','$timeout','$window','$localStorage','$rootScope','$http','$upload','AuthService','VideoService','AwsService','ProjectsService',
    function($scope,$timeout,$window,$localStorage,$rootScope,$http,$upload,AuthService,VideoService,AwsService,ProjectsService) {

    $rootScope.setHeaderglobal(10);
    AwsService.clearAwsCredentials();
    $scope.filesToUploaded = [];
    $rootScope.innerHeightAwsUploadFileTable = "height:"+($window.innerHeight-320)+"px;";

    $scope.fileOrDirectoryType = '0';
    $scope.typeOfFileSelected = false;

    //when the file type changed from file to directory or vice versa
    $scope.changeFileUploadType = function()
    {
        $scope.typeOfFileSelected = !$scope.typeOfFileSelected;
        $scope.uploadProgress =0;
        $scope.file = undefined;
        $scope.fileUploadLen = 0;
        $scope.filesToUploaded = [];
    }

    //when we uploaded the files at client side all the uploaded files will comes here
    $scope.uploadedFiles = function( $files, $event, $flow )
    {
        $rootScope.TimeOutTimerValue = 60*60*1000;
        $scope.filesToUploaded = [];
        for(var len=0;len<$files.length;len++)
        {
            var objFile =  $files[len].file;

            objFile.uploadProgress = 0;
            objFile.fileSize = Math.round(parseInt(objFile.size)/1000);
            $scope.filesToUploaded.push(objFile);
        }
        console.log($scope.filesToUploaded);
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

    var bucket = '';
    var isAwsCredExists = false;

    $scope.creds = AwsService.getAwsCredentials();

    $rootScope.resetValuesOfAws = function()
    {
        $scope.creds = AwsService.getAwsCredentials();
        console.log($scope.creds)
        if(!isEmpty($scope.creds) && $scope.creds.access_key)
        {
            isAwsCredExists = true;
            AWS.config.update({ accessKeyId: $scope.creds.access_key, secretAccessKey: $scope.creds.secret_key });
            AWS.config.region = $scope.creds.region;
            bucket = new AWS.S3({ params: { Bucket: $scope.creds.bucket,Prefix:'test1'} });
        }
    }

    if(isEmpty($scope.creds))
    {
        AwsService
       .getAwsByAwsType()
       .success(function(data, status)
       {
           console.log(data)
           if(data && data.length>0)
           {
               AwsService.setAwsCredentials(data[0]);
               $rootScope.resetValuesOfAws();
           }
       }).error(function(err, status) {
           console.log(err);
           console.log(status);
       });
    }else
    {
        $rootScope.resetValuesOfAws();
    }

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
            var fileSize = Math.round(parseInt($scope.file.size)/1000);
            var uniqueFileName = $scope.file.name;

            var fileNamePath = ($scope.creds.destFolder)+$scope.file.name;

            if($scope.typeOfFileSelected)
            {
                fileNamePath = ($scope.creds.destFolder)+$scope.file.webkitRelativePath
            }
            var params = { Key: fileNamePath, ContentType: $scope.file.type, Body: $scope.file, ServerSideEncryption: 'AES256' };

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
                    toastr.success('File Uploaded Successfully', 'Done');

                    setTimeout(function() {
                        $scope.$digest();

                        var awsbucketurl = '';
                        var user = $rootScope.globals.user;
                        console.log(user)
                        var projectId = '';

                        var inputNewVideoObj = {userId:user.userId,client:user.project.clientsId,name:uniqueFileName,status:0,url:fileNamePath,destinationFolder:($scope.creds.destFolder),bucket:$scope.creds.bucket};

                        if(user && user.project && user.project.awsbuketurl)
                        {
                            inputNewVideoObj.project = user.project._id;
                        }

                        VideoService
                            .clientUploadVideo(inputNewVideoObj, '')
                            .success(function(data, status) {

                            }).error(function(err, status) {
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
                            $scope.uploadProgress =100
                            $scope.file = undefined;
                            $scope.fileUploadLen = 0;
                            $scope.hideCancelButton = true;
                            $scope.request = '';
                        }
                    }, 3000);

                }
            })
            .on('httpUploadProgress',function(progress) {
                $scope.uploadProgress = Math.round(progress.loaded / progress.total * 100);
                var calcSize = Math.round(((fileSize / 100) * $scope.uploadProgress));
                $scope.sizeUploaded = '('+calcSize +'KB/'+fileSize+'KB)';
                if($scope.filesToUploaded.length>0)
                {
                    $scope.filesToUploaded[$scope.fileUploadLen-1].uploadProgress = Number($scope.uploadProgress);
                    $scope.filesToUploaded[$scope.fileUploadLen-1].sizeUploaded = $scope.sizeUploaded;
                }
                $scope.$digest();
            }).send();
        }
        else {
            toastr.error('Please select a file to upload');
        }
    }

    $scope.fileSizeLabel = function() {
        return Math.round($scope.sizeLimit / 1024 / 1024) + 'MB';
    };
}])
