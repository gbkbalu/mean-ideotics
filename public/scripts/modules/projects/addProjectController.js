'use strict';
angular
    .module('ideotics')
    .controller('AddProjectController', AddProjectController);

AddProjectController.$inject = ['$scope','$timeout','$rootScope','$location', 'ProjectsService','CamerasService'];
function AddProjectController($scope,$timeout, $rootScope, $location, ProjectsService,CamerasService) {

    // window.dashboard === false, terminate polling
    window.dashboard = false;
    $rootScope.setHeaderglobal(3);


    var vm = this;
    vm.errorMessage = '';
    vm.pageTitle = "Add New Project";

    vm.newEmptyProject = function(){
        var client = new Object();
        client.clientcode = '';
        client.clientname = '';
        client.location = '';
        client.bucket = 'ideotics-ideocap';
        client.destFolder = '';
        client.isbase = false;
        return client;
    };

    vm.addProject = vm.newEmptyProject();

    vm.editProjectDetails = ProjectsService.getSelectedProject();

    vm.saveBtnName = 'Save Project';
    vm.showResetBtn = true;
    vm.showIsEdit = false;

    if(!isEmpty(vm.editProjectDetails))
    {
        vm.pageTitle = "Edit Project";
        vm.saveBtnName = 'Update Project';
        vm.showResetBtn = false;
        vm.showIsEdit = true;
        vm.addProject = angular.copy(vm.editProjectDetails);
    }

    vm.changingClientCode = function ()
    {
        if(!vm.showIsEdit)
        {
            vm.addProject.destFolder = angular.copy(vm.addProject.clientcode)+'/';
            vm.addProject.clientDestFolder = angular.copy(vm.addProject.clientcode)+'/';
            if(vm.addProject.clientcode == undefined)
            {
                vm.addProject.destFolder = "";
                vm.addProject.clientDestFolder = "";
            }
        }
    }

    vm.resetForm = function()
    {
        vm.submitted = false;
        vm.errorMessage = '';
        if(!vm.showIsEdit)
        {
            vm.addProject = vm.newEmptyProject();
        }else
        {
            vm.addProject = angular.copy(vm.editProjectDetails);
        }
    }

    vm.submitted = false;
    vm.successMessage = '';
    vm.saveClient = function() {
        //vm.user not updated yet
        vm.submitted = true;

        vm.errorMessage = '';
        vm.successMessage = '';

        if($scope.myform.$valid)
        {
            var clientId = '';
            if(vm.showIsEdit)
            {
                var clientId = vm.editProjectDetails._id;
            }

            ProjectsService.updateClientById(vm.addProject, clientId)
                .success(function (data, status) {
                    // TODO add id to user object
                    vm.errorMessage = '';

                    if(vm.showIsEdit) {
                        vm.successMessage = 'Project Updated SuccessFully.';
                    }else
                    {
                        vm.successMessage = 'Project Added SuccessFully.';
                    }
                    $timeout(function() {
                        //$location.path('/projects');
                        CamerasService.clearSelectedCamera();
                        $location.path('/addOrEditCamera');
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
        $location.path('/projects');
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
}
