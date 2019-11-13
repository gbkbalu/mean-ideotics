'use strict';
angular
    .module('ideotics')
    .factory('CamerasService', CamerasService);

CamerasService.$inject = ['$http'];
function CamerasService($http) {

    var selectedCameraDetails = new Object();

    return {
        getAllCameras: getAllCameras,
        updateCamera:updateCamera,
        saveCamera:saveCamera,
        removeCamera: deleteCamera,
        removeCameraById:removeCameraById,
        updateCameraById :updateCameraById,
        removeCamerasByIdList:removeCamerasByIdList,

        setSelectedCamera : setSelectedCamera,
        getSelectedCamera : getSelectedCamera,
        getCamerasListByProject : getCamerasListByProject,
        clearSelectedCamera:clearSelectedCamera,
        updateSeqIdsForSubCats:updateSeqIdsForSubCats,
        getAllBaseConfigCameras:getAllBaseConfigCameras,

        getAllBaseConfigCamerasByFiltler:getAllBaseConfigCamerasByFiltler,
        copyParamsFromSelectedBaseCam:copyParamsFromSelectedBaseCam,
        getCamerasListByFilter:getCamerasListByFilter
    };

    function setSelectedCamera(camera)
    {
        selectedCameraDetails = camera;
    }

    function getSelectedCamera()
    {
        return selectedCameraDetails;
    }

    function clearSelectedCamera()
    {
        selectedCameraDetails = new Object();
    }

    function updateSeqIdsForSubCats(categoryId)
    {
        return $http.post('/api/category/getCatsAndUpdateSucatsSeqsByProject',{categoryId:categoryId});
    }

    function copyParamsFromSelectedBaseCam(inputOb) {
        return $http.post('/api/cameras/copyParamsFromSelectedBaseCam',inputOb);
    }

    function getAllBaseConfigCameras()
    {
        return $http.post('/api/cameras/getAllBaseConfigCameras',{});
    }

    function getAllBaseConfigCamerasByFiltler(filterObject)
    {
        return $http.post('/api/cameras/getAllBaseConfigCamerasByFiltler',filterObject);
    }

    function getCamerasListByFilter(filterObject)
    {
        return $http.post('/api/cameras/getCamerasListByFilter',filterObject);
    }

    function removeCamerasByIdList(deleteObj)
    {
        return $http.post('/api/cameras/removeCamerassByIdList', deleteObj);
    }

    function getAllCameras() {
        return $http.get('/api/cameras');
    };

    function getCamerasListByProject(projectId) {
        return $http.post('/api/cameras/getCamerasListByProject',{project:projectId});
    };

    function updateCamera(dataValObj) {
        return $http.post('/api/cameras/updateCamera', setUndefinedToEmpty(dataValObj));
    };

    function saveCamera(iconImageUrl,iconName) {
        return $http.post('/api/cameras/saveCamera', {iconUrl: iconImageUrl,name:iconName});
    };

    function deleteCamera(cameraId) {
        return $http.get('/api/cameras/removeCameraById/' + cameraId);
    };

    function removeCameraById(cameraData) {
        return $http.post('/api/cameras/removeCameraById' + cameraData);
    };

    function updateCameraById(data, _id) {

        data = setUndefinedToEmpty(data);
        console.log(data);
        if(_id !== '' && _id !== 'undefined' && _id !== undefined && _id !== null )
        {
            return $http.post('/api/cameras/updateCameraById', {_id: _id, data: data});
        }
        else
        {
            return $http.post('/api/cameras', data);
        }
    }

}

