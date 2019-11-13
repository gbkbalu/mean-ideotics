'use strict';
angular
    .module('ideotics')
    .factory('HelperService', HelperService);

HelperService.$inject = ['$http'];
function HelperService($http) {

    var selectedHelperDetails = new Object();
    var helperLoaded = false;
    var helperData = new Object();
    return {
        getAllHelpers:getAllHelpers,
        updateHelperById:updateHelperById,
        setHelperData:setHelperData,
        getHelperData:getHelperData,
        setHelperLoaded:setHelperLoaded,
        getHelperLoaded:getHelperLoaded,
        getHelperTextByCode:getHelperTextByCode,
        getHelperDataService:getHelperDataService,
        updateHelperFormById:updateHelperFormById,

        setSelectedHelper:setSelectedHelper,
        getSelectedHelper:getSelectedHelper,
        clearSelectedHelper:clearSelectedHelper
    };

    function setSelectedHelper(helper)
    {
        selectedHelperDetails = helper;
    }

    function getSelectedHelper()
    {
        return selectedHelperDetails;
    }

    function clearSelectedHelper()
    {
        selectedHelperDetails = new Object();
    }

    function  setHelperLoaded(flag) {
        helperLoaded = flag;
    }

    function getHelperLoaded() {
        return helperLoaded;
    }

    function setHelperData(data)
    {
        helperData = data;
    }

    function getHelperData()
    {
        return helperData;
    }

    function getHelperTextByCode(code) {
        if(!helperLoaded || !helperData[code])
        {
            getHelperDataService();
            return code;
        }

        return helperData[code];
    }

    function getAllHelpers() {
        return $http.get('/api/helpers');
    };

    function updateHelperById(updateRecord) {
        return $http.post('/api/helpers/updateHelper',updateRecord);
    };

    function getHelperDataService() {
        if(!getHelperLoaded())
        {
            getAllHelpers().success(function(data, status)
            {
                setHelperLoaded(true);
                var helperDataObject = {};
                for(var len=0;len<data.length;len++)
                {
                    var curObj = data[len];
                    helperDataObject[curObj.helpercode] = curObj.helpertext;
                }

                setHelperData(helperDataObject);
            }).error(function(err, status)
                {
                    console.log(err);
                }
            );
        }
    }

    function updateHelperFormById(data, _id) {

        data = setUndefinedToEmpty(data);
        if(_id !== '' && _id !== 'undefined' && _id !== undefined && _id !== null )
        {
            return $http.post('/api/helpers/updateHelperById', {_id: _id, data: data});
        }
        else
        {
            return $http.post('/api/helpers', data);
        }
    }
}
