'use strict';

var controllers = angular.module('controllers', []);

controllers.controller('UploadController',['$scope','$localStorage','$rootScope','AuthService','VideoService', function($scope,$localStorage,$rootScope,AuthService,VideoService) {
  $scope.sizeLimit      = 10585760; // 10MB in Bytes
  $scope.uploadProgress = 0;
    $scope.creds          = {access_key: "AKIAIFYPDWSAHTP3DFRA", secret_key: "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",bucket:"kumar-freetier-s3"};
    //$scope.creds          = {access_key: "AKIAJF37HRRBQUUIMSQQ", secret_key: "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",bucket:"ideotics"};

    // $scope.creds          = {access_key: "AKIAIFYPDWSAHTP3DFRA", secret_key: "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",bucket:"kumar-freetier-s3"};
    //$scope.creds          = {access_key: "AKIAJF37HRRBQUUIMSQQ", secret_key: "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",bucket:"ideoticstest"};

    AWS.config.update({ accessKeyId: $scope.creds.access_key, secretAccessKey: $scope.creds.secret_key });
    AWS.config.region = 'us-east-1';
    var bucket = new AWS.S3({ params: { Bucket: $scope.creds.bucket } });

    $scope.fileUploadFlag = false;
    $scope.fileUploadLen = 0;
    $scope.filesUploadedProgress = [];

    console.log($localStorage.user);
    console.log($rootScope.globals.user)

    $scope.upload = function() {

    if($scope.file) {
        $scope.fileUploadLen++;
        // Perform File Size Check First
        var fileSize = Math.round(parseInt($scope.file.size));
        /*if (fileSize > $scope.sizeLimit) {
          toastr.error('Sorry, your attachment is too big. <br/> Maximum '  + $scope.fileSizeLabel() + ' file attachment allowed','File Too Large');
          return false;
        }*/
        // Prepend Unique String To Prevent Overwrites
        var uniqueFileName = $scope.uniqueString() + '-' + $scope.file.name;

        var params = { Key: uniqueFileName, ContentType: $scope.file.type, Body: $scope.file, ServerSideEncryption: 'AES256' };

        bucket.putObject(params, function(err, data) {
          if(err) {
            toastr.error(err.message,err.code);
            return false;
          }
          else
          {
            // Upload Successfully Finished
            toastr.success('File Uploaded Successfully', 'Done');

            // Reset The Progress Bar
            setTimeout(function() {
              $scope.uploadProgress = 0;
              $scope.$digest();

                var awsbucketurl = '';
                var user = $rootScope.globals.user;
                var projectId = '';

                var inputNewVideoObj = {client:$rootScope.globals.user.client,datasynced:0,name:uniqueFileName,status:0,url:uniqueFileName};

                if(user && user.project && user.project.awsbuketurl)
                {
                    //awsbucketurl = $rootScope.globals.user.project.awsbuketurl;
                    inputNewVideoObj.project = user.project._id;
                }

                VideoService
                    .updateVideoById(inputNewVideoObj, '')
                    .success(function(data, status) {
                        console.log(data);
                    }).error(function(err, status) {
                        console.log(err);
                        console.log(status);
                    });

                if($scope.fileUploadLen <$scope.filesToUploaded.length)
                {
                    $scope.file = $scope.filesToUploaded[$scope.fileUploadLen];
                    $scope.upload();
                }
            }, 3000);

          }
        })
        .on('httpUploadProgress',function(progress) {
          $scope.uploadProgress = Math.round(progress.loaded / progress.total * 100);
          //$scope.filesUploadedProgress[$scope.fileUploadLen-1] = $scope.uploadProgress;
          $scope.filesToUploaded[$scope.fileUploadLen-1].uploadProgress = Number($scope.uploadProgress);
          $scope.$digest();
        });
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

  $scope.uniqueString = function() {
    var text     = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 8; i++ ) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

      var dateObj = new Date();

      var fullYr = String(dateObj.getFullYear());
      var month = addZero(dateObj.getMonth()+1) ;
      var date = addZero(dateObj.getDate()) ;
      var hrs = addZero(dateObj.getHours());
      var min = addZero(dateObj.getMinutes());
      var YYYYMMDDHH24MI = (fullYr+month+date+hrs+min);
      //alert(YYYYMMDDHH24MI);
      text = YYYYMMDDHH24MI;

    return text;
  }


}]);
