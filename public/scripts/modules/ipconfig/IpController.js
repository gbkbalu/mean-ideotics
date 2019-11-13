"use strict";
angular
    .module('ideotics')
    .controller('IPController', IpConfigController);

IpConfigController.$inject = ['$rootScope','$location','blockUI','IpConfigService'];
function IpConfigController($rootScope, $location,blockUI,IpConfigService) {

    window.dashboard = false;
    $rootScope.setHeaderglobal(11);

    var vm = this;
    vm.ipConfigList = [];
    vm.copyOfCamerasList = [];

    vm.projectOrClientId = 1;
    vm.skipValue = 0;

    vm.totalItems = 1000;
    vm.currentPage = 0;

    vm.pageChanged = function()
    {
        showNotificationMessage('page changed:'+vm.currentPage,errorType.error);
    }

    vm.getAllIpconfigs = function () {
        IpConfigService
            .getAllIpconfigs()
            .success(function(data, status) {
                vm.ipConfigList = data;
                for(var len=0;len<vm.ipConfigList.length;len++)
                {
                    vm.ipConfigList[len].checked = false;
                    vm.ipConfigList[len].color = '';
                }
            }).error(function(err, status) {
            console.log(err);
            console.log(status);
        });
    };

    vm.startAjax = function() {
        blockUI.start('Loading Text');
    };

    vm.selectedRecordList = function(selectedRec)
    {
        for(var len=0;len<vm.ipConfigList.length;len++)
        {
            vm.ipConfigList[len].color = '';
        }
        selectedRec.color = 'lightblue';
        selectedRec.checked = !selectedRec.checked;
    }

    vm.updateSelection = function(selectedRec) {
        selectedRec.checked = !selectedRec.checked;
    };

    $("#checkAll").change(function () {
        $("input:checkbox").prop('checked', $(this).prop("checked"));

        for(var len=0;len<vm.ipConfigList.length;len++)
        {
            vm.ipConfigList[len].checked = $(this).prop("checked");
        }
    });

    vm.deleteSelectedIpConfigsByCheckBox = function()
    {
        getListOfSelectedIds();

        if(vm.selectedIdsList.length>0)
        {
            //showNotificationMessage('Select at least one camera to delete.');
             swal({
                    title: "Are you sure?",
                    text: "You will not be able to recover this Ipconfigs file!",
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#DD6B55",
                    confirmButtonText: "Yes, delete it!",
                    closeOnConfirm: false
                },
                function(){
                    IpConfigService.removeIpconfigsByIdList(vm.selectedIdsList)
                        .success(function(data, status) {
                            vm.getAllIpconfigs();
                        }).error(function(err, status) {
                        console.log(err);
                        console.log(status);
                    });
                });
        }else
        {
            showNotificationMessage('Select atleast one Ip to delete.',errorType.error);
        }
    }

    function getListOfSelectedIds()
    {
        vm.selectedIdsList = [];
        for(var len=0;len<vm.ipConfigList.length;len++)
        {
            if(vm.ipConfigList[len] && vm.ipConfigList[len].checked)
            {
                vm.selectedIdsList.push(vm.ipConfigList[len]._id);
            }
        }
    }
    vm.doConfirm = function(msg, yesFn, noFn) {
        var doConfirmBox = $("#confirmBox");
        doConfirmBox.find(".message").text(msg);
        doConfirmBox.find(".yes,.no").unbind().click(function () {
            doConfirmBox.hide();
        });
        doConfirmBox.find(".yes").click(yesFn);
        doConfirmBox.find(".no").click(noFn);
        doConfirmBox.show();
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

    // add IpConfig
    vm.addIpConfig = function() {
        IpConfigService.clearSelectedIpConfig();
        $location.path('/addOrEditIp');
    };

    //edit existing camera
    vm.openIpConfigEditDetails = function(selectedRecToEdit)
    {
        IpConfigService.setSelectedIpConfig(selectedRecToEdit);
        $location.path('/addOrEditIp');
    }
}
