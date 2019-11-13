"use strict";
angular
    .module('ideotics')
    .controller('AddIpController', AddIpConfigController);

AddIpConfigController.$inject = ['$scope','$timeout','$rootScope','$location', 'IpConfigService'];
function AddIpConfigController($scope,$timeout, $rootScope, $location, IpConfigService) {

    // window.dashboard === false, terminate polling
    window.dashboard = false;
    $rootScope.setHeaderglobal(11);


    var vm = this;
    vm.errorMessage = '';
    vm.pageTitle = "Add New Ip";

    vm.newEmptyIpConfig = function(){
        var ipconfig = new Object();
        ipconfig.startIpAddress = '';
        ipconfig.endIpAddress = '';
        return ipconfig;
    };

    vm.addNewIp = vm.newEmptyIpConfig();

    vm.editIpConfigDetails = IpConfigService.getSelectedIpConfig();

    vm.saveBtnName = 'Save Ip';
    vm.showResetBtn = true;
    vm.showIsEdit = false;

    if(!isEmpty(vm.editIpConfigDetails))
    {
        vm.pageTitle = "Edit Ip";
        vm.saveBtnName = 'Update Ip';
        vm.showResetBtn = false;
        vm.showIsEdit = true;
        vm.addNewIp = angular.copy(vm.editIpConfigDetails);
    }

    vm.resetForm = function()
    {
        vm.submitted = false;
        vm.errorMessage = '';
        if(!vm.showIsEdit)
        {
            vm.addNewIp = vm.newEmptyIpConfig();
        }else
        {
            vm.addNewIp = angular.copy(vm.editIpConfigDetails);
        }
    }

    vm.submitted = false;
    vm.successMessage = '';
    vm.saveIpConfig = function() {

        vm.submitted = true;

        vm.errorMessage = '';
        vm.successMessage = '';

        if($scope.myform.$valid)
        {
            var ipconfigId = '';
            if(vm.showIsEdit)
            {
                ipconfigId = vm.editIpConfigDetails._id;
            }

            if(ValidateIPaddress(vm.addNewIp.startIpAddress," Start ") && ValidateIPaddress(vm.addNewIp.endIpAddress," End "))
            {
                IpConfigService.updateIpconfigById(vm.addNewIp, ipconfigId)
                    .success(function (data, status) {
                        // TODO add id to user object
                        vm.errorMessage = '';

                        if(vm.showIsEdit) {
                            vm.successMessage = 'IpConfig Updated SuccessFully.';
                        }else
                        {
                            vm.successMessage = 'IpConfig Added SuccessFully.';
                        }

                        $timeout(function() {
                            $location.path('/ips');
                        }, 1000);
                    })
                    .error(function (err) {

                        if(err && err.success === false && err.error)
                        {
                            vm.errorMessage = err.error;
                        }
                    });
            }

        }else
        {
            return false;
        }

    };
    $('#answerModal').on('shown.bs.modal', function () {
        $('#myInput').focus()
    })
    function ValidateIPaddress(inputText,text)
    {
        var ipformat = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        if(inputText.match(ipformat))
        {
            return true;
        }
        else
        {
            vm.information = text;

            $('#answerModal').modal('show',{
                backdrop: true,
                keyboard: false
            });
            return false;
        }
    }

    vm.cancelTheForm = function()
    {
        $location.path('/ips');
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
