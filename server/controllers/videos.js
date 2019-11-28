var mongoose = require('mongoose'),
    config = require('../config'),
    helper = require('../utils/helper'),
    userStatus = require('../user.status'),
    _ = require('lodash'),
    moment = require('moment'),
    fs = require('fs');

var json2csv = require('json2csv');

var AWS = require('aws-sdk');
var mergeJSON = require("merge-json");
//var eventFields = ['eventId','startTime','endTime','videoId','isConverted','isAnalysed','isDiscarded','Gender','Ethnicity','Dress','Color','Age','Profile','name','dateCreated','othertime','Other','Stocks','Groups','exittime','Path','staffType','shopperClass','special','colorOfTop','hairColor','Group','shape','entrance','exitpath'];
var eventFields = ['join_key', 'auto_video_id', 'video_date_time', 'clientname', 'cameracode', 'cameraId', 'videoId', 'event_start_time', 'starttime_in_sec', 'endtime_in_sec', 'Gender', 'Ethnicity', 'Dress', 'Color', 'Age', 'Profile', 'Group', 'ShopperEntrance', 'name', 'Other', 'Stocks', 'Groups', 'exittime', 'Path', 'staffType', 'ShopperSelect', 'shopperClass', 'special', 'colorOfTop', 'PatternOfTop', 'hairColor', 'height', 'shape', 'entrance', 'exitPath', 'agenttimespentforshopper', 'agenttimespentforother', 'agenttimespentforexit', 'comments', 'xaxis', 'yaxis', 'xendaxis', 'yendaxis'];
//var skuFields = ['eventId','videoId','skutime','Response','Decision','Positions','AisleNumber','locationShelf','interAction'];
var skuFields = ['join_key', 'auto_video_id', 'video_date_time', 'clientname', 'cameracode', 'cameraId', 'videoId', 'skutime', 'Response', 'Decision', 'Positions', 'AisleNumber', 'agenttimespentforsku', 'comments'];
//var staffFields = ['eventId','videoId','stafftime','StfGender','Appearance','LocationShelf','ActionStaff','StartStop'];
var staffFields = ['join_key', 'auto_video_id', 'video_date_time', 'clientname', 'cameracode', 'cameraId', 'videoId', 'stafftime', 'StfGender', 'Appearance', 'LocationShelf', 'ActionStaff', 'StartStop', 'ColorOfTop', 'StaffPtternOfTop', 'StaffDress', 'agenttimespentforstaff', 'comments', 'actionStartTime', 'actionStopTime', 'staffActionTime'];


// Connection URL
var url = 'mongodb://localhost:27017/ideotics';
var EventBus = require('../utils/EventBus');
var recordsPerPage = config.getRecordsPerPage();

exports.newVideo = function(req, res) {
    var body = req.body;
    var requiredFields = {
        name: '',
        url: '',
        client: '',
        camera: ''
    };
    var missing = helper.checkMissingFields(requiredFields, body);
    if (missing) {
        return res.status(400).json({ success: false, error: 'missing ' + missing });
    }
    var maxItemId, videoId;
    var settings = {
        collection: 'videos',
        field: 'videoId',
        query: {}
    };

    helper.getNextId(settings, function(err, nextId) {
        if (err)
            console.log('getNextId Error', err);
        maxItemId = nextId;
        config.setVideoId(nextId);
        mongoose.models.videos.findOne({ name: body.name, camera: body.camera, project: body.project }, function(err, video) {
            if (err) {
                return res.status(500).json({ success: false, error: 'Error with mongoDB connection.' });
            }

            if (!video) {
                video = new mongoose.models.videos();

                for (prop in req.body) {
                    if (prop !== '_id' && prop !== 'videoId') {
                        video[prop] = req.body[prop];
                    }
                }

                video.videoId = maxItemId++;
                video.videoId = config.getVideoId();
                video.userId = 0;
                video.status = 0;

                video.dateCreated = Date.now();
                video.save(function(err, video) {
                    if (!err) {
                        //return res.status(200).json({ success: true, msg: 'Video posted...' });
                        //exports.syncMySqlForNewVideo(video);
                        return res.status(200).json(video);
                    } else {
                        console.log(err)
                        return res.status(500).json({ success: false, error: 'Something went wrong, Please try after some time' }, err);
                    }
                });
            } else {
                return res.status(400).json({ success: false, error: 'Video already exists..! Please choose a different video name. ' });
            }

        });
    });
};

exports.saveUploadedVideoAwsBkp = function(req, res) {
    var body = req.body;
    var requiredFields = {
        name: '',
        url: '',
        client: '',
        camera: ''
    };
    var missing = helper.checkMissingFields(requiredFields, body);
    if (missing) {
        return res.status(200).json({ success: false, error: 'missing ' + missing });
    }

    var video = new mongoose.models.videos(req.body);
    video.videoId = config.getVideoId();
    video.save(function(err, video) {
        if (!err) {
            return res.status(200).json(video);
        } else {
            console.log(err)
            return res.status(500).json({ success: false, error: 'Something went wrong, Please try after some time' }, err);
        }
    });
};

exports.saveUploadedVideoAws = function(req, res) {
    AWS.config = new AWS.Config();
    //AWS.config.update({ accessKeyId: '', secretAccessKey: '' });
    var videosArrList = [];
    var requiredFields = {
        name: '',
        url: '',
        client: '',
        camera: ''
    };

    var bodyList = req.body.videoList;
    var destinationBucket = "ideotics-ideocap";
    for (var len = 0; len < bodyList.length; len++) {
        var missing = helper.checkMissingFields(requiredFields, bodyList[len]);
        if (!missing) {
            var video = new mongoose.models.videos(bodyList[len]);
            video.videoId = config.getVideoId();
            videosArrList.push(video);
        }
        destinationBucket = bodyList[len].bucket;
    }

    if (destinationBucket == 'ideotics-ideocap-in') {
        AWS.config.update({ endpoint: 's3.ap-south-1.amazonaws.com', signatureVersion: 'v4', region: 'ap-south-1', accessKeyId: '', secretAccessKey: '' });
    } else {
        AWS.config.update({ endpoint: 's3.ap-southeast-1.amazonaws.com', region: 'ap-southeast-1', accessKeyId: '', secretAccessKey: '' });
    }

    var bucket = new AWS.S3({ params: { Bucket: destinationBucket, ACL: 'authenticated-read' } });

    var s3objList = req.body.s3objList;
    for (var len = 0; len < s3objList.length; len++) {
        bucket.copyObject(s3objList[len], function(err, data) {
            console.log(err)
        }).on('httpUploadProgress', function(progress) {});
    }

    if (videosArrList.length > 0) {
        mongoose.models.videos.create(videosArrList, function(err) {
            return res.status(200).json("Added SuccessFully");
        });
    } else {
        return res.status(200).json("Added SuccessFully");
    }
};

