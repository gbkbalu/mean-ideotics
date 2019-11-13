'use strict';
angular
    .module('ideotics')
    .controller('AddCameraController', AddCameraController);

AddCameraController.$inject = ['$scope','$timeout','$rootScope','$location', 'CamerasService','ProjectsService','AwsService'];
function AddCameraController($scope,$timeout, $rootScope, $location, CamerasService,ProjectsService,AwsService) {

    // window.dashboard === false, terminate polling
    window.dashboard = false;
    $rootScope.setHeaderglobal(4);


    var vm = this;
    vm.errorMessage = '';
    vm.pageTitle = "Add New Camera";

    vm.orgImageUrl = "/assets/img/upload-icon.png";
    vm.imageUrl = "/assets/img/upload-icon.png";
    vm.camImageUrl = "/assets/img/upload-icon.png";
    $scope.selectedProject = '';

    vm.newEmptyCamera = function(){
        var camera = new Object();
        camera.cameracode = '';
        camera.cameraname = '';
        camera.location = '';
        camera.project = '0';
        camera.height = '380';
        camera.width = '640';
        camera.isbase = false;
        camera.forwardDuration = 1;
        camera.fps = 30;
        camera.gfps = 30;
        camera.fks = 2;
        camera.fss = 1;
        camera.bucket = '';
        camera.camImageUrl = '';
        camera.shortCamUrl = '';
        camera.clientId ='';
        return camera;
    };

    vm.addCamera = vm.newEmptyCamera();

    vm.editCameraDetails = CamerasService.getSelectedCamera();

    vm.saveBtnName = 'Save Camera';
    vm.showResetBtn = true;
        vm.showIsEdit = false;

    if(!isEmpty(vm.editCameraDetails))
    {
        vm.pageTitle = "Edit Camera";
        vm.saveBtnName = 'Update & Close';
        vm.showResetBtn = false;
        vm.showIsEdit = true;
        vm.addCamera = angular.copy(vm.editCameraDetails);
        vm.imageUrl = "/assets/img/upload-icon.png";
        if(isVaulueValid(vm.addCamera.camImageUrl))
        {
            vm.imageUrl = vm.addCamera.camImageUrl;
        }
    }

    var clientObj = {};
    vm.projectsList = [];
    vm.getProjectsList = function()
    {
        var filterObj = {};
        ProjectsService
            .getAllProjects(filterObj)
            .success(function(data, status) {
                vm.projectsList = data;
                if(!isEmpty(vm.editCameraDetails))
                {
                    for(var len=0;len<data.length;len++)
                    {
                        if(vm.addCamera != undefined && vm.addCamera.project != undefined && vm.addCamera.project == data[len]._id)
                        {
                            $scope.selectedProject = data[len];
                            vm.addCamera.bucket = $scope.selectedProject.bucket;
                            $scope.loadAwsValues();
                        }
                        clientObj[data[len]._id] = data[len].clientsId;
                    }
                }else
                {
                    for(var len=0;len<data.length;len++)
                    {
                        clientObj[data[len]._id] = data[len].clientsId;
                    }
                }

                console.log(clientObj)
            }).error(function(err, status) {
                console.log(err);
                console.log(status);
            });
    }
    vm.getProjectsList();

    vm.resetForm = function()
    {
        vm.submitted = false;
        vm.errorMessage = '';
        if(!vm.showIsEdit)
        {
            vm.addCamera = vm.newEmptyCamera();
        }else
        {
            vm.addCamera = angular.copy(vm.editCameraDetails);
        }
    }

    vm.submitted = false;
    vm.successMessage = '';
    vm.saveCamera = function(changeLocation) {

        vm.submitted = true;

        vm.errorMessage = '';
        vm.successMessage = '';

        var isValid = false;
        if(vm.addCamera.project === undefined || vm.addCamera.project === null || vm.addCamera.project === 'undefined'  || vm.addCamera.project === '0')
        {
            isValid = false;
            vm.addCamera.project = '0';
            return false;
        }else
        {
            isValid = true;
        }

        if($scope.myform.$valid && isValid)
        {
            var cameraId = '';
            if(vm.showIsEdit)
            {
                var cameraId = vm.editCameraDetails._id;
            }

            vm.addCamera.clientId = clientObj[vm.addCamera.project];

            vm.addCamera.cameraname = vm.addCamera.cameracode;
            CamerasService.updateCameraById(vm.addCamera, cameraId)
                .success(function (data, status) {
                    // TODO add id to user object
                    vm.errorMessage = '';

                    if(vm.showIsEdit) {
                        vm.successMessage = 'Camera Updated SuccessFully.';
                    }else
                    {
                        vm.successMessage = 'Camera Added SuccessFully.';
                    }

                    $timeout(function() {
                        if(changeLocation)
                        {
                            $location.path('/videos');
                        }
                    }, 1000);
                })
                .error(function (err) {

                    if(err && err.success === false && err.error)
                    {
                        vm.errorMessage = err.error;
                    }
                });
        }else
        {
            return false;
        }

    };

    vm.cancelTheForm = function()
    {
        $location.path('/cameras');
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

    vm.file = '';
    vm.uploadFile = function(event){
        var files = event.target.files;
        var reader = new FileReader();
        reader.onload = imageIsLoaded;
        reader.readAsDataURL(files[0]);
        $scope.file = files[0];
        $scope.upload();
    };

    function imageIsLoaded(e) {
        $('#myImg').attr('src', e.target.result);
        vm.camImageUrl = e.target.result;

        if(vm.showIsEdit) {
            var dataValObj = {_id: vm.addCamera._id, camImageUrl: vm.camImageUrl};
        }
    };


    var bucket = '';
    var isAwsCredExists = false;

    $scope.loadAwsValues = function()
    {
        $scope.creds = AwsService.getAwsCredentials();

        $scope.resetValuesOfAws = function()
        {
            $scope.creds = AwsService.getAwsCredentials();
            if(!isEmpty($scope.creds) && $scope.creds.access_key)
            {
                if($scope.selectedProject != '')
                {
                    $scope.creds.bucket = $scope.selectedProject.bucket;
                    $scope.creds.destFolder = $scope.selectedProject.destFolder;
                }

                isAwsCredExists = true;
                AWS.config.update({ accessKeyId: $scope.creds.access_key, secretAccessKey: $scope.creds.secret_key });
                AWS.config.region = $scope.creds.region;
                bucket = new AWS.S3({ params: { Bucket: $scope.creds.bucket} });
            }

            //$scope.getSignedUrl();
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
    }


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
            var frameImageName = $scope.file.name;

            var fileNamePath = $scope.file.name;

            if($scope.typeOfFileSelected)
            {
                fileNamePath = $scope.file.webkitRelativePath;
            }

            fileNamePath =  ($scope.creds.destFolder+"camImages/") + fileNamePath;
            $scope.file.url = fileNamePath;
            vm.addCamera.camImageUrl = "http://"+$scope.creds.bucket+".s3.amazonaws.com/"+fileNamePath;
            vm.addCamera.shortCamUrl = fileNamePath;
            vm.addCamera.bucket = $scope.creds.bucket;

            var params = { Key: fileNamePath, ContentType: $scope.file.type, Body: $scope.file, ServerSideEncryption: 'AES256',ACL: 'public-read' };

                $scope.request = bucket.completeMultipartUpload(params);
                $scope.request = bucket.putObject(params);
                //bucket.putObject(params, function(err, data) {
                //$rootScope.loadingAndBlockUI("Uploading Camera Image.");
                $scope.request.on('complete',function(response) {
                    if(response.error) {
                        var err = response.error;
                        toastr.error(err.message,err.code);
                        return false;
                    }else
                    {
                        console.log(response)
                        toastr.success('File Uploaded Successfully', 'Done');
                        // Reset The Progress Bar
                        setTimeout(function() {
                            $scope.$digest();
                            vm.saveCamera(false);
                        }, 3000);
                    }
                    //$rootScope.stopLoadingBlockUI();
                })
                    .on('httpUploadProgress',function(progress) {
                        $scope.uploadProgress = Math.round(progress.loaded / progress.total * 100);
                        var calcSize = Math.round(((fileSize / 100) * $scope.uploadProgress));
                        $scope.sizeUploaded = '('+calcSize +'KB/'+fileSize+'KB)';
                        $scope.$digest();
                    }).send();

        }
        else {
            // No File Selected
            toastr.error('Please select a file to upload');
        }
    }

    $scope.fileSizeLabel = function() {
        // Convert Bytes To MB
        return Math.round($scope.sizeLimit / 1024 / 1024) + 'MB';
    };

    $scope.getSignedUrl = function()
    {
        $timeout(function() {
            var paramsObj = {Bucket: vm.addCamera.bucket, Key: vm.addCamera.camImageUrl, Expires: 7200};
            var signedUrl = bucket.getSignedUrl('getObject', paramsObj, function (err, signedUrl)
            {
                if (signedUrl)
                {
                    vm.imageUrl = signedUrl;
                }
            });
        }, 1000);
    }

    vm.showImage = function()
    {
        $('#popupCameraImage').modal('show',{
            backdrop: true,
            keyboard: false
        });
    }


}
