'use strict';
angular
    .module('ideotics')
    .controller('AddHelperController', AddHelperController);

AddHelperController.$inject = ['$scope','$timeout','$rootScope','$location', 'HelperService'];
function AddHelperController($scope,$timeout, $rootScope, $location, HelperService) {

    alert('helper edited')
    window.dashboard = true;
    $rootScope.setHeaderglobal(17);


    var vm = this;
    vm.errorMessage = '';
    vm.pageTitle = "Add New Helper";

    vm.newEmptyHelper = function(){
        var helper = new Object();
        helper.helpercode = '';
        helper.description = '';
        return helper;
    };

    vm.addHelper = vm.newEmptyHelper();

    vm.editHelperDetails = HelperService.getSelectedHelper();

    console.log(vm.editHelperDetails)

    vm.saveBtnName = 'Save Helper';
    vm.showResetBtn = true;
    vm.showIsEdit = false;

    if(!isEmpty(vm.editHelperDetails))
    {
        vm.pageTitle = "Edit Helper";
        vm.saveBtnName = 'Update & Close';
        vm.showResetBtn = false;
        vm.showIsEdit = true;
        vm.addHelper = angular.copy(vm.editHelperDetails);
    }

    vm.resetForm = function()
    {
        vm.submitted = false;
        vm.errorMessage = '';
        if(!vm.showIsEdit)
        {
            vm.addHelper = vm.newEmptyHelper();
        }else
        {
            vm.addHelper = angular.copy(vm.editHelperDetails);
        }
    }

    vm.submitted = false;
    vm.successMessage = '';
    vm.saveHelper = function() {

        vm.submitted = true;

        vm.errorMessage = '';
        vm.successMessage = '';

        var isValid = false;
        var helperCode = vm.addHelper.helpercode;
        if(helperCode === undefined || helperCode === null || helperCode === 'undefined'  || helperCode.trim().length<3)
        {
            isValid = false;
            vm.addHelper.helpercode = '';
            return false;
        }else
        {
            isValid = true;
        }

        if($scope.myform.$valid && isValid)
        {
            var helperId = '';
            if(vm.showIsEdit)
            {
                var helperId = vm.editHelperDetails._id;
            }

            HelperService.updateHelperFormById(vm.addHelper, helperId)
                .success(function (data, status) {
                    // TODO add id to user object
                    vm.errorMessage = '';

                    if(vm.showIsEdit) {
                        vm.successMessage = 'Helper Updated SuccessFully.';
                    }else
                    {
                        vm.successMessage = 'Helper Added SuccessFully.';
                    }

                    $timeout(function() {
                        $location.path('/helper');
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
        $location.path('/helper');
    }
}
