var mongoose = require('mongoose') ;
var ObjectID = require('mongodb').ObjectID;
var ObjectId = require('mongodb').ObjectId;

exports.getDashBoardData = function (req, res) {
    var countListObj = {teamsCount:0,usersCount:0,userStatus:{onLine:0,offLine:0},projectCount:0,cameraCount:0,videoCount:0,videosStatus:{NotProcessed:0,UnderProcessing:0,Processed:0}};
    mongoose.models.teams.count({active:1})
        .exec(function (err, teamsCount) {
            if (err) {
               return res.status(500).json({error: 'Error with mongoDB connection.'});
            }
            countListObj.teamsCount = teamsCount;

            mongoose.models.users.aggregate([{$group : {_id : "$isOnline", total : {$sum : 1}}}], function( err, usersCountObj){
                    if (err) {
                        console.log(err)
                        return res.status(500).json({error: 'Error with mongoDB connection.'});
                    }
                    if(usersCountObj && usersCountObj.length>0)
                    {
                        for(iter in usersCountObj)
                        {
                            var indObj = usersCountObj[iter];
                            if(indObj._id == true)
                            {
                                countListObj.userStatus.onLine = indObj.total;
                                countListObj.usersCount = countListObj.usersCount + indObj.total;
                            }else if(indObj._id == false)
                            {
                                countListObj.userStatus.offLine = indObj.total;
                                countListObj.usersCount = countListObj.usersCount + indObj.total;
                            }
                        }
                    }
                    mongoose.models.clients.count({isbase:false})
                        .exec(function (err, projectCount) {
                            if (err) {
                                return res.status(500).json({error: 'Error with mongoDB connection.'});
                            }
                            countListObj.projectCount = projectCount;
                            mongoose.models.cameras.count({})
                                .exec(function (err, cameraCount) {
                                    if (err) {
                                        return res.status(500).json({error: 'Error with mongoDB connection.'});
                                    }
                                    countListObj.cameraCount = cameraCount;
                                    mongoose.models.videos.aggregate([{$group : {_id : "$status", total : {$sum : 1}}}], function( err, videosCountObj){
                                        if (err) {
                                            return res.status(500).json({error: 'Error with mongoDB connection.'});
                                        }

                                        if(videosCountObj && videosCountObj.length>0)
                                        {
                                            for(iter in videosCountObj)
                                            {
                                                var indObj = videosCountObj[iter];
                                                if(indObj._id == 0)
                                                {
                                                    countListObj.videosStatus.NotProcessed = indObj.total;
                                                    countListObj.videoCount = countListObj.videoCount + indObj.total;
                                                }else if(indObj._id == 1)
                                                {
                                                    countListObj.videosStatus.UnderProcessing = indObj.total;
                                                    countListObj.videoCount = countListObj.videoCount + indObj.total;
                                                }else if(indObj._id == 2)
                                                {
                                                    countListObj.videosStatus.Processed = indObj.total;
                                                    countListObj.videoCount = countListObj.videoCount + indObj.total;
                                                }
                                            }
                                        }
                                        return res.status(200).json(countListObj);
                                    })
                                });
                        });

            });
    });
};

exports.getVideosCountsByFilter = function(req, res)
{
    var body = req.body;
    var filterObj ={};
    if(body.project && body.project != null && body.project != undefined && body.project !== 0 && body.project !== '0')
    {
        filterObj.project = ObjectId(body.project);
    }

    if(body.camera && body.camera != null && body.camera != undefined && body.camera !== 0 && body.camera !== '0')
    {
        filterObj.camera = ObjectId(body.camera)
    }

    var countListObj = {videosStatus:{NotProcessed:0,UnderProcessing:0,Processed:0}};
    mongoose.models.videos.aggregate([{$match:filterObj},{$group : {_id : "$status", total : {$sum : 1}}}], function( err, videosCountObj){
        if (err) {
            return res.status(500).json({error: 'Error with mongoDB connection.'});
        }

        if(videosCountObj && videosCountObj.length>0)
        {
            for(iter in videosCountObj)
            {
                var indObj = videosCountObj[iter];
                if(indObj._id == 0)
                {
                    countListObj.videosStatus.NotProcessed = indObj.total;
                }else if(indObj._id == 1)
                {
                    countListObj.videosStatus.UnderProcessing = indObj.total;
                }else if(indObj._id == 2)
                {
                    countListObj.videosStatus.Processed = indObj.total;
                }
            }
        }
        return res.status(200).json(countListObj);
    })
}
exports.getAllUsersCount = function () {
    mongoose.models.users.count({active:1})
        .exec(function (err, usersCount) {
            if (err) {
                return res.status(500).json({error: 'Error with mongoDB connection.'});
            }
            return usersCount;
    });
};

exports.getAllProjectsCount = function (countListObj) {
    mongoose.models.clients.count({})
        .exec(function (err, projectCount) {
            if (err) {
                return res.status(500).json({error: 'Error with mongoDB connection.'});
            }
            countListObj.projectCount = projectCount;
            return exports.getAllCamerasCount(countListObj);
        });
};

exports.getAllCamerasCount = function (countListObj) {
    mongoose.models.cameras.count({})
        .exec(function (err, cameraCount) {
            if (err) {
                return res.status(500).json({error: 'Error with mongoDB connection.'});
            }
            countListObj.cameraCount = cameraCount;
            return exports.getAllCamerasCount(countListObj);
        });
};

exports.getAllCamerasCount = function (countListObj) {
    mongoose.models.videos.count({})
        .exec(function (err, videoCount) {
            if (err) {
                return res.status(500).json({error: 'Error with mongoDB connection.'});
            }
            countListObj.videoCount = videoCount;
            return countListObj;
        });
};