exports.getVideos = function(req, res) {
    //mongoose.models.videos.find({ status: { $ne: 2 } }).sort({ videoId: 1 }).exec(function (err, videos) {
    mongoose.models.videos.find({}).sort({ videoId: 1 }).exec(function(err, videos) {
        if (err) {
            return res.status(500).json({ error: 'Error with mongoDB connection.' });
        }
        var videosList = [];
        _.each(videos, function(video) {
            videosList.push(video);
        });

        return res.status(200).json(videosList);
    });
};

exports.getVideosListByProject = function(req, res) {

    var body = req.body;
    var inputFilterObj = { status: 2 };

    if (exports.isVaulueValid(body.userId)) {
        inputFilterObj.userId = body.userId;
    }

    if (exports.isVaulueValidWithZero(body.status)) {
        inputFilterObj.status = body.status;
    }

    if (exports.isVaulueValid(body.projectId)) {
        inputFilterObj.project = body.projectId;
    }

    if (exports.isVaulueValid(body.cameraId)) {
        inputFilterObj.camera = body.cameraId;
    }

    if (exports.isVaulueValid(body.teamId) && exports.isVaulueValid(body.assignedCameraId)) {
        if (inputFilterObj.status == '0') {
            if (!exports.isVaulueValid(inputFilterObj.camera) || (exports.isVaulueValid(inputFilterObj.camera) && inputFilterObj.camera == body.assignedCameraId)) {
                delete inputFilterObj.userId;
                inputFilterObj.camera = body.assignedCameraId;
                inputFilterObj.hidden = false;
            }
        }
    }

    mongoose.models.videos.find(inputFilterObj).populate('project').populate('camera').sort({ videoId: 1 }).exec(function(err, videos) {
        if (err) {
            return res.status(500).json({ error: 'Error with mongoDB connection.' });
        }
        var videosList = [];
        _.each(videos, function(video) {
            videosList.push(video);
        });

        return res.status(200).json(videosList);
    });
};

exports.getCountListByProject = function(req, res) {
    var countsList = { unAssigned: 0, assigned: 0, submitted: 0 };

    var filterObj = {};
    for (prop in req.body) {
        filterObj[prop] = req.body[prop];
    }
    mongoose.models.videos.aggregate({ $match: filterObj }, { $group: { _id: "$status", total: { $sum: 1 } } }, function(err, videosCountObj) {
        if (videosCountObj && videosCountObj.length > 0) {
            for (iter in videosCountObj) {
                var indObj = videosCountObj[iter];
                if (indObj._id == 0) {
                    countsList.unAssigned = indObj.total;
                } else if (indObj._id == 1) {
                    countsList.assigned = indObj.total;
                } else if (indObj._id == 2) {
                    countsList.submitted = indObj.total;
                }
            }
        }
        return res.status(200).json(countsList);
    })

};


exports.getAllVideos = function(req, res) {
    mongoose.models.videos.find({ status: { $ne: 2 } }).sort({ videoId: 1 }).exec(function(err, videos) {
        if (err) {
            return res.status(500).json({ error: 'Error with mongoDB connection.' });
        }
        var videosList = [];
        _.each(videos, function(video) {
            videosList.push(video);
        });
        return res.status(200).json(videosList);
    });
};

function insetNulls(record, size) {
    for (var len = 0; len < size; len++) {
        record.push(null);
    }
    return record;
}

exports.syncSubmittedVideosToMysql = function(req, res) {
    var body = req.body;
    if (body.option === 'project') {
        //mongoose.models.videos.find({status: 2}).sort({ videoId: 1 }).exec(function (err, videos) {
        //mongoose.models.videos.find({videoId:{$in:[219,221,235,237,244,261,265,269,270,271,272,273,274,275,276,277,278,283,285,287,288]},status: 2}).sort({ videoId: 1 }).exec(function (err, videos) {
        mongoose.models.videos.find({ client: body.clientOrVideoId, status: 2 }).sort({ videoId: 1 }).exec(function(err, videos) {
            if (err) {
                return res.status(500).json({ error: 'Error with mongoDB connection.' });
            }
            var videosList = [];
            _.each(videos, function(video) {
                videosList.push(video);
            });

            var videosIdsList = [];
            for (var len = 0; len < videosList.length; len++) {
                videosIdsList.push(videosList[len].videoId);
                var obj = { videoId: videosList[len].videoId, skipValue: body.skipValue };
                //EventBus.emit('SyncVideoEventsMongoToMysql', obj);
            }
            return res.status(200).json({ success: 'Success By Project Videos;' });
        });
    } else if (body.option === 'video') {
        mongoose.models.videos.findOne({ videoId: body.clientOrVideoId, status: 2 }, function(err, video) {
            if (err) {
                return res.status(500).json({ success: false, error: 'Error with mongoDB connection.' });
            } else {
                if (video) {
                    EventBus.emit('getEventCountAndSyncMongoToMysqlVideoEvents', body.clientOrVideoId);
                }
                return res.status(200).json({ success: 'Success By Individual Video;' });
            }
        });
    }


}

