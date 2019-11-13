'use strict';
angular
    .module('ideotics')
    .controller('AddTeamController', AddTeamController);

AddTeamController.$inject = ['$scope','$timeout','$rootScope','$location', 'UserService','TeamsService'];
function AddTeamController($scope,$timeout, $rootScope,$location, UserService,TeamsService) {

    window.dashboard = false;
    $rootScope.setHeaderglobal(15);

    var vm = this;
    vm.errorMessage = '';
    vm.pageTitle = "Add New Team";

    vm.statusList = [
        {value: 1, text: 'Active'},
        {value: 2, text: 'Inactive'}
    ];

    vm.newEmptyTeam = function(){
        var team = new Object();
        team.teamName = '';
        team.active = vm.statusList[0].value;
        team.description = '';
        return team;
    };

    vm.addTeam = vm.newEmptyTeam();

    vm.editTeamDetails = TeamsService.getSelectedTeam();

    vm.saveBtnName = 'Save Team';
    vm.showResetBtn = true;
    vm.showIsEdit = false;

    if(!isEmpty(vm.editTeamDetails))
    {
        vm.pageTitle = "Edit Team";
        vm.saveBtnName = 'Update Team';
        vm.showResetBtn = false;
        vm.showIsEdit = true;
        vm.addTeam = angular.copy(vm.editTeamDetails);
    }

    vm.resetTeamForm = function()
    {
        vm.errorMessage = '';
        if(!vm.showIsEdit)
        {
            vm.addTeam = vm.newEmptyTeam();
        }else
        {
            vm.addTeam = angular.copy(vm.editTeamDetails);
        }
    }

    vm.submitted = false;
    vm.successMessage = '';
    vm.saveTeam = function() {
        vm.submitted = true;
        vm.errorMessage = '';
        vm.successMessage = '';

        if($scope.myform.$valid)
        {
            var teamId = '';
            if(vm.showIsEdit)
            {
                teamId = vm.editTeamDetails._id;
            }

            TeamsService.saveTeam(vm.addTeam, teamId)
                .success(function (data, status) {
                    // TODO add id to user object
                    vm.errorMessage = '';

                    if(vm.showIsEdit) {
                        vm.successMessage = 'Team Updated SuccessFully.';
                    }else
                    {
                        vm.successMessage = 'Team Added SuccessFully.';
                    }

                    $timeout(function() {
                        $location.path('/team');
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
        $location.path('/team');
    }
}
