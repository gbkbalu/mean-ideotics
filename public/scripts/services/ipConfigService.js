'use strict';
angular
    .module('ideotics')
    .factory('IpConfigService', IpConfigService);

IpConfigService.$inject = ['$http'];
function IpConfigService($http) {
    var selectedIpConfigDetails = new Object();
    return {
        getAllIpconfigs : getAllIpconfigs,
        removeIpconfigsByIdList:removeIpconfigsByIdList,
        updateIpconfigById:updateIpconfigById,
        setSelectedIpConfig:setSelectedIpConfig,
        getSelectedIpConfig:getSelectedIpConfig,
        clearSelectedIpConfig:clearSelectedIpConfig
    };

    function setSelectedIpConfig(ipConfig)
    {
        selectedIpConfigDetails = ipConfig;
    }

    function getSelectedIpConfig()
    {
        return selectedIpConfigDetails;
    }

    function clearSelectedIpConfig()
    {
        selectedIpConfigDetails = new Object();
    }

    function getAllIpconfigs() {
        return $http.get('/api/ipconfig');
    };

    function removeIpconfigsByIdList(ipconfigIdsList)
    {
        return $http.post('/api/ipconfig/removeIpconfigsByIdList', ipconfigIdsList);
    }

    function updateIpconfigById(data, _id) {
        data = setUndefinedToEmpty(data);
        if(_id !== '' && _id !== 'undefined' && _id !== undefined && _id !== null )
        {
            return $http.post('/api/ipconfig/updateIpconfig', {_id: _id, data: data});
        }
        else
        {
            return $http.post('/api/ipconfig', data);
        }
    }

}
