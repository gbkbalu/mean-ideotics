'use strict';
angular
    .module('ideotics')
    .controller('ProjectsController', ProjectsController);

ProjectsController.$inject = ['$rootScope','$location','$filter','ProjectsService','UserService','VideoService','CamerasService'];
function ProjectsController($rootScope, $location,$filter, ProjectsService,UserService,VideoService,CamerasService) {

    window.dashboard = false;
    $rootScope.setHeaderglobal(3);
    $rootScope.setSortColumnAndOrder('clientsId',false);

    var vm = this;
    vm.projects = [];

    vm.createCatsOfBaseProjectToProject = function()
    {
        getListOfProjectIds();

        if(vm.projectIdsList.length == 1)
        {
            if(vm.selectedClient.isbase)
            {
                showNotificationMessage('Select A Project Other Than Base To Sync From Base.',errorType.error);
            }else
            {
                ProjectsService
                    .createCatsOfBaseProjectToProject(vm.selectedClient._id)
                    .success(function(data, status) {
                        console.log(data);
                    }).error(function(err, status) {
                });
            }
        }else if(vm.projectIdsList.length>1)
        {
            showNotificationMessage('Select Only One Project To Sync Data.',errorType.error);
        }else
        {
            showNotificationMessage('Select Project To Sync Data.',errorType.error);
        }
    }

    vm.users = [];
    vm.showAssignedUsersList = function()
    {
        getListOfProjectIds();
        if(vm.projectIdsList.length == 1)
        {
            if(vm.selectedClient.isbase)
            {
                showNotificationMessage('Select A Project Other Than Base Show Users List.',errorType.error);
            }else
            {
                UserService.getAssignedUsersListByProject(vm.selectedProjLists[0]._id)
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
            }
        }else if(vm.projectIdsList.length>1)
        {
            showNotificationMessage('Select Only One Project To Show Users List.',errorType.error);
        }else
        {
            showNotificationMessage('Select Project To Show Users List.',errorType.error);
        }
    }

    vm.userObjList = {};
    vm.usersList = {};
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

    vm.camerasList = [];
    vm.selectPopupCameraName = '0';
    vm.getCamerasListByProject = function(showPopUp)
    {
        vm.selectedCamToAssign === '';
        getListOfProjectIds();
        if(vm.projectIdsList.length == 1)
        {
            vm.camerasList = [];
            vm.isCamSelected = false;
            CamerasService
                .getCamerasListByProject(vm.selectedProjLists[0]._id)
                .success(function(data, status) {
                    vm.camerasList = data;
                    vm.showVideosListByProject(true);
                }).error(function(err, status) {
                });
        }else if(vm.projectIdsList.length>1)
        {
            showNotificationMessage('Select Only One Project To Show Videos List.',errorType.error);
        }else
        {
            showNotificationMessage('Select Project To Show Videos List.',errorType.error);
        }

        vm.selectCameraName='0';
    }

    vm.showVideosListByProject = function(showPopup)
    {
        getListOfProjectIds();
        if(vm.projectIdsList.length == 1)
        {
            var filterObj = {projectId:vm.selectedProjLists[0]._id,status:vm.selectVideoAssignType,cameraId:vm.selectPopupCameraName}
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
        }else if(vm.projectIdsList.length>1)
        {
            showNotificationMessage('Select Only One Project To Show Videos List.',errorType.error);
        }else
        {
            showNotificationMessage('Select Project To Show Videos List.',errorType.error);
        }
    }

    vm.showListCount = false;
    vm.showVideosCountList = function(showPopup)
    {
        vm.showListCount = false;
        getListOfProjectIds();
        if(vm.selectedProjLists.length == 1)
        {
            vm.showListCount = true;
            if(vm.selectedClient.isbase)
            {

            }else
            {
                var filterObj = {client:vm.selectedProjLists[0].clientsId}
                VideoService.getCountListByProject(filterObj)
                    .success(function(data, status) {
                        console.log(data);
                        vm.projectVideosCount = data;
                    }).error(function(err, status) {
                    });
            }
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

    vm.unAssignUserFromProject = function(user)
    {
        UserService.assignUsersToSelectedProject([user.userId],vm.selectedProjectId,false)
            .success(function(data, status) {
                vm.getUsersListByProject();
            }).error(function(err, status) {
                console.log(err);
                console.log(status);
            });
    }

    vm.getUsersListByProject = function()
    {
        UserService.getAssignedUsersListByProject(vm.selectedProjLists[0]._id)
            .success(function(data, status) {
                if(data.length>0)
                {
                    vm.users = data;
                }
            }).error(function(err, status) {
            });
    }

    vm.createProjectCatsFromBaseProject = function()
    {
        getListOfProjectIds();
        if(vm.projectIdsList.length == 1)
        {
            if(vm.selectedClient.isbase)
            {
                showNotificationMessage('Select A Project Other Than Base To Sync From Base.',errorType.error);
            }else
            {
                ProjectsService
                    .createProjectCatsFromBaseProject(vm.selectedProjLists[0]._id)
                    .success(function(data, status) {
                        console.log(data);
                    }).error(function(err, status) {
                });
            }
        }else if(vm.projectIdsList.length>1)
        {
            showNotificationMessage('Select Only One Project To Sync Data.',errorType.error);
        }else
        {
            showNotificationMessage('Select Project To Sync Data.',errorType.error);
        }
    }

    vm.getAllClients = function () {
        ProjectsService
            .getAllProjects()
            .success(function(data, status) {
                vm.projects = data;
                for(var len=0;len<vm.projects.length;len++)
                {
                    vm.projects[len].checked = false;
                    vm.projects[len].color = '';
                }

            }).error(function(err, status) {
                console.log(err);
                console.log(status);
        });
    };

    vm.saveClient = function(data, id) {

        var keysObj = Object.keys(data);
        for(var len=0;len<keysObj.length;len++)
        {
            if(!data[keysObj[len]])
            {
                data[keysObj[len]] = '';
            }
        }

        ProjectsService
            .updateClientById(data, id)
            .success(function(data, status) {
                vm.getAllClients();
            }).error(function(err, status) {
                console.log(err);
                console.log(status);
            });
    };

    // remove user
    vm.removeClient = function(index) {
        var id = vm.projects[index].id;
        if (!id) return false;
        ProjectsService.removeProject(id)
            .success(function () {
                vm.projects.splice(index, 1);
            })
            .error(function () {
                // TODO
            });
    };

    // add new project
    vm.addClient = function() {
        ProjectsService.clearSelectedProject();
        $location.path('/addOrEditClient');
    };

    //edit existing project
    vm.openProjectEditDetails = function(client)
    {
        ProjectsService.setSelectedProject(client);
        $location.path('/addOrEditClient');
    }

    vm.selectedClient = '';
    vm.selectedProjectFromList = function(client)
    {
        for(var len=0;len<vm.projects.length;len++)
        {
            vm.projects[len].color = '';
        }
        client.color = 'lightblue';
        client.checked = !client.checked;

        vm.selectedClient = client;
        vm.showVideosCountList();
    }

    vm.updateSelection = function(client) {
        client.checked = !client.checked;
    };

    $("#checkAll").change(function () {
        $("input:checkbox").prop('checked', $(this).prop("checked"));

        for(var len=0;len<vm.projects.length;len++)
        {
            vm.projects[len].checked = $(this).prop("checked");
        }
    });

    vm.deleteSelectedClientsListByCheckBox = function()
    {
        getListOfProjectIds();

        if(vm.projectIdsList.length == 1)
        {
            swal({
                    title: "Are you sure?",
                    text: "Would you like to delete the projects. Do you want to continue?",
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#DD6B55",
                    confirmButtonText: "Yes, delete it!",
                    closeOnConfirm: false
                },
                function(){
                    ProjectsService.removeClientsByIdList(vm.deleteProjectIdsList)
                        .success(function(data, status) {
                            if(!data.success)
                            {
                                showNotificationMessage(data.error);
                            }else {
                                swal("Deleted!", "Your imaginary project has been deleted.", "success");
                                vm.getAllClients();
                            }
                        }).error(function(err, status) {
                        console.log(err);
                        console.log(status);
                    });
                });
        }else
        {
            showNotificationMessage('Select one project to delete.',errorType.error);
        }
    }

    function getListOfProjectIds()
    {
        vm.projectIdsList = [];
        vm.deleteProjectIdsList = [];
        vm.selectedProjLists = [];
        for(var len=0;len<vm.projects.length;len++)
        {
            if(vm.projects[len] && vm.projects[len].checked)
            {
                vm.projectIdsList.push(vm.projects[len]._id);
                vm.selectedProjLists.push(vm.projects[len]);
                if(!vm.projects[len].isbase)
                {
                    vm.deleteProjectIdsList.push(vm.projects[len]._id);
                }
            }
        }
    }
}
