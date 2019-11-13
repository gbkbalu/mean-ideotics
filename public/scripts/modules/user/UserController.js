'use strict';
angular
    .module('ideotics')
    .controller('UserController', UserController);

UserController.$inject = ['uiGridExporterConstants','$http','$localStorage','$rootScope','$scope' ,'$filter','$location', 'UserService','uiGridExporterService','CamerasService','ProjectsService','TeamsService','VideoService'];
function UserController(uiGridExporterConstants,$http,$localStorage, $rootScope, $scope ,$filter, $location, UserService,uiGridExporterService,CamerasService,ProjectsService,TeamsService,VideoService) {

    // window.dashboard === false, terminate polling
    window.dashboard = false;
    $rootScope.setHeaderglobal(1);
    $rootScope.setSortColumnAndOrder('firstName',false);
    $scope.gridOptions = {
        columnDefs: [
            { field: 'firstName' , displayName: 'First Name',enableHiding:false},
            { field:'lastName', visible: false, displayName: 'Last Name'},
            { field: 'email', resizable: true,enableHiding: false},
            { field: 'password', visible: false },
            { field: 'role',enableHiding:false,
                cellTemplate: '<div class="ui-grid-cell-contents">{{grid.appScope.userVM.showRole(row.entity)}}</div>'},
            { field: 'active' ,enableHiding:false, displayName: 'Active',
                cellTemplate: '<div class="ui-grid-cell-contents">{{grid.appScope.userVM.showActive(row.entity)}}</div>'},
            { field: 'isOnline',
                cellTemplate: '<div class="ui-grid-cell-contents">{{grid.appScope.userVM.checkIsOnline(row.entity)}}</div>'},
            { field: 'team.teamName',enableHiding:false, displayName: 'Team' },
            { field: 'project', displayName: 'Project' ,
                cellTemplate: '<div class="ui-grid-cell-contents">{{grid.appScope.userVM.showProject(row.entity)}}</div>'},
            { field: 'camera.cameracode' ,visible:false, displayName: 'Camera'},
            { name: 'Edit',enableHiding:false,enableColumnMenu: false,
                cellTemplate:'<div class="buttons" ><button class="btn btn-primary btn-padding"  ng-click="grid.appScope.userVM.openUserEditDetails(row.entity)"><span class="glyphicon glyphicon-edit" aria-hidden="true"></span></button></div>' },
            { name: 'LogOut',visible:true,
                cellTemplate:'<div class="buttons" ><button class="btn btn-primary btn-padding" ng-if="row.entity.role != \'admin\' && row.entity.isOnline "  ng-click="grid.appScope.userVM.logOutByAdmin(row.entity)"><span class="glyphicon glyphicon-log-out" aria-hidden="true"></span></button></div>' }
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
        exporterCsvFilename: 'myFile.csv',
        exporterMenuCsv: false,
        exporterMenuAllData:false,
        exporterMenuVisibleData:false,
        exporterCsvLinkElement: angular.element(document.querySelectorAll(".custom-csv-link-location")),
        onRegisterApi: function(gridApi){
            $scope.gridApi = gridApi;

            gridApi.pagination.on.paginationChanged($scope, function (newPage, pageSize) {
                vm.getAllUsersByFilter(newPage, pageSize);
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

    var vm = this;

    vm.export = function(){
        var myElement = angular.element(document.querySelectorAll(".custom-csv-link-location"));
        $scope.gridApi.exporter.csvExport( 'all', 'all', myElement );
    };

    vm.downloadCurrentGridData = function()
    {
        var myElement = angular.element(document.querySelectorAll(".custom-csv-link-location"));
        $scope.gridOptions.exporterCsvFilename = "users.csv";
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
            hiddenElement.download = 'users.csv';
            hiddenElement.click();
        });
    }


    vm.users = [];
    vm.errorMessage = '';

    vm.isAdmin = false;
    if($localStorage.user.role == 'admin')
    {
        vm.isAdmin = true;
    }else
    {
        $scope.gridOptions.columnDefs.splice(10,1);
    }

    // Init
//	getAllUsers();

    vm.usersOriginalList = [];
    vm.userObjList = [];

    vm.getAllUsers = function () {
        UserService
            .getUsers()
            .success(function(data, status) {
                vm.users = data;
                for(var len=0;len<vm.users.length;len++)
                {
                    vm.users[len].checked = false;
                    vm.users[len].color = '';

                    var key = vm.users[len].userId;
                    vm.userObjList['key'+key] = vm.users[len].firstName;
                }
                vm.usersOriginalList = angular.copy(vm.users);
                $scope.gridOptions.data = angular.copy(vm.users);
                $scope.gridOptions.totalItems = 1000;
            }).error(function(err, status) {
                // TBD
            });
    };

    vm.getAllUsersByFilter = function (currentPage,pageSize)
    {
        //vm.users = [];
        var filterObj = {team:vm.selectTeamName,currentPage:currentPage,pageSize:$scope.gridOptions.paginationPageSize};

        if(vm.selectTeamName == '0' || vm.selectTeamName == undefined)
        {
            filterObj.team = '0';
        }

        if($localStorage.user.role == 'reviewer' || $localStorage.user.role === 'superreviewer')
        {
            filterObj.role = ['agent','reviewer'];
        }

        if($localStorage.user.role == 'superreviewer' || $localStorage.user.role === 'superreviewer')
        {
            filterObj.role = ['agent', 'reviewer', 'superreviewer'];
        }

        //$scope.gridOptions.data = [];
        UserService
            .getUsersListByFilterObject(filterObj)
            .success(function(data, status) {
                if(data.resultSet && data.resultSet.length>0)
                {
                    vm.users = data.resultSet;
                    for(var len=0;len<vm.users.length;len++)
                    {
                        vm.users[len].checked = false;
                        vm.users[len].color = '';

                        var key = vm.users[len].userId;
                        vm.userObjList['key'+key] = vm.users[len].firstName;
                    }
                    vm.usersOriginalList = angular.copy(vm.users);
                    $scope.gridOptions.data = angular.copy(vm.users);
                }

                $scope.gridOptions.totalItems = data.totalItemsCount;
            }).error(function(err, status) {
            // TBD
        });
    }

    vm.getAllUsersByFilter(1,25);

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

    vm.groups = [];
    vm.loadGroups = function() {
        return vm.groups.length ? null : $http.get('/groups').success(function(data) {
            vm.groups = data;
        });
    };

    vm.isOnlineFlags = [
        {value: true, text: 'Yes'},
        {value: false, text: 'No'}
    ];

    vm.showRole = function(user) {
        var selected = [];
        if(user.role) {
            selected = $filter('filter')(vm.role, {value: user.role});
        }
        return selected.length ? selected[0].text : 'Not set';
    };

    vm.checkIsOnline = function(user) {
        var selected = [];
        selected = $filter('filter')(vm.isOnlineFlags, {value: user.isOnline});
        return selected.length ? selected[0].text : 'Not set';
    };

    vm.showActive = function(user) {
        var selected = [];
        if(user.active) {
            selected = $filter('filter')(vm.active, {value: user.active});
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
                // vm.users[index] = data.result
                vm.getAllUsers();
            })
            .error(function (err) {

                if(err && err.success === false && err.error)
                {
                    //vm.getAllUsers();
                    showNotificationMessage(err.error,errorType.error);
                }
            });
    };

    vm.selectedUserList = function(user)
    {
        for(var len=0;len<vm.users.length;len++)
        {
            vm.users[len].color = '';
        }
        user.color = 'lightblue';
        user.checked = !user.checked;

        vm.showVideosCountList();
    }

    vm.updateSelection = function(user) {
        user.checked = !user.checked;
    };

    $("#checkAll").change(function () {
        $("input:checkbox").prop('checked', $(this).prop("checked"));

        for(var len=0;len<vm.users.length;len++)
        {
            vm.users[len].checked = $(this).prop("checked");
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

        if(vm.userIdsList.length>0)
        {
            $('#inactiveOrDeleteModal').modal('show',{
                backdrop: true,
                keyboard: false
            });
        }else
        {
            showNotificationMessage('Select at least one user to delete.',errorType.error);
        }
    }

    vm.inActiveOrDelteUsers = function()
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
                text: "Would you like to "+confirmText+" the users. Do you want to continue?",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "Yes, "+confirmText+" it!",
                closeOnConfirm: false
            },
            function(){
                UserService.removeUsersByIdsList({usersList:vm.userIdsList,inactiveOrDelete:vm.activeOrDelete})
                    .success(function(data, status) {
                        swal("Deleted!", "Your imaginary users has been "+confirmMsg+".", "success");
                        vm.getAllUsers();
                    }).error(function(err, status) {
                        console.log(err);
                        console.log(status);
                    });
            });
    }

    vm.logOutByAdmin = function(selecteduser)
    {
        UserService.logoutUserByAdmin(selecteduser)
            .success(function(data, status) {
                vm.getAllUsers();
            }).error(function(err, status) {
            console.log(status);
        });
    }

    vm.selectedUsersList = [];
    function getListOfUserIds()
    {
        vm.userIdsList = [];
        vm.selectedUsersList = [];
        /*for(var len=0;len<vm.users.length;len++)
        {
            if(vm.users[len] && vm.users[len].checked)
            {
                vm.userIdsList.push(vm.users[len].userId);
            }
        }*/

        for(var len=0;len<$scope.gridApi.selection.getSelectedRows().length;len++)
        {
            vm.userIdsList.push($scope.gridApi.selection.getSelectedRows()[len].userId);
            vm.selectedUsersList.push($scope.gridApi.selection.getSelectedRows()[len]);
        }
    }

    // remove user
    vm.removeUser = function(index) {
        var id = vm.users[index].id;
        if (!id) return false;
        UserService.removeUser(id)
            .success(function () {
                vm.users.splice(index, 1);
            })
            .error(function () {
                // TODO
            });
    };

    // add user
    vm.addUser = function() {
        UserService.setBroadCastMessage(new Object());
        UserService.clearSelectedUser();
        $location.path('/addOrEditUser');
    };

    vm.openUserEditDetails = function(user)
    {
        UserService.setBroadCastMessage(new Object());
        UserService.setSelectedUser(user);
        $location.path('/addOrEditUser');
    }

    vm.broadCastMessageOpen = function()
    {
        UserService.clearSelectedUser();
        UserService.setBroadCastMessage({broadCast:'open'});
        $location.path('/addOrEditUser');
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

    vm.getProjectsList();

    vm.getTeamsList = function () {
        TeamsService
            .getAllTeams()
            .success(function(data, status) {
                vm.teams = data;
                var dummyVal = {_id:0,teamName: 'Team Name'};
                vm.teams.splice(0,0, dummyVal);
            }).error(function(err, status) {
            // TBD
        });
    };

    vm.selectTeamName = '0' ;
    vm.filterByTeam = function()
    {
        //$scope.gridOptions.paginationPageSize = 100;
        $scope.gridOptions.currentPage = 2;
        vm.getAllUsersByFilter(1,$scope.gridOptions.paginationPageSize);

        /*if(vm.selectTeamName !== 0 && vm.selectTeamName !== '0')
        {
            for(var len=0;len<vm.usersOriginalList.length;len++)
            {
                if(vm.usersOriginalList[len].team && vm.usersOriginalList[len].team != null && vm.selectTeamName === vm.usersOriginalList[len].team._id)
                {
                    vm.users.push(vm.usersOriginalList[len]);
                }
            }
        }else
        {
            vm.users = angular.copy(vm.usersOriginalList);
        }

        $scope.gridOptions.data = angular.copy(vm.users);*/
    }

    vm.resetFilterForm = function ()
    {
        vm.selectTeamName = '0' ;
        vm.filterByTeam();
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
        }
        camera.color = 'lightblue';

        vm.selectedCameraId = camera._id;
        vm.selectedCamToAssign = camera;
        vm.isCamSelected = false;
    }

    vm.selectTeamNameToAssign = '0';
    vm.isTeamSelected = false;
    vm.assignUsersToSelectedTeam = function(teamAssignFlag)
    {
        vm.selectTeamNameToAssign = '0';
        getListOfUserIds();
        var alertMsg = 'Select atleast one user to assign to team.';
        var confirmMsg = "Would you like to unassign user from team. Do you want to continue?";

        if(vm.userIdsList.length>0)
        {
            if(teamAssignFlag)
            {
                $('#assignToTeam').modal('show',{
                    backdrop: true,
                    keyboard: false
                });
            }else
            {
                 swal({
                        title: "Are you sure?",
                        text: confirmMsg,
                        type: "warning",
                        showCancelButton: true,
                        confirmButtonColor: "#DD6B55",
                        confirmButtonText: "Unassign",
                        closeOnConfirm: true
                    },
                    function(){
                        UserService.assignUsersToSelectedTeam(vm.userIdsList,{},false)
                            .success(function(data, status) {
                                if(!(data.success))
                                {
                                    //swal("Assigned!", "Your imaginary videos has been assigned.", "success");
                                    showNotificationMessage(data.msg,errorType.error);
                                }else
                                {
                                    toastr.success('Users Assigned To Selected Team Successfully', 'Done');
                                    vm.getAllUsers();
                                }
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

    vm.assignUsersListToSelectedTeam = function () {
        if(vm.selectTeamNameToAssign === '0')
        {
            vm.isTeamSelected = true;
        }else
        {
            var assignObj = {team:''}
            for(var teamLen=0;teamLen<vm.teams.length;teamLen++)
            {
                if(vm.selectTeamNameToAssign == vm.teams[teamLen]._id)
                {
                    vm.selectedTeamToAssign = vm.teams[teamLen];
                    assignObj.team = vm.teams[teamLen]._id;
                    if(vm.teams[teamLen].project && vm.teams[teamLen].project != undefined)
                    {
                        assignObj.project = vm.teams[teamLen].project._id;
                    }

                    if(vm.teams[teamLen].camera && vm.teams[teamLen].camera != undefined)
                    {
                        assignObj.camera = vm.teams[teamLen].camera._id;
                    }
                    $('#assignToTeam').modal('hide');
                    UserService.assignUsersToSelectedTeam(vm.userIdsList,assignObj,true)
                        .success(function(data, status) {
                            if((!data.success))
                            {
                                showNotificationMessage(data.msg,errorType.error);
                            }else
                            {
                                toastr.success('Users Assigned To Selected Team Successfully', 'Done');
                            }
                            vm.getAllUsers();
                        }).error(function(err, status) {
                        console.log(err);
                        console.log(status);
                    });

                }

            }
        }
    }

    vm.assignUsersToSelectedProject = function(projectAssignFlag)
    {
        vm.processedVideosByUser = false;
        getListOfUserIds();
        var alertMsg = 'Select atleast one user to assign project.';
        var confirmMsg = "Would you like to assign users to project. Do you want to continue?";

        if(!projectAssignFlag)
        {
            alertMsg = 'Select atleast one user to unassign project.';
            confirmMsg = "Would you like to unassign users to project. Do you want to continue?";
        }

        if(vm.userIdsList.length>0)
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
                        text: confirmMsg,
                        type: "warning",
                        showCancelButton: true,
                        confirmButtonColor: "#DD6B55",
                        confirmButtonText: "Yes, delete it!",
                        closeOnConfirm: false
                    },
                    function(){
                        UserService.assignUsersToSelectedProject(vm.userIdsList,vm.selectProjectName,'',projectAssignFlag)
                            .success(function(data, status) {
                                vm.getAllUsers();
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
            UserService.assignUsersToSelectedProject(vm.userIdsList,vm.selectedCamToAssign.project._id,vm.selectedCamToAssign._id,true)
                .success(function(data, status) {
                    vm.getAllUsers();
                }).error(function(err, status) {
                console.log(err);
                console.log(status);
            });
        }
    }

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
        return selected.length ? selected[0].clientname : '';
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
                    vm.camerasList = data;
                    vm.showVideosListByProject(false);
                }).error(function(err, status) {
            });
        }
        vm.selectCameraName='0';
    }


    vm.filterByProject = function()
    {
        vm.users = [];
        if(vm.selectProjectName !== 0 && vm.selectProjectName !== '0')
        {
            for(var len=0;len<vm.usersOriginalList.length;len++)
            {
                if(vm.selectProjectName === vm.usersOriginalList[len].project)
                {
                    vm.users.push(vm.usersOriginalList[len]);
                }
            }
        }else
        {
            vm.users = angular.copy(vm.usersOriginalList);
        }
    }

    vm.assignStatusType = [
        {value: 0, text: 'Not Processed'},
        {value: 1, text: 'Under Processing'},
        {value: 2, text: 'Processed'}
    ];
    vm.selectVideoAssignType = '2';
    vm.selectPopupProjectName = '0';
    vm.selectPopupCameraName = '0';
    vm.showProcessedVideosListByUser = function (showPopup) {
        vm.selectPopupProjectName = '0';
        vm.selectPopupCameraName = '0'
        vm.selectVideoAssignType = '2';
        vm.showVideosListByProject(showPopup);
    }

    vm.processedVideosByUser = false;
    vm.showVideosListByProject = function(showPopup)
    {
        getListOfUserIds();
        if(vm.userIdsList.length == 1)
        {
            vm.processedVideosByUser = true;
            var filterObj = {userId:vm.userIdsList[0],status:vm.selectVideoAssignType,projectId:vm.selectPopupProjectName,cameraId:vm.selectPopupCameraName,teamId:null,assignedCameraId:null};
            if(isVaulueValid(vm.selectedUsersList[0].team))
            {
                filterObj.teamId =  vm.selectedUsersList[0].team._id;
            }
            if(isVaulueValid(vm.selectedUsersList[0].camera))
            {
                filterObj.assignedCameraId =  vm.selectedUsersList[0].camera._id;
            }
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
        }else if(vm.userIdsList.length>1)
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
        if(vm.userIdsList.length == 1)
        {
            vm.showListCount = true;
            var filterObj = {userId:vm.userIdsList[0]}
            VideoService.getCountListByProject(filterObj)
                .success(function(data, status) {
                    vm.projectVideosCount = data;
                }).error(function(err, status) {
                });
        }
    }


}
