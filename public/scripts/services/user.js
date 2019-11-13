'use strict';
angular
    .module('ideotics')
    .factory('UserService', UserService);

UserService.$inject = ['$http'];
function UserService($http) {

    var selectedUserDetails = new Object();
    var broadCastMessage = new Object();
    return {
        getUsers: getUsers,
        removeUser: removeUser,
        saveUser: saveUser,
        removeUsersByIdsList:removeUsersByIdsList,
        assignUsersToSelectedProject:assignUsersToSelectedProject,
        getAssignedUsersListByProject:getAssignedUsersListByProject,
        getAssignedUsersListByFilter:getAssignedUsersListByFilter,

        setSelectedUser : setSelectedUser,
        getSelectedUser : getSelectedUser,
        setBroadCastMessage : setBroadCastMessage,
        getBroadCastMessage : getBroadCastMessage,
        clearSelectedUser:clearSelectedUser,
        getUnassignedUsersList:getUnassignedUsersList,
        assignUsersToSelectedTeam:assignUsersToSelectedTeam,
        logoutUserByAdmin:logoutUserByAdmin,
        getUsersListByFilterObject:getUsersListByFilterObject

    };

    function setSelectedUser(user)
    {
        selectedUserDetails = user;
    }

    function getSelectedUser()
    {
        return selectedUserDetails;
    }

    function setBroadCastMessage(broadCast)
    {
        broadCastMessage = broadCast;
    }

    function getBroadCastMessage()
    {
        return broadCastMessage;
    }

    function clearSelectedUser()
    {
        selectedUserDetails = new Object();
    }

    function getUsers() {
        return $http.get('/api/users');
    }

    function removeUser(id) {
        return $http.delete('api/user/' + id);
    }

    function saveUser(user, userId)
    {
        if(userId === undefined || userId === null || userId === '' || userId === 'undefined')
        {
            return $http.post('/api/users', user);
        }else
        {
            return $http.put('/api/users/' + userId, user);
        }

    }

    function getAssignedUsersListByProject(projectId) {
        return $http.post('/api/users/getAssignedUsersListByProject', {project: projectId});
    }

    function getUsersListByFilterObject(userFilterObj) {
        return $http.post('/api/users/getUsersListByFilter', userFilterObj);
    }

    function getAssignedUsersListByFilter(teamId,type) {
        return $http.post('/api/users/getAssignedUsersListByFilter', {team: teamId,type:type});
    }

    function removeUsersByIdsList(userIdsList)
    {
        return $http.post('/api/users/removeUsersByIdsList', userIdsList);
    }

    function logoutUserByAdmin(userObj)
    {
        return $http.post('/api/user/logoutByAdmin', {sessionId:userObj.sessionId,userId:userObj.userId,isOnline:userObj.isOnline});
    }

    function assignUsersToSelectedProject(userIdsList,projectId,cameraId,projectAssignFlag)
    {
        return $http.post('/api/users/assignUsersToSelectedProject', {userIds:userIdsList,project:projectId,camera:cameraId,projectAssignFlag:projectAssignFlag});
    }

    function getUnassignedUsersList()
    {
        return $http.post('/api/users/getUnassignedUsersList',{});
    }

    function assignUsersToSelectedTeam(userIdsList,assignObj,teamAssignFlag)
    {
        return $http.post('/api/users/assignUsersToSelectedTeam', {userIds:userIdsList,data:assignObj,teamAssignFlag:teamAssignFlag});
    }

}