exports.updateVideo = function(req, res) {
    var body = req.body;
    var requiredFields = {
        videoId: ''
    };

    var missing = helper.checkMissingFields(requiredFields, body);
    if (missing) {
        return res.status(400).json({ success: false, error: 'missing ' + missing });
    }

    mongoose.models.videos.findOne({ videoId: body.videoId }, function(err, video) {
        if (err) {
            return res.status(500).json({ success: false, error: 'Error with mongoDB connection.' });
        }
        mongoose.models.events.find({ videoId: body.videoId, analysis: { $exists: true } }, { _id: 0, analysis: 1, totalTimeSpent: 1, isDiscarded: 1 })
            .exec(function(err, eventsList) {
                if (err) {
                    return res.status(500).json({ error: 'Error with mongoDB connection.' });
                }
                var totalTimeSpent = 0;
                var discardedTimeSpent = 0;
                eventsList.forEach(function(eventObj) {
                    var eventSpentTime = exports.calculateTotalTimeSpent(eventObj);
                    totalTimeSpent = totalTimeSpent + eventSpentTime;
                    if (eventObj.isDiscarded == 1) {
                        discardedTimeSpent = discardedTimeSpent + eventSpentTime;
                    }
                });

                totalTimeSpent = Math.round(totalTimeSpent / 1000);
                discardedTimeSpent = Math.round(discardedTimeSpent / 1000);

                var spentTimeHHmmss = exports.convertToHHmmss(totalTimeSpent);
                var discSpentTimeHHmmss = exports.convertToHHmmss(discardedTimeSpent);
                var netSpentTimeHHmmss = exports.convertToHHmmss(totalTimeSpent - discardedTimeSpent);

                if (video) {
                    mongoose.models.users.update({ userId: video.userId }, { $set: { pausedVideoId: 0, pausedVideoTime: 0 } }, function(err) {
                        userStatus.updateAndCreateLoginSession(req);
                    });
                    for (prop in req.body) {
                        video[prop] = req.body[prop];
                    }
                    video.totalTimeSpent = totalTimeSpent;
                    video.spentTime = spentTimeHHmmss;
                    video.discardedTime = discSpentTimeHHmmss;
                    video.netTime = netSpentTimeHHmmss;
                    video.submittedDate = Date.now();
                    video.docIsModified = true;

                    video.save(function(err, video) {
                        if (!err) {
                            return res.status(200).json({ success: true, msg: 'Video Updated succesfully' });
                        } else {
                            console.log(err)
                            return res.status(500).json({ success: false, error: 'Something went wrong, Please try after some time' }, err);
                        }
                    });
                } else {
                    return res.status(400).json({ success: false, error: 'No Video exists with videoId: ' + body.videoId });
                }
            });
    });
};

var categories = ['START', 'SHOPPERPROFILE', 'SKUBEHAVIOUR', 'STAFFPROFILE', 'G-STAFFBEHAVIOUR', 'S-STAFFBEHAVIOUR', 'C-STAFFBEHAVIOUR'];

exports.calculateTotalTimeSpent = function(obj) {
    var totalTimeSpent = 0;
    if (obj == null || obj == undefined || obj.analysis == null || obj.analysis == undefined) {
        return totalTimeSpent;
    }

    for (var catLen = 0; catLen < categories.length; catLen++) {
        var catObj = obj.analysis[categories[catLen]];
        if (catObj != null && catObj != undefined) {
            if (catLen == 0 || catLen == 1 || catLen == 3) {
                if (catObj && catObj != null && catObj != undefined && catObj.timeSpent && catObj.timeSpent != null && catObj.timeSpent != undefined) {
                    totalTimeSpent = totalTimeSpent + catObj.timeSpent;
                }
            } else {
                for (var subListLen = 0; subListLen < catObj.length; subListLen++) {
                    if (catObj[subListLen] && catObj[subListLen] != null && catObj[subListLen] != undefined && catObj[subListLen].timeSpent && catObj[subListLen].timeSpent != null && catObj[subListLen].timeSpent != undefined) {
                        totalTimeSpent = totalTimeSpent + catObj[subListLen].timeSpent;
                    }
                }
            }
        }
    }
    return totalTimeSpent;
}

exports.calculateAndUpdateAgentsTime = function(req, res) {
    console.log("Testing calculateAndUpdateAgentsTime")
    mongoose.models.videos.find({ status: 2 }, { videoId: 1 }, function(err, videosList) {
        if (err) {
            console.log(err)
            console.log("404")
            return res.status(500).json({ success: false, error: 'Error with mongoDB connection Testing 404.' });
        }
        videosList.forEach(function(selectedVideo) {
            mongoose.models.events.find({ videoId: selectedVideo.videoId, analysis: { $exists: true } }, { _id: 0, analysis: 1, totalTimeSpent: 1, isDiscarded: 1 })
                .exec(function(err, eventsList) {
                    if (err) {
                        console.log(err)
                        console.log("411")
                        return res.status(500).json({ error: 'Error with mongoDB connection 411.' });
                    }
                    var totalTimeSpent = 0;
                    var discardedTimeSpent = 0;
                    eventsList.forEach(function(eventObj) {
                        var eventTimeSpent = exports.calculateTotalTimeSpent(eventObj);
                        totalTimeSpent = totalTimeSpent + eventTimeSpent;
                        if (eventObj.isDiscarded == 1) {
                            discardedTimeSpent = discardedTimeSpent + eventTimeSpent;
                        }
                    });

                    var spentTimeHHmmss = exports.convertToHHmmss(totalTimeSpent);
                    var discSpentTimeHHmmss = exports.convertToHHmmss(discardedTimeSpent);
                    var netSpentTimeHHmmss = exports.convertToHHmmss(totalTimeSpent - discardedTimeSpent);
                    console.log("VideoId:" + selectedVideo.videoId + ":TotalTime Taken::" + totalTimeSpent);
                    mongoose.models.videos.update({ videoId: selectedVideo.videoId }, { $set: { totalTimeSpent: totalTimeSpent, spentTime: spentTimeHHmmss, discardedTime: discSpentTimeHHmmss, netTime: netSpentTimeHHmmss } }, function(err) {});
                });
        });
        return res.status(200).json({ success: true, msg: 'Video Updated succesfully' });
    });
};

