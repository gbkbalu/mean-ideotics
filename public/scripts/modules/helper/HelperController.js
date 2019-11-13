"use strict";
angular
    .module('ideotics')
    .controller('HelperController', HelperController);

HelperController.$inject = ['$scope', '$rootScope', '$location', 'HelperService'];

function HelperController($scope, $rootScope, $location,  HelperService) {

    window.dashboard = true;
    $rootScope.setHeaderglobal(17);

    var vm = this;
    vm.helperText = "";
    vm.enabledForEdit = false;
    vm.addNewHelper = false;

    vm.enableEdit = function ()
    {
        vm.enabledForEdit = true;
    }

    vm.addHelper = function () {
        HelperService.clearSelectedHelper();
        $location.path('/addOrEditHelper');
    }

    vm.helperEdit = false;
    vm.openHelperEditDetails = function () {
        vm.helperEdit = true;
    }


    vm.gridOptions = {
        columnDefs: [
            { field: 'helpercode' , displayName: 'Helper Code',enableHiding:false},
            { field:'description', visible: true, displayName: 'Description'},
            { name: 'Edit',enableHiding:false,enableColumnMenu: false,
                cellTemplate:'<div class="buttons" ><button class="btn btn-primary btn-padding"  ng-click="grid.appScope.helperVM.openHelperEditDetails(row.entity)" style="display:block;margin: auto"><span class="glyphicon glyphicon-edit" aria-hidden="true"></span></button></div>' }
        ],
        enableColumnResizing:true,
        enableHorizontalScrollbar:1,
        multiSelect: false,

        enableRowSelection: false,
        enableRowHeaderSelection: true,


        enablePaging: false,
        enablePaginationControls: false,
        enablePagination:false,
        useExternalPagination: false,
        totalItems: 0,
        paginationPageSizes: [10,25, 50, 100],
        paginationPageSize: 25,
        rowHeight: 35,
        currentPage:1,
        showFooter: true,
        enableGridMenu: true,
        enableSelectAll: true,
        exporterMenuPdf: false, // ADD THIS
        exporterMenuCsv: false,
        exporterCsvFilename: 'myFile.csv',
        exporterCsvLinkElement: angular.element(document.querySelectorAll(".custom-csv-link-location")),
        onRegisterApi: function(gridApi){
            vm.gridApi = gridApi;

            gridApi.pagination.on.paginationChanged($scope, function (newPage, pageSize) {
                vm.getAllUsersByFilter(newPage, pageSize);
            });

            gridApi.selection.on.rowSelectionChanged($scope, function(row){
                vm.helperText = '';
                vm.enabledForEdit = false;
                if(vm.gridApi.selection.getSelectedRows().length>0)
                {
                    vm.helperText = vm.gridApi.selection.getSelectedRows()[0].helpertext;
                }
                HelperService.setSelectedHelper(vm.gridApi.selection.getSelectedRows()[0]);

                if(vm.helperEdit)
                {
                    $location.path('/addOrEditHelper');
                }
            });
        }
    };

    vm.updateHelper = function()
    {
        var selectedRow = vm.gridApi.selection.getSelectedRows()[0];
        HelperService.updateHelperById({_id:selectedRow._id,helpertext:vm.helperText}).success(function(data, status)
        {
            vm.helperText = '';
            vm.gridOptions.data = [];
            vm.gridOptions.data = angular.copy(data);
            vm.gridOptions.totalItems = data.length;
            vm.enabledForEdit = false;
        }).error(function(err, status)
            {
                console.log(err);
            }
        );
    }

    vm.getAllHelpers = function()
    {
        HelperService.getAllHelpers().success(function(data, status)
        {
            vm.gridOptions.data = angular.copy(data);
            vm.gridOptions.totalItems = data.length;
        }).error(function(err, status)
            {
                console.log(err);
            }
        );
    }

    vm.getAllHelpers();

};

