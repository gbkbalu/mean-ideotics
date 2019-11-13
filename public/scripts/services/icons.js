'use strict';
angular
    .module('ideotics')
    .factory('IconsService', CategoryService);

CategoryService.$inject = ['$http'];
function CategoryService($http) {

    return {
        getAllIcons: getAllIcons,
        getListOfIcons:getListOfIcons,
        updateIcon:updateIcon,
        saveIcon:saveIcon,
        removeIcon: deleteIcon,
        getSubCatCountByIcon:getSubCatCountByIcon
    };

    function getAllIcons() {
        return $http.get('/api/icons');
    };

    function getListOfIcons(arrListNames) {
        return $http.post('/api/icons/getListOfIcons', {catListName: arrListNames});
    };


    function updateIcon(dataValObj) {
        return $http.post('/api/icons/updateIcon', dataValObj);
    };

    /*function updateIcon(iconId,iconName) {
        return $http.post('/api/icons/updateIcon', {_id: iconId,name:iconName});
    };*/

    function saveIcon(iconImageUrl,iconName) {
        return $http.post('/api/icons/saveIcon', {iconUrl: iconImageUrl,name:iconName});
    };

    function deleteIcon(iconId) {
        return $http.get('/api/icons/removeIconById/' + iconId);
    };

    function getSubCatCountByIcon(iconId) {
        return $http.get('/api/icons/getSubCatCountByIcon/' + iconId);
    };

}

