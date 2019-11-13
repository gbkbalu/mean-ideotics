'use strict';
angular
    .module('ideotics')
    .factory('ProjectsService', ProjectsService);

ProjectsService.$inject = ['$http'];
function ProjectsService($http) {

    var selectedProjectDetails = new Object();
    var projectsList = [];
    var camerasList = [];
    var uploadFormDetails = new Object();
    var videoSelectedProject = new Object();

    return {
        getAllProjects: getAllProjects,
        updateProject:updateProject,
        saveProject:saveProject,
        removeProject: deleteProject,
        updateClientById :updateClientById,
        removeClientsByIdList:removeClientsByIdList,

        setSelectedProject : setSelectedProject,
        getSelectedProject : getSelectedProject,
        clearSelectedProject:clearSelectedProject,
        createCatsOfBaseProjectToProject:createCatsOfBaseProjectToProject,
        createProjectCatsFromBaseProject:createProjectCatsFromBaseProject,

        setProjectsList:setProjectsList,
        getProjectsList:getProjectsList,
        setCamerasList:setCamerasList,
        getCamerasList:getCamerasList,
        setUploadFormDetails:setUploadFormDetails,
        getUploadFormDetails:getUploadFormDetails,
        setVideoSelectedProject:setVideoSelectedProject,
        getVideoSelectedProject:getVideoSelectedProject
    };

    function setVideoSelectedProject(selectedProject)
    {
        videoSelectedProject = selectedProject;
    }

    function getVideoSelectedProject()
    {
        return videoSelectedProject;
    }

    function setUploadFormDetails(formDetails)
    {
        uploadFormDetails = formDetails;
    }

    function getUploadFormDetails()
    {
        return uploadFormDetails;
    }

    function setProjectsList(projects)
    {
        projectsList = projects;
    }

    function getProjectsList()
    {
        return projectsList;
    }

    function setCamerasList(cameras)
    {
        camerasList = cameras;
    }

    function getCamerasList()
    {
        return camerasList;
    }


    function setSelectedProject(project)
    {
        selectedProjectDetails = project;
    }

    function getSelectedProject()
    {
        return selectedProjectDetails;
    }

    function clearSelectedProject()
    {
        selectedProjectDetails = new Object();
    }

    function createCatsOfBaseProjectToProject(projectId) {
        return $http.post('/api/clients/createCatsFromBaseProjectToProject', {project: projectId});
    }

    function createProjectCatsFromBaseProject(projectId) {
        return $http.post('/api/clients/createProjectCatsFromBaseProject', {project: projectId});
    }


    function removeClientsByIdList(clientIdsList)
    {
        return $http.post('/api/clients/removeClientsByIdList', clientIdsList);
    }

    function getAllProjects(isbaseObj) {
        return $http.post('/api/clients',isbaseObj);
    };

    function updateProject(dataValObj) {
        return $http.post('/api/clients/updateClient', dataValObj);
    };

    function saveProject(iconImageUrl,iconName) {
        return $http.post('/api/clients/saveClient', {iconUrl: iconImageUrl,name:iconName});
    };

    function deleteProject(projectId) {
        return $http.get('/api/clients/removeClientById/' + projectId);
    };

    function updateClientById(data, _id) {

        data = setUndefinedToEmpty(data);
        if(_id !== '' && _id !== 'undefined' && _id !== undefined && _id !== null )
        {
            return $http.post('/api/clients/updateClientById', {_id: _id, data: data});
        }
        else
        {
            return $http.post('/api/clients/saveNewClient', data);
        }
    }

}
