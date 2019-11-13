'use strict';
angular
    .module('ideotics')
    .factory('TeamsService', TeamsService);

TeamsService.$inject = ['$http'];
function TeamsService($http) {

    var selectedTeamDetails = new Object();

    return {
        getAllTeams: getAllTeams,
        getActiveTeamsList:getActiveTeamsList,
        saveTeam:saveTeam,
        removeTeamsByIdList:removeTeamsByIdList,
        assignTeamToSelectedProject:assignTeamToSelectedProject,
        setSelectedTeam : setSelectedTeam,
        getSelectedTeam : getSelectedTeam,
        clearSelectedTeam:clearSelectedTeam,
        getTeamsListByFilter:getTeamsListByFilter
    };

    function setSelectedTeam(team)
    {
        selectedTeamDetails = team;
    }

    function getSelectedTeam()
    {
        return selectedTeamDetails;
    }

    function clearSelectedTeam()
    {
        selectedTeamDetails = new Object();
    }

    function getAllTeams() {
        return $http.get('/api/teams');
    };

    function getActiveTeamsList() {
        return $http.get('/api/teams/getActiveTeamsList');
    };

    function removeTeamsByIdList(teamsIdsList)
    {
        return $http.post('/api/teams/removeTeamsByIdList', teamsIdsList);
    }

    function getTeamsListByFilter(filterObject)
    {
        return $http.post('/api/teams/getTeamsListByFilter', filterObject);
    }

    function saveTeam(data, _id) {

        data = setUndefinedToEmpty(data);
        if(_id !== '' && _id !== 'undefined' && _id !== undefined && _id !== null )
        {
            return $http.post('/api/teams/updateTeamById', {_id: _id, data: data});
        }
        else
        {
            return $http.post('/api/teams', data);
        }
    }

    function assignTeamToSelectedProject(teamIdsList,projectId,cameraId,projectAssignFlag)
    {
        return $http.post('/api/teams/assignTeamToSelectedProject', {teamId:teamIdsList[0],project:projectId,camera:cameraId,projectAssignFlag:projectAssignFlag});
    }

}