exports.convertToHHmmss = function(totalTimeSpent) {
    var hours = ("0" + Math.floor(totalTimeSpent / 3600)).slice(-2);
    var minutes = ("0" + Math.floor((totalTimeSpent % 3600) / 60)).slice(-2);
    var seconds = ("0" + Math.floor((totalTimeSpent % 3600) % 60)).slice(-2);

    return (hours + ":" + minutes + ":" + seconds);
}

exports.hideVideosByVideoIds = function(req, res) {
    var body = req.body;
    var videoArrayObj = body.videoIds;

    if (body._id) {
        videoArrayObj = [body._id];
    }

    mongoose.models.videos.update({ videoId: { $in: videoArrayObj } }, { $set: { hidden: body.hidden } }, { multi: true }, function(err) {

        if (err) {
            return res.status(500).json({ success: false, error: 'Error with mongoDB connection.' });
        } else {
            return res.status(200).json({ success: true, msg: 'Videos hidden succesfully' });
        }
    });
}

exports.setHasEventsVideosByVideoIds = function(req, res) {
    var body = req.body;

    var videoArrayObj = body.videoIds;

    mongoose.models.videos.update({ videoId: { $in: videoArrayObj } }, { $set: { hasMysqlEvents: body.hasMysqlEvents } }, { multi: true }, function(err) {

        if (err) {
            return res.status(500).json({ success: false, error: 'Error with mongoDB connection.' });
        } else {
            return res.status(200).json({ success: true, msg: 'Videos hidden succesfully' });
        }
    });
}


exports.unAssignVideosFromUsers = function(req, res) {
    var body = req.body;

    var videoArrayObj = body.videoIds;

    mongoose.models.users.update({ pausedVideoId: { $in: videoArrayObj } }, { $set: { pausedVideoId: 0, pausedVideoTime: 0 } }, function(err) {});
    //mongoose.models.videos.update({videoId: {$in:videoArrayObj},status:1}, { $set: { status:0,userId:0} }, { multi: true }, function (err) {
    mongoose.models.videos.update({ videoId: { $in: videoArrayObj } }, { $set: { status: 0, userId: 0 } }, { multi: true }, function(err) {
        if (err) {
            return res.status(500).json({ success: false, error: 'Error with mongoDB connection.' });
        } else {
            EventBus.emit('Videos.DeleteVideoEventsByVideoIds', videoArrayObj);
            return res.status(200).json({ success: true, msg: 'Videos UnAssigned succesfully' });
        }
    });
}


exports.getVideosForUserId = function(req, res) {
    var userIds = [];
    userIds.push(0);
    if (req.params.userId !== 'undefined') {
        userIds.push(parseInt(req.params.userId));
    }

    var filterObj = { status: { $ne: 2 }, userId: { $in: userIds }, hidden: false };

    mongoose.models.users.find({ userId: req.params.userId }, { _id: 0, __v: 0 }, function(err, users) {
        if (err) {
            return res.status(500).json({ error: 'Error with mongoDB connection.' });
        }
        var usersList = [];
        _.each(users, function(user) {
            usersList.push(user);
        });
        var user = usersList[0];

        if (user.role === 'agent') {
            filterObj.project = '';
            filterObj.camera = '';

            if (user.project && user.project != undefined) {
                filterObj.project = user.project;
            }

            if (user.camera && user.camera != undefined) {
                filterObj.camera = user.camera;
            }

            if (filterObj.project == '' || filterObj.camera == '') {
                var videosList = [];
                return res.status(200).json(videosList);
            }
        }
        //mongoose.models.videos.find(filterObj, { _id: 0, __v: 0 }).populate("project").populate("camera").sort({ videoId: 1 }).limit(10).exec(function (err, videos) {
        mongoose.models.videos.find(filterObj, { _id: 0, __v: 0 }).populate("project").populate("camera").sort({ videoId: 1 }).exec(function(err, videos) {
            if (err) {
                return res.status(500).json({ error: 'Error with mongoDB connection.' });
            }
            var videosList = [];
            _.each(videos, function(video) {
                videosList.push(video);
            });
            return res.status(200).json(videosList);
        });
    });


};

exports.getCamResult = function(req, res) {
    mongoose.models.videos.find({ cameraId: 174 }, { videoId: 1, cameraId: 1, name: 1 }).exec(function(err, videos) {
        if (err) {
            return res.status(500).json({ error: 'Error with mongoDB connection.' });
        }
        var videosList = [];
        _.each(videos, function(video) {
            videosList.push(video);
        });
        return res.status(200).json(videosList);
    });
};

