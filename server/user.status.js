var mongoose = require('mongoose');
var config = require('./config');
var helper = require('./utils/helper');
var iplocation = require('iplocation')

//mark user's status is online when user logged in successfully
exports.setLoggedInStatus = function(sessionId,inputUserId, status,ipAddress,entryLoginSession){
    if(status)
    {
        exports.saveNewLoggedInSession(sessionId,inputUserId,ipAddress);
    }else if(!status && entryLoginSession)
    {
        exports.updateLoginSession(sessionId,inputUserId);
    }

    if(status)
    {
        mongoose.models.users.update({userId: inputUserId},{$set: {isOnline:status,sessionId:sessionId,lastLogin:Date.now()}},{multi: true},function (err, updated){});
    }else if(!status && entryLoginSession)
    {
        mongoose.models.users.update({userId: inputUserId},{$set: {isOnline:status,sessionId:""}},{multi: true},function (err, updated){});
    }
};


exports.updateLoginSession = function(sessionId,inputUserId)
{
    mongoose.models.userssessions.findOne({sessionId:sessionId,userId: inputUserId,currentlyUsing:0}, function (err, userssession) {
        if(userssession){
            userssession.currentlyUsing = 1;
            userssession.logOutTime = Date.now();
            userssession.sessionId = '';
            exports.saveSession(userssession,inputUserId);
        }
    });
}

exports.saveNewLoggedInSession = function(sessionId,inputUserId,ipAddress){
    mongoose.models.userssessions.count({sessionId:sessionId,userId: inputUserId,currentlyUsing:0}, function (err, sessionCount) {
        if(sessionCount == 0){
            var userssession = new mongoose.models.userssessions();
            if(ipAddress && ipAddress != null && ipAddress != undefined)
            {
                // iplocation(ipAddress, function (error, result) {
                //     if (error) {
                //         console.log(error)
                //     } else {
                //         userssession.ipDetails = result;
                //         userssession.shortDetails = result.city+','+result.region+','+result.country;
                //     }
                //     userssession.userId = inputUserId;
                //     userssession.loginTime = Date.now();
                //     userssession.sessionId = sessionId;
                //     if(ipAddress !== undefined && ipAddress !== null && ipAddress !== '')
                //     {
                //         userssession.traceIpAddress = ipAddress;
                //     }
                //     exports.saveSession(userssession,inputUserId);
                // })
            }
        }
    });
};

exports.updateAndCreateLoginSession = function(req)
{
    var sessionId = req.headers.session_id;

    var ip = req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;

    config.getClient().get(sessionId, function (err, reply) {
        if (err) {
            console.log('Error on redis get..');
        }else
        {
            var sesObj = JSON.parse(reply);
            mongoose.models.userssessions.findOne({sessionId:sessionId,userId: sesObj.userId,currentlyUsing:0}, function (err, userssession) {
                if(userssession){
                    userssession.currentlyUsing = 1;
                    userssession.logOutTime = Date.now();
                    userssession.sessionId = '';
                    userssession.save(function (err, currentlyUsing) {
                        if (err) {
                            console.log(err);
                        } else
                        {
                            exports.saveNewLoggedInSession(sessionId,sesObj.userId,userssession.traceIpAddress);
                        }
                    });
                }
            });
        }
    });
}

exports.saveSession = function(userssession,inputUserId)
{
    mongoose.models.users.findOne({userId: inputUserId}, {_id:0,__v:0}).exec(function (err, doc) {
        if (err) {
            console.log(err);
        }
        if (doc) {
            userssession.videoId = doc.pausedVideoId;
            userssession.save(function (err, currentlyUsing) {
                if (err) {
                    console.log(err);
                } else
                {
                }
            });
        }
    });
}

//mark user's status is offline when user logged out
exports.setUserStatus = function(sessionId,status,ipAddress,entryLoginSession){
    try {
        config.getClient().get(sessionId, function (err, reply) {
            if (err) {
                console.log('Error on redis get..');
            }
            if (reply) {
                var sessionObj = {};
                try {
                    sessionObj = JSON.parse(reply);
                    entryLoginSession = true;
                    exports.setLoggedInStatus(sessionId,sessionObj.userId,status,sessionObj.ipAddress,entryLoginSession);
                }catch(e) {
                    console.log(e);
                }
            }
        });
    } catch (exception) {
        console.log('Some thing went wrong, please try after some time');
    }
};

exports.setAllLoggedInStatusToFalse = function(){
    mongoose.models.users.update({}, { $set: { isOnline: false } }, { multi: true }, function (err) {
        if (err)
            console.log(err);
        else
          console.log('success');
    });
};

exports.setVideoId = function(){
    var settings = {
        collection: 'videos',
        field: 'videoId',
        query: {}
    };

    helper.getNextId(settings, function (err, nextId) {
        if (err)
            console.log('getNextId Error', err);
        console.log("VideoId::"+nextId);
        config.setVideoId(nextId);
    });
};
