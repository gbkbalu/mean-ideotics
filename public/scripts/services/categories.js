'use strict';
angular
    .module('ideotics')
    .factory('CategoryService', CategoryService);

CategoryService.$inject = ['$http'];
function CategoryService($http) {

    return {
        getSubCategories: getSubCategories,
        getTypes: getTypes,
        getSubCategoriesList:getSubCategoriesList,
        getListOfSubCatsObjs:getListOfSubCatsObjs,

        updateCategory:updateCategory,
        getCategoriesList : getCategoriesList,
        getCategoriesListByProject : getCategoriesListByProject,
        getCategoriesListByFilter:getCategoriesListByFilter,
        copyCategoriesAndSubCatsByFilter:copyCategoriesAndSubCatsByFilter,
        saveModifiedChanges:saveModifiedChanges
    };

    function getSubCategories(categoryName) {
        return $http.get('/api/options/categories/' + categoryName);
    };

    function getTypes() {
        return $http.get('/api/options');
    };

    function getSubCategoriesList(arrListNames) {
        //return $http.get('/api/options/categories/' + categoryName);
        return $http.post('/api/options/catList/getListOfImage', {catListName: arrListNames});
    };

    function getListOfSubCatsObjs() {
        return $http.get('/api/options/getListOfSubCats');
    };

    function updateCategory(catId,categoryName,isMandatory,isHidden,project,camera) {
        return $http.post('/api/category/update', {_id: catId,category:categoryName,name:categoryName,isMandatory:isMandatory,isHidden:isHidden,project:project, camera:camera});
    };

    function getCategoriesList() {
        return $http.get('/api/category/getCategoriesList');
        //category/getCategoriesList
    };

    function getCategoriesListByProject(projectId) {
        return $http.post('/api/category/getCategoriesListByProject', {project: projectId});
    };

    function getCategoriesListByFilter(filterObj) {
        return $http.post('/api/category/getCategoriesListByFilter', filterObj);
    };

    function copyCategoriesAndSubCatsByFilter(filterObj) {
        return $http.post('/api/category/copyCategoriesAndSubCatsByFilter', filterObj);
    };

    function saveModifiedChanges(filterObj) {
        return $http.post('/api/category/saveModifiedChanges', filterObj);
    };

}