exports.updatecamvideos = function(req, res) {
    var videosList = req.body.videos;

    _.each(videosList, function(video) {
        mongoose.models.videos.update({ videoId: video.videoId }, {
            $set: {
                startingTime: video.startingTime,
                dateOfTheVideo: video.dateOfTheVideo,
                endingTime: video.endingTime,
                endDateOfTheVideo: video.endDateOfTheVideo
            }
        }, function(err) {

        });
    });
    return res.status(200).json(videosList);

    /*mongoose.models.videos.find({cameraId:174}).exec(function (err, videos) {
        if (err) {
            return res.status(500).json({ error: 'Error with mongoDB connection.' });
        }
        var videosList = [];
        _.each(videos, function (video) {
            var startDateOfVideo = '';var dateOfTheVideo = '';var startingTime = '';var videoClipLen = 0;var containsCheck = "Ideo_";
            var metaDataObj = {}; metaDataObj.FPS =  parseInt(30);metaDataObj.GFPS =  parseInt(30);
            metaDataObj.FK =  parseInt(2);metaDataObj.FS =  parseInt(1);
            var awsFileName = video.name;
            var filename = awsFileName.substr(0, awsFileName.lastIndexOf('.')) || awsFileName;
            var ideoIndex = awsFileName.indexOf(containsCheck)+5;
            var YYYYIndex = ideoIndex;//nameformat.indexOf("YYYY");
            var MMIndex = ideoIndex+4;//nameformat.indexOf("MM");
            var DDIndex = ideoIndex+6;//nameformat.indexOf("DD");

            var HHIndex = ideoIndex+8;//nameformat.indexOf("HH");
            var MIIndex = ideoIndex+10;//nameformat.indexOf("MI");
            var SSIndex = ideoIndex+12;//nameformat.indexOf("SS");

            var lenSubStr = filename.substring(SSIndex+2,filename.lastIndexOf('_'));
            videoClipLen = lenSubStr.substring(lenSubStr.lastIndexOf('_')+1,lenSubStr.length);

            var isToUpload = 0;
            dateOfTheVideo = '';
            startingTime = filename.substring(HHIndex, HHIndex + 2) + ':' + filename.substring(MIIndex, MIIndex + 2) + ':' + filename.substring(SSIndex, SSIndex + 1)+'0';
            if (HHIndex >= 0 && MIIndex >= 0 && SSIndex >= 0) {
                startingTime = startingTime
            }
            if (YYYYIndex >= 0 && MMIndex >= 0 && DDIndex >= 0) {
                startDateOfVideo = filename.substring(YYYYIndex, YYYYIndex + 4) + '-' + filename.substring(MMIndex, MMIndex + 2) + '-' + filename.substring(DDIndex, DDIndex + 2);
                dateOfTheVideo = filename.substring(YYYYIndex, YYYYIndex + 4) + '-' + filename.substring(MMIndex, MMIndex + 2) + '-' + filename.substring(DDIndex, DDIndex + 2);
                dateOfTheVideo = dateOfTheVideo + 'T' + startingTime;
            }
            metaDataObj.StartDate = startDateOfVideo;
            metaDataObj.StartTime = startingTime;
            var clipNumber = parseInt(awsFileName.substring(1, 3));
            metaDataObj.ClipNumber =  parseInt(awsFileName.substring(1, 3));
            var convertedDate = new Date(dateOfTheVideo);
            var fps_fk = metaDataObj.FPS * metaDataObj.FK;
            var Clip_Length =  parseInt(videoClipLen);
            var convertibleSeconds = (metaDataObj.GFPS*Clip_Length*(metaDataObj.FK+metaDataObj.FS))/fps_fk;
            var calculatedSeconds = (clipNumber-1) * convertibleSeconds;
            console.log(dateOfTheVideo)
            convertedDate.setSeconds(convertedDate.getSeconds() + calculatedSeconds);

            var startdate_yyyymmdd = convertedDate.getFullYear()+'-'+ ('0'+(convertedDate.getMonth()+1)).slice(-2)+'-'+ ('0' +convertedDate.getDate()).slice(-2);
            var starttime_hhmiss = ('0'+convertedDate.getHours()).slice(-2)+':'+ ('0'+convertedDate.getMinutes()).slice(-2)+':'+ ('0' +convertedDate.getSeconds()).slice(-2);
            console.log(startdate_yyyymmdd)
            var c_start_date_time = startdate_yyyymmdd + ' ' + starttime_hhmiss;

            convertedDate.setSeconds(convertedDate.getSeconds() + convertibleSeconds);

            var enddate_yyyymmdd = convertedDate.getFullYear()+'-'+ ('0'+(convertedDate.getMonth()+1)).slice(-2)+'-'+ ('0' +convertedDate.getDate()).slice(-2);
            var endtime_hhmiss = ('0'+convertedDate.getHours()).slice(-2)+':'+ ('0'+convertedDate.getMinutes()).slice(-2)+':'+ ('0' +convertedDate.getSeconds()).slice(-2);


            var c_end_date_time = enddate_yyyymmdd + ' ' + endtime_hhmiss;
            video.startingTime = starttime_hhmiss;
            video.dateOfTheVideo = c_start_date_time;
            video.endingTime = endtime_hhmiss;
            video.endDateOfTheVideo = c_end_date_time;
            video.save();
        });
        return res.status(200).json(videosList);
    });*/
};


exports.getAllSubmittedVideos = function(req, res) {

    var userIds = [];
    userIds.push(0);
    if (req.params.userId !== 'undefined') {
        userIds.push(parseInt(req.params.userId));
    }
    mongoose.models.videos.find({ status: 2 }, { _id: 0, __v: 0 }).populate("project").sort({ videoId: 1 }).exec(function(err, videos) {
        if (err) {
            return res.status(500).json({ error: 'Error with mongoDB connection.' });
        }
        var videosList = [];
        _.each(videos, function(video) {
            videosList.push(video);
        });
        return res.status(200).json(videosList);
    });
};

exports.lockVideo = function(req, res) {
    var body = req.body;
    var requiredFields = {
        videoId: ''
    };

    var missing = helper.checkMissingFields(requiredFields, body);
    if (missing) {
        return res.status(400).json({ success: false, error: 'missing ' + missing, fps: video.fps, nskip: video.nskip });
    }

    mongoose.models.videos.findOne({ videoId: body.videoId }).populate("project").exec(function(err, video) {
        if (err) {
            return res.status(500).json({ success: false, error: 'Error with mongoDB connection.', fps: video.fps, nskip: video.nskip });
        }

        if (video.userId !== 0) {
            return res.status(200).json({ success: false, error: 'Video already locked by userId ' + video.userId, fps: video.fps, nskip: video.nskip });
        }

        if (video) {
            for (prop in req.body) {
                video[prop] = req.body[prop];
            }
            var videoStatus = false;
            if (video.status == 0) {
                videoStatus = true;
                video.assignedDate = new Date();
            }

            mongoose.models.users.update({ userId: video.userId }, { $set: { pausedVideoId: video.videoId, pausedVideoTime: 0 } }, function(err) {
                if (videoStatus) {
                    userStatus.updateAndCreateLoginSession(req);
                }
            });

            video.status = 1;
            video.docIsModified = true;
            video.save(function(err, video) {
                if (!err) {
                    return res.status(200).json({ success: true, msg: 'Video Locked succesfully', fps: video.fps, nskip: video.nskip });
                } else {
                    return res.status(500).json({ success: false, error: 'Something went wrong, Please try after some time', fps: video.fps, nskip: video.nskip }, err);
                }
            });
        } else {
            return res.status(400).json({ success: false, error: 'No Video exists with videoId: ' + body.videoId, fps: video.fps, nskip: video.nskip });
        }
    });
};


