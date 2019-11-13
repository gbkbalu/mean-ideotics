'use strict';
angular
    .module('ideotics')
    .controller('TeamController', TeamController);

TeamController.$inject = ['$http','$rootScope','$scope','$filter','$location', 'UserService','CamerasService','ProjectsService','TeamsService','VideoService','uiGridExporterService','uiGridExporterConstants'];
function TeamController($http, $rootScope, $scope, $filter, $location, UserService,CamerasService,ProjectsService,TeamsService,VideoService,uiGridExporterService,uiGridExporterConstants) {

    // window.dashboard === false, terminate polling
    window.dashboard = false;
    $rootScope.setHeaderglobal(15);
    $rootScope.setSortColumnAndOrder('firstName',false);


    var vm = this;
    TeamsService.clearSelectedTeam();
    vm.teams = [];
    vm.errorMessage = '';

    vm.teamsOriginalList = [];
    vm.userObjList = [];

    $scope.gridOptions = {
        columnDefs: [
            { field: 'teamName' ,displayName: 'Team Name',enableHiding:false},
            { field: 'status' ,displayName: 'Status',enableHiding:false,
                cellTemplate: '<div class="ui-grid-cell-contents">{{grid.appScope.teamVM.showActive(row.entity)}}</div>'},
            { field: 'project.clientcode' ,displayName: 'Project',enableHiding:false},
            { field: 'camera.cameracode' ,displayName: 'Camera',enableHiding:false},
            { name: 'Edit',enableHiding:true,enableColumnMenu: false,
                cellTemplate:'<div class="buttons" ><button class="btn btn-primary btn-padding"  ng-click="grid.appScope.teamVM.openTeamEditDetails(row.entity)"><span class="glyphicon glyphicon-edit" aria-hidden="true"></span></button></div>' }
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
                vm.getAllTeamsListByFilter(newPage, pageSize);
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

    vm.export = function(){
        var myElement = angular.element(document.querySelectorAll(".custom-csv-link-location"));
        $scope.gridApi.exporter.csvExport( 'all', 'all', myElement );
    };

    vm.downloadCurrentGridData = function()
    {
        var myElement = angular.element(document.querySelectorAll(".custom-csv-link-location"));
        $scope.gridOptions.exporterCsvFilename = "teams.csv";
        $scope.gridApi.exporter.csvExport('all', 'all',myElement);

        var exportService=uiGridExporterService;
        var grid=$scope.gridApi.grid;
        var fileName="users.csv";

        exportService.loadAllDataIfNeeded(grid, uiGridExporterConstants.ALL, uiGridExporterConstants.VISIBLE).then(function() {
            var exportColumnHeaders = exportService.getColumnHeaders(grid, uiGridExporterConstants.VISIBLE);
            var exportData = exportService.getData(grid, uiGridExporterConstants.ALL, uiGridExporterConstants.VISIBLE);
            var csvContent = exportService.formatAsCsv(exportColumnHeaders, exportData, grid.options.exporterCsvColumnSeparator);
            exportService.downloadFile(fileName, csvContent, grid.options.exporterOlderExcelCompatibility);

            var hiddenElement = document.createElement('a');

            hiddenElement.href = 'data:attachment/csv,' + encodeURI(csvContent);
            hiddenElement.target = '_blank';
            hiddenElement.download = 'teams.csv';
            hiddenElement.click();
        });
    }



    vm.getAllTeams = function () {
        vm.getAllTeamsListByFilter(1,25);
        /*TeamsService
            .getAllTeams()
            .success(function(data, status) {
                vm.teams = data;
                for(var len=0;len<vm.teams.length;len++)
                {
                    vm.teams[len].checked = false;
                    vm.teams[len].color = '';

                    var key = vm.teams[len].userId;
                    vm.userObjList['key'+key] = vm.teams[len].firstName;
                }
                vm.teamsOriginalList = angular.copy(vm.teams);
                $scope.gridOptions.data = angular.copy(vm.teams);
            }).error(function(err, status) {
                // TBD
            });*/
    };

    vm.getAllTeamsListByFilter = function (currentPage,pageSize) {
        var filterObj = {currentPage:currentPage,pageSize:$scope.gridOptions.paginationPageSize};
        TeamsService.getTeamsListByFilter(filterObj)
            .success(function(data, status) {
                if(data && data.resultSet && data.resultSet.length>0) {
                    vm.teams = data.resultSet;
                    for(var len=0;len<vm.teams.length;len++)
                    {
                        vm.teams[len].checked = false;
                        vm.teams[len].color = '';

                        var key = vm.teams[len].userId;
                        vm.userObjList['key'+key] = vm.teams[len].firstName;
                    }
                    vm.teamsOriginalList = angular.copy(vm.teams);
                    $scope.gridOptions.data = angular.copy(vm.teams);
                }
                $scope.gridOptions.totalItems = data.totalItemsCount;

            }).error(function(err, status) {
                // TBD
            });
    };

    vm.getAllTeamsListByFilter(1,25);
    vm.role = [
        {value: 'agent', text: 'Agent'},
        {value: 'admin', text: 'Admin'},
        {value: 'client', text: 'Client'},
        {value: 'reviewer', text: 'Reviewer'}
    ];

    vm.active = [
        {value: 1, text: 'Active'},
        {value: 2, text: 'Inactive'}
    ];

    vm.groups = [];
    vm.loadGroups = function() {
        return vm.groups.length ? null : $http.get('/groups').success(function(data) {
            vm.groups = data;
        });
    };

    vm.showRole = function(user) {
        var selected = [];
        if(user.role) {
            selected = $filter('filter')(vm.role, {value: user.role});
        }
        return selected.length ? selected[0].text : 'Not set';
    };

    vm.showActive = function(team) {
        var selected = [];
        if(team.active) {
            selected = $filter('filter')(vm.active, {value: team.active});
        }
        return selected.length ? selected[0].text : 'Not set';
    };

    vm.checkName = function(data, id) {
        if (id === 2 && data !== 'awesome') {
            return "Username 2 should be `awesome`";
        }
    };

    vm.saveUser = function(data, id) {
        //vm.user not updated yet
        for(var projLen=0;projLen<vm.projects.length;projLen++)
        {
            if(data.client  && data.client === vm.projects[projLen].clientsId)
            {
                data.project = vm.projects[projLen]._id;
                break;
            }
        }
        vm.errorMessage = '';
        UserService.saveUser(data, id)
            .success(function (data, status) {
                // TODO add id to user object
                // vm.teams[index] = data.result
                vm.getAllTeams();
            })
            .error(function (err) {

                if(err && err.success === false && err.error)
                {
                    //vm.getAllTeams();
                    showNotificationMessage(err.error,errorType.error);
                }
            });
    };

    vm.selectedUserList = function(team)
    {
        for(var len=0;len<vm.teams.length;len++)
        {
            vm.teams[len].color = '';
        }
        team.color = 'lightblue';
        team.checked = !team.checked;

        vm.showVideosCountList();
    }

    vm.updateSelection = function(user) {
        user.checked = !user.checked;
    };

    $("#checkAll").change(function () {
        $("input:checkbox").prop('checked', $(this).prop("checked"));

        for(var len=0;len<vm.teams.length;len++)
        {
            vm.teams[len].checked = $(this).prop("checked");
        }
    });

    vm.statusList = [
        {value: 1, text: 'Inactive'},
        {value: 2, text: 'Delete'}
    ];

    vm.activeOrDelete = 1;
    vm.deleteSelectedUsersListByCheckBox = function()
    {
        getListOfUserIds();

        if(vm.teamIdsList.length>0)
        {
            $('#inactiveOrDeleteModal').modal('show',{
                backdrop: true,
                keyboard: false
            });
        }else
        {
            showNotificationMessage('Select atleast one Team to delete.',errorType.error);
        }
    }

    vm.inActiveOrDelteTeams = function()
    {
        var confirmText = "Inactivate";
        var confirmMsg = "inactivated";
        if(vm.activeOrDelete == 2)
        {
            confirmText = "delete";
            confirmMsg = "deleted";
        }
        $('#inactiveOrDeleteModal').modal('hide');
        swal({
                title: "Are you sure?",
                text: "Would you like to "+confirmText+" the Team. Do you want to continue?",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "Yes, "+confirmText+" it!",
                closeOnConfirm: false
            },
            function(){
                TeamsService.removeTeamsByIdList({teamsList:vm.teamIdsList,inactiveOrDelete:vm.activeOrDelete})
                    .success(function(data, status) {
                        swal("Deleted!", "Your imaginary team has been "+confirmMsg+".", "success");
                        vm.getAllTeams();
                    }).error(function(err, status) {
                        console.log(err);
                        console.log(status);
                    });
            });
    }

    vm.selectedTeamToAssign = '';

    function getListOfUserIds()
    {
        vm.teamIdsList = [];

        for(var len=0;len<$scope.gridApi.selection.getSelectedRows().length;len++)
        {
            var selectedVideo = $scope.gridApi.selection.getSelectedRows()[len];

            vm.teamIdsList.push(selectedVideo._id);
            vm.selectedTeamToAssign = selectedVideo;
        }
    }
    // remove user
    vm.removeUser = function(index) {
        var id = vm.teams[index].id;
        if (!id) return false;
        UserService.removeUser(id)
            .success(function () {
                vm.teams.splice(index, 1);
            })
            .error(function () {
                // TODO
            });
    };

    // add user
    vm.addUser = function() {
        UserService.clearSelectedUser();
        $location.path('/addOrEditTeam');
    };

    vm.openTeamEditDetails = function(team)
    {
        TeamsService.setSelectedTeam(team);
        $location.path('/addOrEditTeam');
    }


    vm.projects = [];
    vm.projectsOrgList = [];
    var arrayProjects = [];
    vm.selectProjectName = '0';
    vm.getProjectsList = function()
    {
        var filterObj = {isbase:false};
        ProjectsService
            .getAllProjects(filterObj)
            .success(function(data, status) {
                vm.projects = data;
                for(var projLen =0;projLen<vm.projects.length;projLen++)
                {
                    arrayProjects[vm.projects[projLen].clientsId] = vm.projects[projLen]._id;
                }
                vm.projectsOrgList = angular.copy(vm.projects);

                var dummyVal = {_id:0,clientsId: 0, clientname: 'Project Name'};
                vm.projects.splice(0,0, dummyVal);
            }).error(function(err, status) {
                console.log(err);
                console.log(status);
            });
    }

    vm.selectedProjectId = '';
    vm.selectedProjectToAssign = function(project)
    {
        for(var len=0;len<vm.projectsOrgList.length;len++)
        {
            vm.projectsOrgList[len].color = '';
        }
        project.color = 'lightblue';

        vm.selectedProjectId = project._id;
    }

    vm.selectedCameraId = '';
    vm.selectedCamToAssign = '';
    vm.selectedCameraToAssign = function(camera)
    {
        for(var len=0;len<vm.camerasList.length;len++)
        {
            vm.camerasList[len].color = '';
            vm.camerasList[len].checked = false;
        }
        camera.color = 'lightblue';
        camera.checked = true;

        vm.selectedCameraId = camera._id;
        vm.selectedCamToAssign = camera;
        vm.isCamSelected = false;
    }

    vm.assignUsersToSelectedProject = function(projectAssignFlag)
    {
        vm.processedVideosByUser = false;
        getListOfUserIds();
        var alertMsg = 'Select one Team to assign project.';
        var confirmMsg = "Would you like to assign Team to project. Do you want to continue?";

        if(!projectAssignFlag)
        {
            alertMsg = 'Select One Team to unassign project.';
            confirmMsg = "Would you like to unassign Team to Project. Do you want to continue?";
        }

        if(vm.teamIdsList.length == 1)
        {
            if(vm.selectProjectName === '0' && projectAssignFlag)
            {
                vm.camerasList = [];
                vm.selectPopupProjectName = '0';
                vm.selectedCamToAssign === ''
                $('#videosListOfSelectedProject').modal('show',{
                    backdrop: true,
                    keyboard: false
                });
            }else
            {
                swal({
                        title: "Are you sure?",
                        text: "Would you like to un assign team from assigned project/Camera. Do you want to continue?",
                        type: "warning",
                        showCancelButton: true,
                        confirmButtonColor: "#DD6B55",
                        confirmButtonText: "Yes, UnAssign it!",
                        closeOnConfirm: false
                    },
                    function(){
                        TeamsService.assignTeamToSelectedProject(vm.teamIdsList,'','',false)
                            .success(function(data, status) {
                                vm.getAllTeams();
                            }).error(function(err, status) {
                            console.log(err);
                            console.log(status);
                        });
                    });
            }
        }else
        {
            showNotificationMessage(alertMsg,errorType.error);
        }
    }
    vm.isCamSelected = false;

    vm.assignUsersToSelectedProjectCam = function () {
        if(vm.selectedCamToAssign === '' || vm.selectedCamToAssign == undefined)
        {
            vm.isCamSelected = true;
        }else
        {
            TeamsService.assignTeamToSelectedProject(vm.teamIdsList,vm.selectedCamToAssign.project._id,vm.selectedCamToAssign._id,true)
                .success(function(data, status) {
                    $('#videosListOfSelectedProject').modal('hide');
                    vm.getAllTeams();
                }).error(function(err, status) {
                console.log(err);
                console.log(status);
            });
        }
    }

    vm.role = [
        {value: 'agent', text: 'Agent'},
        {value: 'admin', text: 'Admin'},
        {value: 'client', text: 'Client'},
        {value: 'reviewer', text: 'Reviewer'},
        {value: 'superreviewer', text: 'Super Reviewer'}
    ];

    vm.active = [
        {value: 1, text: 'Active'},
        {value: 2, text: 'Inactive'}
    ];

    vm.showRole = function(user) {
        var selected = [];
        if(user.role) {
            selected = $filter('filter')(vm.role, {value: user.role});
        }
        return selected.length ? selected[0].text : 'Not set';
    };

    vm.showActive = function(user) {
        var selected = [];
        if(user.active) {
            selected = $filter('filter')(vm.active, {value: user.active});
        }
        return selected.length ? selected[0].text : 'Not set';
    };


    vm.userSelectionType = ['Assigned','ToAssign'];
    vm.selectTeamUser = 'Assigned';
    vm.users = [];
    vm.showAssignedUsersList = function(flag)
    {
        if(flag)
            vm.selectTeamUser = 'Assigned';
        getListOfUserIds();
        if(vm.teamIdsList.length == 1)
        {
            vm.users = [];
            UserService.getAssignedUsersListByFilter(vm.teamIdsList[0],vm.selectTeamUser)
                .success(function(data, status) {
                    if(data.length>0)
                    {
                        vm.users = data;
                    }

                    $('#assignedUsersList').modal('show',{
                        backdrop: true,
                        keyboard: false
                    });
                }).error(function(err, status) {
            });
        }else if(vm.teamIdsList.length>1)
        {
            showNotificationMessage('Select Only One Project To Show Users List.',errorType.error);
        }else
        {
            showNotificationMessage('Select Team To Show Users List.',errorType.error);
        }
    }

    vm.changeUserListToAssignOrAssigned = function ()
    {
        vm.users = [];
        if(vm.selectTeamUser == vm.userSelectionType[0])
        {
            vm.showAssignedUsersList(true);
        }else
        {
            vm.showAssignedUsersList(false)
        }
   }

   vm.assignUsersToTeam = function ()
   {
       vm.userIdsList = [];
       for(var len=0;len<vm.users.length;len++)
       {
           if(vm.users[len] && vm.users[len].checked)
           {
               vm.userIdsList.push(vm.users[len].userId);
           }
       }

       if(vm.userIdsList.length == 0)
       {
           showNotificationMessage("Please Select At Least One User Assign To Team.",errorType.error);
       }else
       {
           var assignObj = {team:''};
           assignObj.team = vm.teamIdsList[0];
           if(vm.selectedTeamToAssign.project && vm.selectedTeamToAssign.project != undefined && vm.selectedTeamToAssign.project._id != undefined)
           {
               assignObj.project = vm.selectedTeamToAssign.project._id;
           }

           if(vm.selectedTeamToAssign.camera && vm.selectedTeamToAssign.camera != undefined && vm.selectedTeamToAssign.camera._id != undefined)
           {
               assignObj.camera = vm.selectedTeamToAssign.camera._id;
           }
           $('#assignedUsersList').modal('hide');
           UserService.assignUsersToSelectedTeam(vm.userIdsList,assignObj,true)
               .success(function(data, status) {
                   if((!data.success))
                   {
                       showNotificationMessage(data.msg,errorType.error);
                   }else
                   {
                       toastr.success('Users Assigned To Selected Team Successfully', 'Done');
                   }
               }).error(function(err, status) {
               console.log(err);
               console.log(status);
           });
       }
   }

    $("#checkAllUsers").change(function () {
        $("input[name='selfs']:checkbox").prop('checked', $(this).prop("checked"));

        for(var len=0;len<vm.users.length;len++)
        {
            vm.users[len].checked = $(this).prop("checked");
        }
    });

    vm.showUsersList = function(msg,yesFn, noFn) {
        vm.selectedUserFromList = '';
        var usersListBox = $("#usersListBox");
        usersListBox.find(".message").text(msg);
        usersListBox.find(".yes,.no").unbind().click(function () {
            usersListBox.hide();
        });
        usersListBox.find(".yes").click(yesFn);
        usersListBox.find(".no").click(noFn);
        usersListBox.show();
    }

    vm.showProject = function(user) {
        var selected = [];
        if(user.project && user.project != undefined)
        {
            selected = $filter('filter')(vm.projects, {_id: user.project});
        }
        return selected.length ? selected[0].clientname : 'Not set';
    };

    vm.camerasList = [];
    vm.getCamerasListByProject = function()
    {
        vm.selectedCamToAssign === '';
        if(vm.selectPopupProjectName !== undefined && vm.selectPopupProjectName !== null)
        {
            vm.camerasList = [];
            vm.isCamSelected = false;
            CamerasService
                .getCamerasListByProject(vm.selectPopupProjectName)
                .success(function(data, status) {
                    for(var len=0;len<data.length;len++)
                    {
                        data[len].checked = false;
                    }
                    vm.camerasList = data;
                }).error(function(err, status) {
            });
        }
        vm.selectCameraName='0';
    }


    vm.filterByProject = function()
    {
        vm.teams = [];
        if(vm.selectProjectName !== 0 && vm.selectProjectName !== '0')
        {
            for(var len=0;len<vm.teamsOriginalList.length;len++)
            {
                if(vm.selectProjectName === vm.teamsOriginalList[len].project)
                {
                    vm.teams.push(vm.teamsOriginalList[len]);
                }
            }
        }else
        {
            vm.teams = angular.copy(vm.teamsOriginalList);
        }
    }

    vm.assignStatusType = [
        {value: 0, text: 'Not Processed'},
        {value: 1, text: 'Under Processing'},
        {value: 2, text: 'Processed'}
    ];
    vm.selectVideoAssignType = '2';
    vm.selectPopupProjectName = '0';
    vm.showProcessedVideosListByUser = function (showPopup) {
        vm.selectPopupProjectName = '0';
        vm.selectVideoAssignType = '2';
        vm.showVideosListByProject(showPopup);
    }

    vm.processedVideosByUser = false;
    vm.showVideosListByProject = function(showPopup)
    {
        getListOfUserIds();
        if(vm.teamIdsList.length == 1)
        {
            vm.processedVideosByUser = true;
            var filterObj = {userId:vm.teamIdsList[0],status:vm.selectVideoAssignType,projectId:vm.selectPopupProjectName}
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
        }else if(vm.teamIdsList.length>1)
        {
            showNotificationMessage('Select Only One user To Show Videos List.',errorType.error);
        }else
        {
            showNotificationMessage('Select User To Show Videos List.',errorType.error);
        }
    }

    vm.showListCount = false;
    vm.showVideosCountList = function(showPopup)
    {
        vm.showListCount = false;
        getListOfUserIds();
        if(vm.teamIdsList.length == 1)
        {
            vm.showListCount = true;
            var filterObj = {userId:vm.teamIdsList[0]}
            VideoService.getCountListByProject(filterObj)
                .success(function(data, status) {
                    vm.projectVideosCount = data;
                }).error(function(err, status) {
                });
        }
    }


}

