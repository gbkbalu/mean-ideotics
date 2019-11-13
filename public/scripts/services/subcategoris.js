'use strict';
angular
    .module('ideotics')
    .factory('SubCategoryService', SubCategoryService);

SubCategoryService.$inject = ['$http'];
function SubCategoryService($http) {

    return {
        saveSubCategory:saveSubCategory,
        updateSubCategory:updateSubCategory,
        getSubCategoriesByCat: getSubCategoriesByCat,
        addTypeToSubCat:addTypeToSubCat,
        updateOrderOfSubCats:updateOrderOfSubCats,
        removeSubCategory:removeSubCategory,
        getAllSubCategoriesByCategory:getAllSubCategoriesByCategory,
        getSubCategoriesByFilter:getSubCategoriesByFilter
    };

    function saveSubCategory(subCatName,category,orderId,project,isMandatory,reference,camera,isHidden, typeArr) {
        return $http.post('/api/subcategory', {name: subCatName,subCategory:subCatName,category:category,orderId:orderId,project:project,isMandatory:isMandatory,refcatcode:reference,camera:camera, isHidden:isHidden, type:typeArr});
    };

    function updateSubCategory(subCatId, subCatName,isMandatory,reference,category, camera, isHidden, percentage) {
        return $http.post('/api/subcategory/updateSubcategory', {_id:subCatId,name: subCatName,subCategory:subCatName,isMandatory:isMandatory,refcatcode:reference,category:category, camera:camera, isHidden:isHidden, percentage:percentage});
    };

    function getSubCategoriesByCat(catId) {
        return $http.get('/api/subcategory/byCat/' + catId);
    };

    function getAllSubCategoriesByCategory(catId,isHidden) {
        return $http.post('/api/subcategory/getAllSubCategoriesByCategory',{category:catId,isHidden:isHidden});
    };

    function addTypeToSubCat(subCatSelectedId,valueToAddId) {
        return $http.post('/api/subcategory/addTypeToSubCat', {_id: subCatSelectedId,type:valueToAddId});
    };

    function updateOrderOfSubCats(subCatSelectedIds,orderIds) {
        return $http.post('/api/subcategory/updateOrderOfSubCats', {idsList: subCatSelectedIds,orderIds:orderIds});
    };

    function removeSubCategory(subCatId) {
        return $http.post('/api/subcategory/removeSubCategory', {_id: subCatId});
    };

    function getSubCategoriesByFilter(catId,isPrimary) {
        return $http.post('/api/subcategory/getSubCategoriesByFilter',{category:catId,isPrimary:isPrimary});
    };
}