function updateAllEvents() {
    mongoose.models.events.find({}, function(err, events) {
        if (err) {
            return res.status(500).json({ success: false, error: 'Error with mongoDB connection.' });
        }
        events.forEach(function(event) {

            if (event.bkpanalysis) {
                event.analysis = { "Shopper Profile": { Age: event.bkpanalysis.Age, Gender: event.bkpanalysis.Gender } };
                event.startTime = event.bkpanalysis.startTime;
                event.endTime = event.bkpanalysis.endTime;
            } else {
                event.analysis = { "Shopper Profile": { Age: event.Age, Gender: event.Gender } };
            }

            event.isDiscarded = 0;
            event.isAnalysed = 0;

            event.save();
        });

        //return res.status(200).json({ success: true, msg: 'All Videos unlocked' });
    });
}

// Use connect method to connect to the Server

exports.unlockAllVideos = function(req, res) {

    // Unlock all videos
    mongoose.models.videos.update({}, { $set: { userId: 0, status: 0 } }, { multi: true }, function(err) {

        if (err) {
            return res.status(500).json({ success: false, error: 'Error with mongoDB connection.' });
        }

        // Remove pausedVideoId and pausedVideoTime
        mongoose.models.users.update({}, { $unset: { pausedVideoId: "", pausedVideoTime: "" } }, { multi: true }, function(err) {
            if (err) {
                return res.status(500).json({ success: false, error: 'Error with mongoDB connection.' });
            }

            updateAllEvents();
            return res.status(200).json({ success: true, msg: 'All Videos unlocked' });
            //mongoose.models.events.remove({}, function (err) {
            /*mongoose.models.events.remove({}, function (err) {
                if (err) {
                    return res.status(500).json({ success: false, error: 'Error with mongoDB connection.' });
                }
                return res.status(200).json({ success: true, msg: 'All Videos unlocked' });
            });*/
        });

    });
};

exports.unlockVideo = function(req, res) {
    var videoId = req.params.videoId;
    mongoose.models.videos.update({ videoId: videoId }, { $set: { userId: 0, status: 0 } }, function(err) {
        if (err) {
            return res.status(500).json({ success: false, error: 'Error with mongoDB connection.' });
        }
        return res.status(200).json({ success: true, msg: 'video unlocked' });
    });
};

exports.getVideoStatus = function(req, res) {
    mongoose.models.videos.findOne({ videoId: req.params.videoId }).populate('project').exec(function(err, video) {
        if (err) {
            return res.status(500).json({ success: false, error: 'Error with mongoDB connection.' });
        }
        if (video) {
            return res.status(200).json({ success: true, status: video.status, userId: video.userId });
        } else {
            return res.status(200).json({ success: false, msg: 'Video does not exists' });
        }
    });
};


exports.updateVideoById = function(req, res) {
    var body = req.body;
    var requiredFields = {
        _id: ''
    };

    var missing = helper.checkMissingFields(requiredFields, body);
    if (missing) {
        return res.status(400).json({ success: false, error: 'missing ' + missing });
    }

    mongoose.models.videos.findOne({ _id: body._id }, function(err, video) {
        if (err) {
            return res.status(500).json({ success: false, error: 'Error with mongoDB connection.' });
        }

        if (video) {
            for (prop in req.body.data) {
                if (prop !== '_id') {
                    video[prop] = req.body.data[prop];
                }
            }

            if (video.status === 0) {
                video.userId = 0;
                if (video.videoId !== null && video.videoId !== undefined && video.videoId !== 'undefined' && video.videoId !== '') {
                    //updateAllEventsByEventId(video.videoId);
                    //need a clarity
                }

            }

            video.docIsModified = true;
            video.save(function(err, video) {
                if (!err) {
                    return res.status(200).json({ success: true, msg: 'Video Updated succesfully' });
                } else {
                    return res.status(500).json({ success: false, error: 'Something went wrong, Please try after some time' }, err);
                }
            });
        } else {
            return res.status(400).json({ success: false, error: 'No Video exists with videoId: ' + body.data.videoId });
        }
    });
};


exports.updateVideoByVideoId = function(req, res) {
    var body = req.body;

    mongoose.models.videos.findOne({ videoId: body.videoId }, function(err, video) {
        if (err) {
            return res.status(500).json({ success: false, error: 'Error with mongoDB connection.' });
        }
        for (prop in req.body) {
            if (prop !== '_id' && prop !== 'videoId') {
                if (prop === 'status' && video[prop] == 0 && req.body[prop] == 1) {
                    video.assignedDate = new Date();
                }
                video[prop] = req.body[prop];
            }
        }

        mongoose.models.users.update({ userId: video.userId }, { $set: { pausedVideoId: video.videoId, pausedVideoTime: 0 } }, function(err) {});

        video.docIsModified = true;
        video.save();

        return res.status(200).json({ success: true, msg: 'Vide Updated succesfully' });
    });
};

