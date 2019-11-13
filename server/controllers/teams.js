var mongoose = require('mongoose')
  , config = require('../config')
  , helper = require('../utils/helper')
  , _ = require('lodash')
	, moment = require('moment')
	, fs = require('fs')

exports.getTeams = function (req, res) {
   mongoose.models.teams.find({}).populate('camera','camerasId cameracode').populate('project','clientsId clientcode').exec( function (err, teams) {
        if (err) {
            return res.status(500).json({error: 'Error with mongoDB connection.'});
        }
         var teamsList = [];
        _.each(teams, function (team) {
            teamsList.push(team);
        });
        return res.status(200).json(teamsList);
    });
};

exports.getActiveTeamsList = function (req, res) {
    mongoose.models.teams.find({active:1}).exec( function (err, teams) {
        if (err) {
            return res.status(500).json({error: 'Error with mongoDB connection.'});
        }
        var teamsList = [];
        _.each(teams, function (team) {
            teamsList.push(team);
        });
        return res.status(200).json(teamsList);
    });
};

exports.saveTeam = function (req, res) {
    var body = req.body;
    var requiredFields = {
        teamName: ''
    };

    var missing = helper.checkMissingFields(requiredFields, body);
    if (missing) {
        return res.status(400).json({ success: false, error: 'missing ' + missing });
    }

    mongoose.models.teams.find({teamName: body.teamName}, function (err, teamsList) {
        if (err) {
            return res.status(500).json({success: false, error: 'Error with mongoDB connection.'});
        }
        if (teamsList.length == 0) {
            var team = new mongoose.models.teams();

            for (prop in req.body) {
                if (prop !== '_id') {
                    team[prop] = req.body[prop];
                }
            }

            team.save(function (err, team) {
                if (!err) {
                    return res.status(200).json(team);
                }
                else {
                    return res.status(500).json({
                        success: false,
                        error: 'Something went wrong, Please try after some time'
                    }, err);
                }
            });
        }else
        {
            return res.status(400).json({ success: false, error: 'Team already exists..! Please choose a different Team code.'});
        }
    });
};

exports.updateTeamById = function (req, res) {
    var body = req.body;
    var requiredFields = {
        _id: ''
    };

    var missing = helper.checkMissingFields(requiredFields, body);
    if (missing) {
        return res.status(400).json({success: false, error: 'missing ' + missing});
    }

    mongoose.models.teams.find({teamName: body.teamName,_id:{$nin:[body._id]}}, function (err, teamsList) {
        if (err) {
            return res.status(500).json({success: false, error: 'Error with mongoDB connection.'});
        }
        if (teamsList.length == 0) {
            mongoose.models.teams.findOne({_id: body._id}, function (err, team) {
                if (err) {
                    return res.status(500).json({success: false, error: 'Error with mongoDB connection.'});
                }

                if (team) {
                    for (prop in req.body.data) {
                        if (prop !== '_id' && prop !== 'project'  && prop !== 'camera') {
                            team[prop] = req.body.data[prop];
                        }
                    }

                    team.save(function (err, camera) {
                        if (!err) {
                            return res.status(200).json({success: true, msg: 'Team Updated succesfully'});
                        }
                        else {
                            return res.status(500).json({
                                success: false,
                                error: 'Something went wrong, Please try after some time'
                            }, err);
                        }
                    });
                }
                else {
                    return res.status(400).json({
                        success: false,
                        error: 'No Team exists with  '
                    });
                }
            });
        }else
        {
            return res.status(400).json({ success: false, error: 'Team already exists..! Please choose a different TeamName.'});
        }
    });
};

exports.removeTeamsByIdList = function (req, res) {
    var body = req.body;
    var returnMsg= {success: true, msg: 'Team Deleted succesfully'};

    if(body.inactiveOrDelete == 1)
    {
        mongoose.models.teams.update({_id:{$in:body.teamsList}},{active:2},{multi: true}, function (err) {
            if (err) {
                console.log(err)
                return res.status(500).json({success: false, error: 'Error with mongoDB connection.'});
            }
            return res.status(200).json(returnMsg);
        });
    }else
    {
        var setOrUnsetProjectForUser = {$unset: {project: '',camera:'',team:'',isOnline:false}};
        mongoose.models.users.update({team:{$in:body.teamsList},role:{$in:['agent','reviewer']}}, setOrUnsetProjectForUser,{multi: true}, function (err) {
            if (err) {
                console.log(err)
                return res.status(500).json({success: false, error: 'Error with mongoDB connection.'});
            }
            mongoose.models.teams.remove({_id:{$in:body.teamsList}}, function (err) {
                if (err) {
                    console.log(err)
                    return res.status(500).json({success: false, error: 'Error with mongoDB connection.'});
                }
                return res.status(200).json({success: true, msg: 'Teams Deleted Successfully'});
            });
        });
    }

}

exports.getTeamsListByFilter = function (req, res) {
    var body = req.body;
    var filterObj = {};

    var recordsPerPage = body.pageSize;
    var pageRecordsCount = (body.currentPage-1) * recordsPerPage;
    mongoose.models.teams.count(filterObj, function(err, count) {
        var resutltObj = new Object();
        resutltObj.totalItemsCount = count;
        mongoose.models.teams.find(filterObj)
            .populate('camera','camerasId cameracode')
            .populate('project','clientsId clientcode')
            .skip(pageRecordsCount)
            .limit(recordsPerPage)
            .exec(function (err, teams)
            {
                if (err)
                {
                    return res.status(500).json({ error: 'Error with mongoDB connection.' });
                }
                resutltObj.resultSet = teams;
                return res.status(200).json(resutltObj);
            });
    });
};

exports.assignTeamToSelectedProject = function (req, res) {
    var body = req.body;
    var teamId = body.teamId;
    var setOrUnsetProject = {$unset: {project: '',camera:''}};
    var setOrUnsetProjectForUser = {$unset: {project: '',camera:'',team:'',isOnline:false}};
    if(body.projectAssignFlag)
    {
        setOrUnsetProject = {$set: {project: body.project,camera:body.camera}};
        setOrUnsetProjectForUser = {$set: {project: body.project,camera:body.camera,team:body.teamId,isOnline:false}};
    }
    mongoose.models.users.find({team:teamId},{'userId':1,'_id':0}).exec(function (err, users) {
        if (err) {
            return res.status(500).json({error: 'Error with mongoDB connection.'});
        }
        var userIds = users.map(function(user) { return user.userId; });
        mongoose.models.videos.find({status:1},{'userId':1,'_id':0})
            .exec(function (err, videoUserIds) {
                if (err) {
                    console.dir(err)
                }
                _.each(videoUserIds, function (videoUser) {
                    if((userIds.indexOf(videoUser.userId) > -1))
                    {
                        userIds.splice(userIds.indexOf(videoUser.userId),1);
                    }
                });
                mongoose.models.teams.update({_id:teamId}, setOrUnsetProject,{multi: true}, function (err) {
                    if (err) {
                        console.log(err)
                        return res.status(500).json({success: false, error: 'Error with mongoDB connection.'});
                    }
                    setOrUnsetProject.team = teamId;
                    mongoose.models.users.update({userId:{$in:userIds},role:{$in:['agent','reviewer']}}, setOrUnsetProjectForUser,{multi: true}, function (err) {
                        if (err) {
                            console.log(err)
                            return res.status(500).json({success: false, error: 'Error with mongoDB connection.'});
                        }
                        return res.status(200).json({success: true, msg: 'videoId updated'});
                    });
                });

            });
    });

}



