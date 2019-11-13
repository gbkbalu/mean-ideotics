'use strict';
angular
    .module('ideotics')
    .controller('AddUserController', AddUserController);

AddUserController.$inject = ['$http','$scope','$timeout','$rootScope', '$q' ,'$filter','$location', 'UserService','AuthService','ProjectsService','$localStorage'];
function AddUserController($http,$scope,$timeout, $rootScope, $q ,$filter, $location, UserService,AuthService,ProjectsService,$localStorage) {

    // window.dashboard === false, terminate polling
    window.dashboard = false;
    $rootScope.setHeaderglobal(1);


    var vm = this;
    vm.users = [];
    vm.errorMessage = '';
    vm.pageTitle = "Add New User";

    vm.inputTypePassword = true;
    vm.showOrHide = "Show";

    vm.showOrHidePassword = function ()
    {
        vm.inputTypePassword = !vm.inputTypePassword;
        if(vm.showOrHide == "Show")
            vm.showOrHide = "Hide";
        else
            vm.showOrHide = "Show"
    }
    vm.rolesList = [
        {value: 'agent', text: 'Agent'},
        {value: 'admin', text: 'Admin'},
        {value: 'client', text: 'Client'},
        {value: 'reviewer', text: 'Reviewer'},
        {value: 'superreviewer', text: 'Super Reviewer'}
    ];

    vm.statusList = [
        {value: 1, text: 'Active'},
        {value: 2, text: 'Inactive'}
    ];

    vm.newEmptyUser = function(){
        var user = new Object();
        user.firstName = '';
        user.lastName = '';
        user.email = '';
        user.password = '';
        user.role = vm.rolesList[0].value;
        user.active = vm.statusList[0].value;
        user.client = '';
        user.project = '';
        return user;
    };

    vm.addUser = vm.newEmptyUser();

    vm.broadCastMsg = UserService.getBroadCastMessage();
    vm.editUserDetails = UserService.getSelectedUser();

    vm.saveBtnName = 'Save User';
    vm.showResetBtn = true;
    vm.showIsEdit = false;

    if(!isEmpty(vm.editUserDetails))
    {
        vm.pageTitle = "Edit User";
        vm.saveBtnName = 'Update User';
        vm.showResetBtn = false;
        vm.showIsEdit = true;
        vm.addUser = angular.copy(vm.editUserDetails);
    }

    vm.resetUserForm = function()
    {
        vm.errorMessage = '';
        if(!vm.showIsEdit)
        {
            vm.addUser = vm.newEmptyUser();
        }else
        {
            vm.addUser = angular.copy(vm.editUserDetails);
        }
    }

    vm.projectsList = [];
    vm.getProjectsList = function()
    {
        var filterObj = {isbase:false};
        ProjectsService
            .getAllProjects(filterObj)
            .success(function(data, status) {
                vm.projectsList = data;
            }).error(function(err, status) {
                console.log(err);
                console.log(status);
            });
    }

    vm.submitted = false;
    vm.successMessage = '';
    vm.saveUser = function(formDet) {
        //vm.user not updated yet
        vm.submitted = true;

        vm.errorMessage = '';
        vm.successMessage = '';

        if(formDet.$valid)
        {
            var userId = '';
            if(vm.showIsEdit)
            {
                userId = vm.editUserDetails.userId;
            }

            UserService.saveUser(vm.addUser, userId)
                .success(function (data, status) {
                    // TODO add id to user object
                    vm.errorMessage = '';

                    if(vm.showIsEdit) {
                        vm.successMessage = 'User Updated SuccessFully.';
                    }else
                    {
                        vm.successMessage = 'User Added SuccessFully.';
                    }

                    $timeout(function() {
                        $location.path('/user');
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
        $location.path('/user');
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

    vm.getProjectsList();

    vm.broadcast= {title:'Please Logout Ideotics.',message:'This system is shutting down in 30 seconds... Will resume in 2 Minutes ... Sorry for the inconvenience.'};
    vm.broadCastMessage = function()
    {
        $rootScope.sendMessageToAll(vm.broadcast.title, vm.broadcast.message);
    }

}