exports.getAllSubmittedVideosByUserAndDate = function(req, res) {

    var body = req.body;

    var inputFilterObj = { status: 2 };

    if (exports.isVaulueValid(body.selectedDate) && (body.selectedDate).length >= 8) {
        var presentDate = new Date(body.selectedDate);
        presentDate = new Date(presentDate.setDate(presentDate.getDate() + 1));
        var nextDate = presentDate.getFullYear() + '-' + (presentDate.getMonth() + 1) + '-' + presentDate.getDate();

        inputFilterObj.submittedDate = { $gte: body.selectedDate, $lte: nextDate };
    }

    if (exports.isVaulueValid(body.userId)) {
        inputFilterObj.userId = body.userId;
    }

    if (exports.isVaulueValidWithZero(body.status)) {
        inputFilterObj.status = body.status;
    }

    if (exports.isVaulueValid(body.client)) {
        inputFilterObj.client = body.client;
    }

    if (exports.isVaulueValid(body.camera)) {
        inputFilterObj.cameraId = body.camera;
    }

    if (exports.isVaulueValidWithZero(body.hidden)) {
        if (body.hidden === 0 || body.hidden === '0') {
            inputFilterObj.hidden = true;
        } else if (body.hidden === 1 || body.hidden === '1') {
            inputFilterObj.hidden = false;
        }
    }

    var recordsPerPage = 20;
    if (body.pageSize) {
        recordsPerPage = body.pageSize;
    }
    var pageRecordsCount = (body.pageNum - 1) * recordsPerPage;
    mongoose.models.videos.count(inputFilterObj, function(err, count) {
        var resutltObj = new Object();
        resutltObj.recordsCount = count;
        //.sort({submittedDate:-1,dateCreated:-1,videoId:-1})

        mongoose.models.videos.find(inputFilterObj)
            .populate("project")
            .populate("camera")
            .sort({ videoId: -1 })
            .skip(pageRecordsCount)
            .limit(recordsPerPage)
            .exec(function(err, videos) {
                if (err) {
                    return res.status(500).json({ error: 'Error with mongoDB connection.' });
                }
                var videosList = [];
                _.each(videos, function(video) {
                    videosList.push(video);
                });
                resutltObj.resultSet = videosList;
                return res.status(200).json(resutltObj);
            });
    });
};

exports.isVaulueValid = function(nameValue) {
    if (nameValue === undefined || nameValue === null || nameValue === 'undefined' || nameValue === '' || nameValue === '0') {
        return false;
    }
    return true;
}

exports.isVaulueValidWithZero = function(nameValue) {
    if (nameValue === undefined || nameValue === null || nameValue === 'undefined' || nameValue === '') {
        return false;
    }
    return true;
}

exports.syncMySqlForNewVideo = function(video) {
    poolConnection.getConnection(function(err, poolDbConn) {
        if (err) {} else {
            poolDbConn.query('update ideocap_input set isDataSynced=1 where ?', { VideoID: video.videoId }, function(err, results) {
                if (err)
                    console.log(err);
                poolDbConn.release();
            });
        }
    })


    var arrObj = [];
    poolConnection.getConnection(function(err, poolDbConn) {
        if (err) {} else {
            poolDbConn.query('select * from ideocap_input where ?', { VideoID: video.videoId }, function(err, results) {
                if (err)
                    console.log(err);
                if (results && results.length > 0) {
                    for (var resLen = 0; resLen < results.length; resLen++) {
                        var event = {};
                        event.eventId = results[resLen].EventId;
                        event.name = 'SHOPPER-' + results[resLen].ShopperID;
                        event.videoId = results[resLen].VideoID;
                        event.startTime = results[resLen].start_time;
                        event.endTime = results[resLen].end_time;

                        event.analysis = { "Shopper Profile": { Age: results[resLen].Age, Gender: results[resLen].Gender } };
                        event.bkpanalysis = { startTime: results[resLen].start_time, endTime: results[resLen].end_time, Age: results[resLen].Age, Gender: results[resLen].Gender };

                        arrObj.push(event);
                    }
                }
                poolDbConn.release();
                mongoose.models.events.create(arrObj, function(err, jellybean, snickers) {});
            });
        }
    })
}

exports.syncMysqlToMongoAndUpdate = function(req, res) {
    var body = req.body;
    var videoArrayObj = body.videoId;

    if (!Array.isArray(videoArrayObj)) {
        videoArrayObj = [body.videoId];
    }

    //mongoose.models.events.remove({videoId:{$in:videoArrayObj}}, function (err) {});

    var objToSet = { datasynced: 1 };
    var statusList = [0];

    if (body.resetUserAndStatus === 0 || body.resetUserAndStatus === '0') {
        statusList = [0, 1];
        objToSet = { status: 0, userId: 0, datasynced: 1, assignedDate: '', submittedDate: '' };
        mongoose.models.videos.update({ videoId: { $in: videoArrayObj } }, { $set: objToSet }, { multi: true }, function(err, updated) {});
        for (var len = 0; len < videoArrayObj.length; len++) {
            EventBus.emit('Videos.DeleteVideoEventsByVideoIds', videoArrayObj[len]);
        }
    }

    var videoIdsList = [];

    mongoose.models.videos.find({ videoId: { $in: videoArrayObj }, hasMysqlEvents: true, status: { $in: statusList } }).exec(function(err, videos) {
        if (err) {
            return res.status(500).json({ error: 'Error with mongoDB connection.' });
        }
        videoIdsList = [];
        _.each(videos, function(video) {
            EventBus.emit('SyncVideoEvents', video.videoId);
            EventBus.emit('Videos.DeleteVideoEventsByVideoIds', video.videoId);
            videoIdsList.push(video.videoId);
        });
        mongoose.models.videos.update({ videoId: { $in: videoIdsList } }, { $set: objToSet }, { multi: true }, function(err, updated) {});

        return res.status(200).json({ success: true, msg: 'Videos Updated succesfully' });
    });

    /*mongoose.models.videos.update({videoId: {$in:videoArrayObj}},{$set: objToSet},{multi: true},function (err, updated){});

    for(var len=0;len<videoArrayObj.length;len++)
    {
        EventBus.emit('SyncVideoEvents',videoArrayObj[len]);
        EventBus.emit('Videos.DeleteVideoEventsByVideoIds',videoArrayObj[len]);
    }*/

    return res.status(200).json({ success: true, msg: 'Videos Updated succesfully' });
};

