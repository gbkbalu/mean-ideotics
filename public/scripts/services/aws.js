'use strict';
angular
    .module('ideotics')
    .factory('AwsService', AwsService);

AwsService.$inject = ['$http','$localStorage','$rootScope'];
function AwsService($http,$localStorage,$rootScope) {

    var awsCredentials = new Object();
    return {
        getAwsByAwsType:getAwsByAwsType,
        setAwsCredentials:setAwsCredentials,
        getAwsCredentials:getAwsCredentials,
        setAwsBucketname:setAwsBucketname,
        clearAwsCredentials:clearAwsCredentials,
        saveMetaFileContent:saveMetaFileContent,
        getInstanceDetails:getInstanceDetails,
        stopOrStartInstance:stopOrStartInstance,
        findIpLocation:findIpLocation,
        getSecurityGroupDetails:getSecurityGroupDetails,
        addIpToAccessMongo:addIpToAccessMongo,
        findMyIp:findMyIp,
        authenticateUrl:authenticateUrl,
        getObjectsList:getObjectsList,
        getObjectsDetailContent:getObjectsDetailContent
    };

    function setAwsBucketname(bucketname)
    {
        if(isVaulueValid(bucketname))
        {
            awsCredentials.bucket = bucketname;
        }
    };
    function setAwsCredentials(data) {

        awsCredentials = {access_key: data.accessKeyId,secret_key: data.secretAccessKey,bucket:data.bucketName,region:data.region,destFolder:''};


        if($localStorage.user && $localStorage.user.project)
        {
            var globalsProject = $localStorage.user.project;
            if(isVaulueValid(globalsProject) && globalsProject.bucket)
            {
                var awsClientBuckName = globalsProject.bucket;
                var destinationFolder = globalsProject.destFolder;

                if(isVaulueValid(awsClientBuckName)) {
                    awsCredentials.bucket = awsClientBuckName;
                }

                if(isVaulueValid(destinationFolder))
                {
                    awsCredentials.destFolder = destinationFolder;
                }
            }
        }

    };

    function getAwsCredentials() {
        return awsCredentials;
    };

    function clearAwsCredentials() {
        awsCredentials = new Object();
    };

    function getAwsByAwsType() {
        return $http.post('/api/aws/getAwsByAwsType');
    };

    function saveMetaFileContent(metaFileContObj)
    {
        return $http.post('/client/api/aws/saveMetaFileContent',metaFileContObj);
    }

    function getInstanceDetails() {
        return $http.get('/api/aws/getInstanceDetails');
    };

    function findMyIp() {
        return $http.get('/api/aws/findMyIp');
    };

    function stopOrStartInstance(startOrStopType)
    {
        return $http.post('/api/aws/stopOrStartInstance',startOrStopType);
    }

    function findIpLocation()
    {
        return $http.post('/api/aws/findIpLocation');
    }

    function getSecurityGroupDetails(securityObj)
    {
        return $http.post('/api/aws/getAwsSecuirtyGroupInformation', securityObj);
    }

    function addIpToAccessMongo(securityObj)
    {
        return $http.post('/api/aws/addIpToAccessMongo', securityObj);
    }

    function authenticateUrl(urlObj)
    {
        return $http.post('/api/aws/authenticateUrl', urlObj);
    }

    function getObjectsList(inputObj)
    {
        return $http.post('/api/aws/getObjectsList', inputObj);
    }

    function getObjectsDetailContent(inputObj)
    {
        return $http.post('/api/aws/getObjectsDetailContent', inputObj);
    }

}
