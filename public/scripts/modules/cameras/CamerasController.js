'use strict';
angular
    .module('ideotics')
    .controller('CamerasController', CamerasController);

CamerasController.$inject = ['uiGridExporterConstants','uiGridExporterService','$q','$rootScope','$timeout','$localStorage','$location','$interval','$http','$scope','$filter', 'CamerasService','blockUI','EventService','VideoService','ProjectsService','UserService','AwsService'];
function CamerasController(uiGridExporterConstants,uiGridExporterService,$q,$rootScope,$timeout, $localStorage,$location,$interval,$http,$scope, $filter, CamerasService,blockUI,EventService,VideoService,ProjectsService,UserService,AwsService) {

    window.dashboard = false;
    $rootScope.setHeaderglobal(4);

    var vm = this;
    vm.helperText ="Helper Text";
    vm.camerasList = [];
    vm.copyOfCamerasList = [];

    vm.totalItems = 1000;
    vm.currentPage = 0;

    vm.pageChanged = function()
    {
        alert('page changed:'+vm.currentPage)
    }

    vm.rowCollection = [{firstName:"TEST",lastName:"kk"},{firstName:"TEST",lastName:"kk"},{firstName:"TEST",lastName:"kk"},{firstName:"TEST",lastName:"ll"},{firstName:"TEST",lastName:"mm"},{firstName:"TEST",lastName:"nn"}]

    vm.option = {name: 'video'};
    var interval = '';

    vm.projectOrClientId = 367;
    vm.skipValue = 0;
    vm.submitVideoFromForm = function() {
        var inputObject = {clientOrVideoId:vm.projectOrClientId++,skipValue:vm.skipValue++,option:vm.option.name};
        VideoService
            .syncSubmittedVideosToMysql(inputObject)
            .success(function (data, status) {
                console.log(vm.projectOrClientId)
                //console.log(data);
            });
        if(vm.projectOrClientId == 820)
        {
            //$interval.cancel(interval);
        }
    }

    $scope.gridOptions = {
        columnDefs: [
            { field: 'camerasId' ,displayName: 'Camera Id',enableHiding:false},
            { field: 'cameracode' ,displayName: 'Camera Code',enableHiding:false},
            { field: 'resolution' ,displayName: 'Resolution',enableHiding:false,
                cellTemplate: '<div class="ui-grid-cell-contents">{{grid.appScope.cameraVM.showResolution(row.entity)}}</div>'},
            { field: 'location' ,displayName: 'Camera Location',enableHiding:false},
            { field: 'fps' ,visible:false,displayName: 'FPS',enableHiding:true},
            { field: 'gfps' ,visible:false,displayName: 'GFPS',enableHiding:true},
            { field: 'fks',visible:false ,displayName: 'FKS',enableHiding:true},
            { field: 'fss' ,visible:false,displayName: 'FSS',enableHiding:true},
            { field: 'forwardDuration' ,displayName: 'Forward Duration',enableHiding:true},
            { field: 'isbase' ,displayName: 'Is Base',enableHiding:true},
            { field: 'client' ,displayName: 'Project',enableHiding:false,
                cellTemplate: '<div class="ui-grid-cell-contents">{{grid.appScope.cameraVM.showProject(row.entity)}}</div>'},
            { field: 'image' ,displayName: 'Image',enableHiding:false,
                cellTemplate:'<span class="input-group-addon" ng-click="grid.appScope.cameraVM.showImage(row.entity)"><span class="glyphicon glyphicon-eye-open" aria-hidden="true"></span></span>'},
            { name: 'Edit',enableHiding:true,enableColumnMenu: false,
                cellTemplate:'<div class="buttons" ><button class="btn btn-primary btn-padding"  ng-click="grid.appScope.cameraVM.openCameraEditDetails(row.entity)"><span class="glyphicon glyphicon-edit" aria-hidden="true"></span></button></div>' }
        ],
        exporterSuppressColumns: [ 'Edit' ],
        enableColumnResizing:true,
        enableHorizontalScrollbar:1,
        enableRowSelection: false,
        enableRowHeaderSelection: true,

        enablePaging: true,
        enablePaginationControls: true,
        enablePagination:true,
        useExternalPagination: true,
        totalItems: 0,
        paginationPageSizes: [10,25, 50, 100],
        paginationPageSize: 25,
        rowHeight: 35,
        currentPage:1,
        showFooter: true,

        enableGridMenu: true,
        enableSelectAll: true,
        exporterMenuPdf: false, // ADD THIS
        exporterCsvFilename: 'cameras.csv',
        exporterMenuCsv: false,
        exporterMenuAllData:false,
        exporterMenuVisibleData:false,
        exporterCsvLinkElement: angular.element(document.querySelectorAll(".custom-csv-link-location")),
        onRegisterApi: function(gridApi){
            $scope.gridApi = gridApi;

            gridApi.pagination.on.paginationChanged($scope, function (newPage, pageSize) {
                vm.getAllCamerasByFilter(newPage, pageSize);
            });

            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                vm.selectedCameraList(row.entity)
            });
        },

        gridMenuCustomItems: [{
            title: 'Export All Data As CSV',
            order: 100,
            action: function ($event){
                vm.downloadCurrentGridData();
            }
        }]
    };
    $scope.gridOptions.multiSelect = true;

    vm.isAdmin = false;
    if($localStorage.user.role == 'admin')
    {
        vm.isAdmin = true;
    }else
    {
        $scope.gridOptions.columnDefs.splice(6,1);
    }

    vm.downloadCurrentGridData = function()
    {
        var myElement = angular.element(document.querySelectorAll(".custom-csv-link-location"));
        $scope.gridOptions.exporterCsvFilename = "cameras.csv";
        $scope.gridApi.exporter.csvExport('all', 'all',myElement);

        var exportService=uiGridExporterService;
        var grid=$scope.gridApi.grid;
        var fileName="cameras.csv";

        exportService.loadAllDataIfNeeded(grid, uiGridExporterConstants.ALL, uiGridExporterConstants.VISIBLE).then(function() {
            var exportColumnHeaders = exportService.getColumnHeaders(grid, uiGridExporterConstants.VISIBLE);
            var exportData = exportService.getData(grid, uiGridExporterConstants.ALL, uiGridExporterConstants.VISIBLE);
            var csvContent = exportService.formatAsCsv(exportColumnHeaders, exportData, grid.options.exporterCsvColumnSeparator);
            exportService.downloadFile(fileName, csvContent, grid.options.exporterOlderExcelCompatibility);

            var hiddenElement = document.createElement('a');

            hiddenElement.href = 'data:attachment/csv,' + encodeURI(csvContent);
            hiddenElement.target = '_blank';
            hiddenElement.download = 'cameras.csv';
            hiddenElement.click();
        });
    }

    vm.openCharts = function ()
    {
        $location.path('/charts');
    }

    $scope.randomStacked = function() {
        $scope.stacked = [];
        var types = ['success', 'info', 'warning', 'danger'];

        for (var i = 0, n = Math.floor(Math.random() * 4 + 1); i < n; i++) {
            var index = Math.floor(Math.random() * 4);
            $scope.stacked.push({
                value: Math.floor(Math.random() * 30 + 1),
                type: types[index]
            });
        }
    };

    $scope.randomStacked();
    vm.getAllCameras = function () {
        CamerasService
            .getAllCameras()
            .success(function(data, status) {
                vm.camerasList = data;
                for(var len=0;len<vm.camerasList.length;len++)
                {
                    vm.camerasList[len].checked = false;
                    vm.camerasList[len].color = '';
                }

                vm.copyOfCamerasList = angular.copy(vm.camerasList);
                $scope.gridOptions.data = angular.copy(vm.camerasList);

                vm.filterByProject();
            }).error(function(err, status) {
                console.log(err);
                console.log(status);
        });
    };

    vm.getAllCamerasByFilter = function (currentPage,pageSize)
    {
        var filterObj = {project:vm.selectProjectName,currentPage:currentPage,pageSize:$scope.gridOptions.paginationPageSize};

        CamerasService
            .getCamerasListByFilter(filterObj)
            .success(function(data, status) {
                if(data && data.resultSet && data.resultSet.length>0) {
                    vm.camerasList = data.resultSet;
                    for (var len = 0; len < vm.camerasList.length; len++) {
                        vm.camerasList[len].checked = false;
                        vm.camerasList[len].color = '';
                    }

                    vm.copyOfCamerasList = angular.copy(vm.camerasList);
                    $scope.gridOptions.data = angular.copy(vm.camerasList);
                }
                $scope.gridOptions.totalItems = data.totalItemsCount;

            }).error(function(err, status) {
                // TBD
            });
    }

    vm.getAllCamerasByFilter(1,25);

    vm.configCamsFetched = false;
    vm.getAllBaseConfigCameras = function () {
        if(!vm.configCamsFetched)
        {
            CamerasService
                .getAllBaseConfigCameras()
                .success(function(data, status) {
                    vm.gridOptions.data = data;
                    vm.configCamsFetched = true;
                }).error(function(err, status) {
                console.log(err);
                console.log(status);
            });
        }
    };

    vm.resetFilterForm = function()
    {
        vm.selectProjectName = '0';
        vm.filterByProject();
    }

    vm.showHeatMapForSelectedVideo = function()
    {
        getListOfCameraIds();

        if(vm.cameraIdsList.length == 1)
        {
            EventService.setHeatMapFilterObj({filterObj:{cameraId:vm.cameraIdsList[0]},cameraImgObj:{camImageUrl:vm.cameraSelectedList[0].camImageUrl}});
            $location.path('/heatmap');
        }else
        {
            showNotificationMessage("Please Select Only One Camera to show heat map.");
        }
    }

    vm.updateCatId = '';
    vm.updateSeqIdsForSubCats = function () {
        CamerasService
            .updateSeqIdsForSubCats(vm.updateCatId)
            .success(function(data, status) {

            }).error(function(err, status) {
                console.log(err);
                console.log(status);
            });
    };

    vm.selectProjectName = '0';
    var arrayProjects = [];
    vm.projects = [];
    vm.getProjectsList = function()
    {
        var filterObj = {};
        ProjectsService
            .getAllProjects(filterObj)
            .success(function(data, status) {
                vm.projects = data;
                for(var projLen =0;projLen<vm.projects.length;projLen++)
                {
                    arrayProjects[vm.projects[projLen].clientsId] = vm.projects[projLen]._id;
                }
                var dummyVal = {_id:0,clientsId: 0, clientname: 'Project Name'};
                vm.projects.splice(0,0, dummyVal);
            }).error(function(err, status) {
                console.log(err);
                console.log(status);
            });
    }

    vm.filterByProject = function()
    {
        vm.getAllCamerasByFilter();
    }

    vm.showResolution = function(camera) {
        return camera.width+'PX / '+camera.height+'PX';
    };

    vm.showProject = function(camera) {
        var selected = [];
        if(camera.project)
            selected = $filter('filter')(vm.projects, {_id: camera.project});
        return selected.length ? selected[0].clientname : 'Not set';
    };

    vm.getClientId = function(camera) {
        var selected = [];
        if(camera.project)
            selected = $filter('filter')(vm.projects, {_id: camera.project});
        return selected.length ? selected[0].clientsId : 'Not set';
    };

    vm.startAjax = function() {
        blockUI.start('Loading Text');
    };

    vm.saveCamera = function(data, id) {
        CamerasService
            .updateCameraById(data, id)
            .success(function(data, status) {
                vm.getAllCameras();
            }).error(function(err, status) {
                console.log(err);
                console.log(status);
            });
    };

    vm.selectedCameraList = function(camera)
    {
        for(var len=0;len<vm.camerasList.length;len++)
        {
            vm.camerasList[len].color = '';
        }
        camera.color = 'lightblue';
        camera.checked = !camera.checked;
        vm.showVideosCountList();
    }

    vm.updateSelection = function(camera) {
        camera.checked = !camera.checked;
    };

    $("#checkAll").change(function () {
        $("input:checkbox").prop('checked', $(this).prop("checked"));

        for(var len=0;len<vm.camerasList.length;len++)
        {
            vm.camerasList[len].checked = $(this).prop("checked");
        }
    });

    vm.deleteSelectedCamerasListByCheckBox = function()
    {
        getListOfCameraIds();

        if(vm.delete_Cam_Ids_List.length == 1)
        {
            swal({
                    title: "Are you sure?",
                    text: "You will not be able to recover this camera file!",
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#DD6B55",
                    confirmButtonText: "Yes, delete it!",
                    closeOnConfirm: true
                },
                function(){
                    CamerasService.removeCamerasByIdList({cameraIds:vm.delete_Cam_Ids_List,ids_list:vm.deleteCam_Selected_Ids_List})
                        .success(function(data, status) {
                            if(!data.success)
                            {
                                showNotificationMessage(data.error);
                            }else
                            {
                                //swal("Deleted!", "Your imaginary camera file has been deleted.", "success");
                                toastr.success("Your imaginary camera has been deleted.", 'Done');
                                vm.getAllCameras();
                            }
                        }).error(function(err, status) {
                            if(err && !err.success)
                            {
                                swal(err.error);
                            }
                    });
                });
        }else
        {
            if(vm.delete_Cam_Ids_List.length > 1)
            {
                showNotificationMessage('Select only one camera to delete.');
            }else if(vm.cameraIdsList.length>0)
            {
                showNotificationMessage('Select Non-Base camera to delete or make selected cam IS-BASE false.');
            }
        }
    }

    vm.delete_Cam_Selected_Ids_List = [];
    vm.delete_Cam_Ids_List = [];
    function getListOfCameraIds()
    {
        vm.cameraIdsList = [];
        vm.cameraSelectedList = [];
        vm.deleteCam_Selected_Ids_List = [];
        vm.delete_Cam_Ids_List = [];
        for(var len=0;len<$scope.gridApi.selection.getSelectedRows().length;len++)
        {
            var selectedCameraToDelete = $scope.gridApi.selection.getSelectedRows()[len];

            vm.cameraIdsList.push(selectedCameraToDelete.camerasId);
            vm.cameraSelectedList.push(selectedCameraToDelete);
            if(!selectedCameraToDelete.isbase)
            {
                vm.deleteCam_Selected_Ids_List.push(selectedCameraToDelete._id);
                vm.delete_Cam_Ids_List.push(selectedCameraToDelete.camerasId);
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


    // remove user
    vm.removeCamera = function(index) {
        var id = vm.camerasList[index]._id;
        if (!id)
        {
            vm.camerasList.splice(index, 1);
            return false;
        }
            swal({
                title: "Are you sure?",
                text: "You will not be able to recover this imaginary file!",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "Yes, delete it!",
                closeOnConfirm: false
            },
            function(){
                var cameraData = {_id:vm.camerasList[index]._id};

                CamerasService.removeCamera(vm.camerasList[index]._id)
                    .success(function () {
                        vm.camerasList.splice(index, 1);
                        swal("Deleted!", "Your imaginary file has been deleted.", "success");
                    })
                    .error(function () {
                        // TODO
                    });

            });
    };

    // add Camera

    vm.addCamera = function() {
        CamerasService.clearSelectedCamera();
        $location.path('/addOrEditCamera');
    };

    vm.selectedCamera = '';
    vm.showMoreText = 'Copy From Other';
    vm.copyCatsFromBaseCamera = function(isBaseCameras)
    {
        //vm.getAllBaseConfigCameras();
        getListOfCameraIds();
        if(vm.cameraSelectedList.length == 1)
        {
            vm.selectedCamera = vm.cameraSelectedList[0];
            if(vm.selectedCamera.isbase)
            {
                showNotificationMessage('Select A Camera Other Than Base To Sync From Base.',errorType.error);
            }else
            {
                if(vm.gridApi.selection.getSelectedRows().length>0)
                {
                    vm.gridApi.selection.unSelectRow(vm.gridApi.selection.getSelectedRows()[0]);
                }

                var filterObject = {isbase:true};
                if(!isBaseCameras && vm.showMoreText == 'Copy From Other')
                {
                    filterObject = {isbase:isBaseCameras, _id:{$nin:[vm.selectedCamera._id]}};
                    vm.showMoreText = 'Copy From Base';
                }else
                {
                    vm.showMoreText = 'Copy From Other';
                }

                CamerasService
                    .getAllBaseConfigCamerasByFiltler(filterObject)
                    .success(function(data, status) {
                        vm.gridOptions.data = data;
                        vm.configCamsFetched = true;
                    }).error(function(err, status) {
                        console.log(err);
                        console.log(status);
                    });
                $('#baseCamerasList').modal('show',{
                    backdrop: true,
                    keyboard: false
                });
            }
        }else if(vm.cameraSelectedList.length>1)
        {
            showNotificationMessage('Select Only One Camera To Copy Parameters.',errorType.error);
        }else
        {
            showNotificationMessage('Select One Camera To Copy Parameters.',errorType.error);
        }
    }

    vm.selectedBaseCamera = '';
    vm.gridOptions = {
        columnDefs: [
            { field: 'camerasId' , displayName: 'Camera Id',enableHiding: false},
            { field:'cameracode', displayName: 'Camera Code',enableHiding: false},
            { field: 'cameraname', displayName: 'Camera Name',enableHiding: false},
            { field: 'project.clientname', displayName: 'Project',enableHiding: false}
        ],
        multiSelect: false,
        onRegisterApi: function(gridApi){
            vm.gridApi = gridApi;

            gridApi.selection.on.rowSelectionChanged($scope, function(row){
                if(vm.gridApi.selection.getSelectedRows().length>0)
                {
                    vm.selectedBaseCamera = vm.gridApi.selection.getSelectedRows()[0];
                }
            });

            $interval( function() {
                vm.gridApi.core.handleWindowResize();
            }, 100);
        }
    };

    vm.copyParamsFromSelectedCam = function () {
        if(vm.selectedCamera.camerasId != vm.selectedBaseCamera.camerasId)
        {
            var inputObj = {baseCam:{camera:vm.selectedBaseCamera._id,project:vm.selectedBaseCamera.project._id},destinationCam:{camera:vm.selectedCamera._id,project:vm.selectedCamera.project}}
            CamerasService
                .copyParamsFromSelectedBaseCam(inputObj)
                .success(function(data, status) {
                    $('#baseCamerasList').modal('hide');
                    toastr.success('Parameters Have Been Copied Successfully.', 'Done');
                }).error(function(err, status) {
            });
        }else
        {
            showNotificationMessage('Please Choose a different camera.',errorType.error);
        }
    }

    //edit existing camera
    vm.openCameraEditDetails = function(camera)
    {
        CamerasService.setSelectedCamera(camera);
        $location.path('/addOrEditCamera');
    }

    vm.videoInclude = {hidden:false};
    vm.showCamReportExportType = function()
    {
        vm.videoInclude = {hidden:false};
        getListOfCameraIds();
        vm.fetchResultObject = {};
        if(vm.cameraIdsList.length==1) {
            $('#downloadHiddenCams').modal('show', {
                backdrop: true,
                keyboard: false
            });
        }else if(vm.cameraIdsList.length>1)
        {
            showNotificationMessage("Select Only one Camera To Download Report List.",errorType.error);
        }
        else
        {
            showNotificationMessage("Select Camera To Download Report List.",errorType.error);
        }
    }

    vm.exportData = function ()
    {
        getListOfCameraIds();
        vm.fetchResultObject = {};
        if(vm.cameraIdsList.length==1)
        {
            vm.fetchResultObject = {camera:vm.cameraSelectedList[0]._id,cameraId:vm.cameraSelectedList[0].camerasId,project:vm.cameraSelectedList[0].project
                ,cameracode:vm.cameraSelectedList[0].cameracode,
                clientsId:vm.getClientId(vm.cameraSelectedList[0]),clientname:vm.showProject(vm.cameraSelectedList[0])};
            VideoService.getVideosListByCamera(vm.cameraSelectedList[0].camerasId, vm.videoInclude.hidden)
                .success(function(data, status) {
                    if(data && data.length>0)
                    {
                        vm.fetchResultObject.videoId = data;
                        vm.getReportByVideos();
                    }else
                    {
                        showNotificationMessage("There are no processed videos exists to download report.",errorType.error);
                    }


                }).error(function(err, status) {
                console.log(err);
                console.log(status);
            });
            $('#downloadHiddenCams').modal('hide');
        }else if(vm.cameraIdsList.length>1)
        {
            showNotificationMessage("Select Only one Camera To Download Report List.",errorType.error);
        }
        else
        {
            showNotificationMessage("Select Camera To Download Report List.",errorType.error);
        }
    };

    vm.getReportByVideos = function () {
        var camCode = vm.fetchResultObject.clientname+'_'+vm.fetchResultObject.cameracode;
        $http.post("/api/video/getSubmittedEventToCSVExport",vm.fetchResultObject,{responseType: 'arraybuffer'})
            .then(function(response) {
                var a = document.createElement('a');
                var blob = new Blob([response.data], {'type':"application/octet-stream"});
                a.href = URL.createObjectURL(blob);
                a.download = camCode+".zip";
                a.click();
            });
    }


    $rootScope.setSortColumnAndOrder('camerasId',false);

    vm.userObjList = {};
    vm.usersList ={};
    vm.usersListCopy = {};
    UserService
        .getUsers()
        .success(function(data, status) {
            vm.usersList = data;
            vm.usersListCopy = angular.copy(vm.usersList);

            for(var userLen=0;userLen<vm.usersListCopy.length;userLen++)
            {
                var key = vm.usersListCopy[userLen].userId;
                vm.userObjList['key'+key] = vm.usersListCopy[userLen].firstName;
            }

        }).error(function(err, status) {
            console.log(err);
            console.log(status);
        });

    vm.assignStatusType = [
        {value: 0, text: 'Not Processed'},
        {value: 1, text: 'Under Processing'},
        {value: 2, text: 'Processed'}
    ];
    vm.selectVideoAssignType = '2';

    vm.showVideosListByProject = function(showPopup)
    {
        getListOfCameraIds();
        if(vm.cameraSelectedList.length == 1)
        {
            var filterObj = {cameraId:vm.cameraSelectedList[0]._id,status:vm.selectVideoAssignType}
            VideoService.getVideosListByProject(filterObj)
                .success(function(data, status) {
                    //if(data.length>0)
                    //{
                        vm.videosList = data;
                        for(var len=0;len<vm.videosList.length;len++)
                        {
                            var userListId = vm.videosList[len].userId;
                            vm.videosList[len].userName = vm.userObjList['key'+userListId]
                        }
                    //}

                    if(showPopup)
                    {
                        $('#videosListOfSelectedProject').modal('show',{
                            backdrop: true,
                            keyboard: false
                        });
                    }

                }).error(function(err, status) {
                });
        }else if(vm.camerasList.length>1)
        {
            showNotificationMessage('Select Only One Camera To Show Videos List.')
        }else
        {
            showNotificationMessage('Select Camera To Show Videos List.')
        }
    }

    vm.showListCount = false;
    vm.showVideosCountList = function(showPopup)
    {
        vm.showListCount = false;
        getListOfCameraIds();
        if(vm.cameraSelectedList.length == 1)
        {
            vm.showListCount = true;
            var filterObj = {cameraId:vm.cameraSelectedList[0].camerasId}
            VideoService.getCountListByProject(filterObj)
                .success(function(data, status) {
                    vm.projectVideosCount = data;
                }).error(function(err, status) {
                });
        }
    }

    vm.showImage = function(selectedCamera)
    {
        vm.imageUrl = "https://images-na.ssl-images-amazon.com/images/I/51M0E6J290L._SL1000_.jpg";
        if(isVaulueValid(selectedCamera.bucket) && isVaulueValid(selectedCamera.camImageUrl))
        {
            vm.imageUrl = selectedCamera.camImageUrl;
            //$scope.getCameraImageSignedUrl(selectedCamera);
        }

        $('#popupCameraImage').modal('show',{
            backdrop: true,
            keyboard: false
        });
    }

    var bucket = '';
    var isAwsCredExists = false;

    $scope.getCameraImageSignedUrl = function(selectedCamera)
    {
        $rootScope.loadingAndBlockUI("Loading Camera Image");
        $timeout(function() {
            var paramsObj = {Bucket: selectedCamera.bucket, Key: selectedCamera.camImageUrl, Expires: 100};
            AwsService
                .authenticateUrl({paramsObj:paramsObj})
                .success(function(data, status)
                {
                    if (data.signedUrl)
                    {
                        vm.imageUrl = data.signedUrl;
                    }
                    $rootScope.stopLoadingBlockUI();
                }).error(function(err, status) {
                    console.log(err);
                    console.log(status);
                    $rootScope.stopLoadingBlockUI();
                });
        }, 1000);
    }
}