exports.saveVideosFromCSV = function(req, res) {
    var body = req.body;
    var requiredFields = {
        name: ''
    };

    var toInsertValues = [];
    var bodyObjVideoRecords = [];

    var clientObjIdArr = [];
    var camerasObjIdArr = [];
    mongoose.models.clients.find({}, function(err, icons) {
        if (err) {}
        _.each(icons, function(client) {
            clientObjIdArr[client.clientsId] = client._id;
        });

        mongoose.models.cameras.find({}, function(err, cameras) {
            if (err) {}
            var camerasList = [];
            _.each(cameras, function(camera) {
                clientObjIdArr[camera.camerasId] = camera._id;
            });
        });

        for (var len = 0; len < body.length; len++) {
            var bodyRec = body[len];

            var eachRec = [];
            eachRec.push(0);
            //eachRec.push(bodyRec.userId);
            eachRec.push(bodyRec.videoId);
            eachRec.push(bodyRec.client);
            eachRec.push(bodyRec.name);
            eachRec.push(bodyRec.url);
            eachRec.push(0);
            //eachRec.push(bodyRec.status);
            eachRec.push(bodyRec.camera);
            eachRec.push(bodyRec.cameraId);
            eachRec.push(0);
            //eachRec.push(bodyRec.datasynced);
            eachRec.push(bodyRec.project);

            var eachBodyObj = {
                userId: 0,
                videoId: bodyRec.videoId,
                client: bodyRec.client,
                name: bodyRec.name,
                url: bodyRec.url,
                status: 0,
                camera: bodyRec.camera,
                project: clientObjIdArr[bodyRec.client],
                cameraId: bodyRec.cameraId,
                datasynced: 0
            };

            bodyObjVideoRecords.push(eachBodyObj);
            toInsertValues.push(eachRec);
        }

        var insertVideoImportMongoSql = "INSERT INTO video_import_mongo (userId,videoId,client,name,url,status,camera,cameraId,datasynced,project) VALUES ?";

        if (toInsertValues && toInsertValues.length > 0) {
            poolConnection.getConnection(function(err, poolDbConn) {
                if (err) {} else {
                    poolDbConn.query(insertVideoImportMongoSql, [toInsertValues], function(err) {
                        if (err)
                            console.log(err);
                        poolDbConn.release();
                    });
                }
            })
        }
        mongoose.models.videos.create(bodyObjVideoRecords, function(err) {
            return res.status(200).json({ success: true, msg: 'Videos Saved succesfully' });
        });
    });
};

exports.saveVideosFromCSVWithForm = function(req, res) {
    var body = req.body;
    var csvData = body.csvData;
    var formData = body.formDetails;
    formData.selectedDate = new Date(formData.selectedDate);

    var requiredFields = {
        name: ''
    };

    var bodyObjVideoRecords = [];

    var maxItemId, videoId;
    var settings = {
        collection: 'videos',
        field: 'videoId',
        query: {}
    };

    helper.getNextId(settings, function(err, nextId) {
        if (err)
            console.log('getNextId Error', err);
        maxItemId = nextId;

        for (var len = 0; len < csvData.length; len++) {
            var bodyRec = csvData[len];
            var eachBodyObj = {
                videoId: maxItemId++,
                name: bodyRec.name,
                url: (formData.url) + (bodyRec.name),
                lengthOfVideo: bodyRec.lengthOfVideo,
                startingTime: bodyRec.startTime,

                client: formData.clientId,
                project: formData.project,

                cameraId: formData.camerasId,
                camera: formData.camera,

                dateOfTheVideo: formData.selectedDate
            };

            bodyObjVideoRecords.push(eachBodyObj);
        }

        mongoose.models.videos.create(bodyObjVideoRecords, function(err) {
            EventBus.emit('Videos.SyncVideosTblMongoToMysql');
            return res.status(200).json({ success: true, msg: 'Videos Saved succesfully' });
        });

    });
};


exports.deleteVideoById = function(req, res) {
    var body = req.body;

    var videoArrayObj = body;

    if (body._id) {
        videoArrayObj = [body._id];
    }

    mongoose.models.events.remove({ videoId: { $in: videoArrayObj } }, function(err) {
        if (err) {}
    });

    mongoose.models.videos.remove({ videoId: { $in: videoArrayObj } }, function(errs, videoDeleted) {
        if (errs) {

        } else {
            EventBus.emit('Videos.SyncVideosDeleteTblMongoToMysql', videoArrayObj);
            return res.status(200).json({ success: true, msg: 'Video Deleted succesfully' });
        }
    });
}

exports.newClientUploadVideo = function(req, res) {
    var body = req.body;
    var requiredFields = {
        name: ''
    };

    var missing = helper.checkMissingFields(requiredFields, body);
    if (missing) {
        return res.status(400).json({ success: false, error: 'missing ' + missing });
    }

    var clientUploadedVideo = new mongoose.models.clientuploadedvidoes();

    for (prop in req.body) {
        if (prop !== '_id' && prop !== 'videoId') {
            clientUploadedVideo[prop] = req.body[prop];
        }
    }

    clientUploadedVideo.status = 0;

    clientUploadedVideo.dateCreated = Date.now();
    clientUploadedVideo.save(function(err, video) {
        if (!err) {
            return res.status(200).json(video);
        } else {
            return res.status(500).json({ success: false, error: 'Something went wrong, Please try after some time' }, err);
        }
    });
};


exports.getSubmittedVideoEventToCSVExport = function(req, res) {
    var body = req.body;

    var tblName = 'event';

    if (body.eventOrSku && body.eventOrSku === 'skubehaviour') {
        tblName = 'event_sku';
    }

    poolConnection.getConnection(function(err, poolDbConn) {
        if (err) {} else {
            poolDbConn.query('select * from ' + tblName + ' where videoId in (' + (body.videoId.join()) + ')', function(err, results) {
                if (err)
                    console.log(err);
                poolDbConn.release();
                return res.status(200).json(results);
            });
        }
    })
};

exports.getVideosListByCamera = function(req, res) {
    var body = req.body;
    var inputObj = { cameraId: body.cameraId, status: 2 };
    if (body.hidden != null && body.hidden != undefined && !body.hidden) {
        inputObj.hidden = false;
    }
    mongoose.models.videos.find(inputObj, { videoId: 1 }, function(err, videos) {
        if (err) {
            console.log(err)
        }
        var videoIdsList = [];
        _.each(videos, function(video) {
            videoIdsList.push(video.videoId);
        });
        return res.status(200).json(videoIdsList);
    });
}