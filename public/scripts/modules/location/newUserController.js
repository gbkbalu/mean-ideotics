'use strict';
angular
    .module('ideotics')
    .controller('AddUserController', AddUserController);

AddUserController.$inject = ['$http','$rootScope', '$q' ,'$filter','$location', 'UserService','AuthService','ProjectsService','$localStorage'];
function AddUserController($http, $rootScope, $q ,$filter, $location, UserService,AuthService,ProjectsService,$localStorage) {

    // window.dashboard === false, terminate polling
    window.dashboard = false;
    $rootScope.setHeaderglobal(1);


    var vm = this;
    vm.users = [];
    vm.errorMessage = '';
    vm.pageTitle = "Add New User";
    vm.pageDesc = "Add New User"

    vm.newEmptyUser = function(){
        var user = new Object();
        user.firstName = '';
        user.lastName = '';
        user.email = '';
        user.password = '';
        user.role = 'agent';
        user.status = 1;
        user.project = '';
        return user;
    };

    vm.addUser = vm.newEmptyUser();

    vm.resetUserForm = function()
    {
        vm.addUser = vm.newEmptyUser();
    }

    vm.rolesList = [
        {value: 'agent', text: 'Agent'},
        {value: 'admin', text: 'Admin'},
        {value: 'client', text: 'Client'}
    ];

    vm.statusList = [
        {value: 1, text: 'Active'},
        {value: 2, text: 'Inactive'}
    ];

    vm.selectRole = 'agent';
    vm.selectStatus = vm.statusList[0].value;

    vm.addUser.role = 'agent'


    vm.projectsList = [];
    vm.getProjectsList = function()
    {
        ProjectsService
            .getAllProjects()
            .success(function(data, status) {
                vm.projectsList = data;
                console.log(vm.projectsList)
            }).error(function(err, status) {
                console.log(err);
                console.log(status);
            });
    }

    vm.getProjectsList();

}
