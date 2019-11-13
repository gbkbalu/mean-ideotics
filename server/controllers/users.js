var mongoose = require('mongoose'),
    config = require('../config'),
    helper = require('../utils/helper'),
    _ = require('lodash'),
    moment = require('moment'),
    fs = require('fs'),
    userStatus = require('../user.status'),
    encryptor = require('simple-encryptor')({ key: config.getSecretkey(), hmac: false, debug: false });
var jwt = require('jsonwebtoken');
var atob = require('atob')


var generateRandom = function(length) {

    if (!length) {
        length = 7;
    }

    var keylist = '0123456789';

    var randNum = '';
    for (var i = 0; i < length; i++) {
        randNum += keylist.charAt(Math.floor(Math.random() * keylist.length));
    }
    return randNum;
};

function signToken(id) {
    return jwt.sign({ Id: id }, 'slick-call-secret', { expiresIn: 1 });
}

exports.login = function(req, res) {
    var body = JSON.parse(atob((req.body.data).trim()));

    console.log(body);

    mongoose.models.users.findOne({ email: body.username }, { __v: 0 }).populate('project').populate('team').exec(function(err, doc) {
        if (err) {
            return res.status(500).json({ error: 'Something went wrong. Please try again later.' });
        }
        if (!doc) {
            return res.status(401).json({ error: 'User does not exist.' });
        }
        if (doc && doc.active === 2) {
            return res.status(401).json({ error: 'User is inactive. Please contact Administrator.' });
        }

        var ip = req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.connection.socket.remoteAddress;

        // if (doc.authenticate(body.password))                 //commented by baimin
        {

            if (doc && doc.isOnline && doc.isOnline == true && doc.role !== 'admin' && !('exe' in body)) {
                return res.status(401).json({ error: 'User is Already Loggedin. Please Logout Previous Session to Login.' });
            }

            if (doc.role == 'agent' && doc.team && doc.team.active === 2) {
                return res.status(401).json({ error: 'Team is inactive. Please contact Administrator.' });
            }
            var session_id = config.getENV() + '' + generateRandom(40);

            var token = signToken(doc.userId);
            //session_id = token

            if (ip.startsWith("::ffff:")) {
                ip = ip.substring(7, ip.length);
            }

            var temp = {};
            temp = {
                "role": doc.role,
                "email": doc.email,
                "userId": doc.userId,
                "videoId": doc.pausedVideoId,
                "ipAddress": ip
            };

            config.getClient().set(session_id, JSON.stringify(temp), function(err, reply) {
                if (err) {
                    // Something went wrong
                    console.error('Error on setting client secret...');
                    return res.status(500).json({ error: 'Something went wrong. Please try again later.' });
                }

                helper.setSessionExpire(session_id, doc.role);

                doc.lastLogin = Date.now();
                doc.isOnline = true;
                doc.save(function(err, doc) {
                    if (!err) {
                        req.headers.session_id = session_id;
                        res.cookie('token', JSON.stringify(token));
                        return res.status(200).json({ id: session_id, token: token, pausedVideoId: doc.pausedVideoId, pausedVideoTime: doc.pausedVideoTime, user: doc });
                    } else {
                        console.log(err)
                        return res.status(500).json({ success: false, error: 'Something went wrong, Please try after some time' });
                    }
                });
            });
        }
        // else {           //commented by baimin
        //     return res.status(401).json({ error: 'Incorrect username or password.' });
        // }
    });
};

exports.session = function(req, res) {

    var session = req.headers.session_id;

    try {
        config.getClient().get(session, function(err, doc) {
            if (err) {
                console.log('Error on redis get..');
                return res.status(500).json('Some thing went wrong, please try after some time');
            }
            return res.status(200).json({ session: 'active' });
        });
    } catch (exception) {
        return res.status(500).json('Some thing went wrong, please try after some time');
    }
};

exports.logout = function(req, res) {

    var session = req.headers.session_id;
    try {
        var ip = req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.connection.socket.remoteAddress;
        userStatus.setUserStatus(session, false, '', true);
        config.getClient().del(session, function(err) {
            if (err) {
                console.log('Error on redis get..');
                return res.status(500).json('Some thing went wrong, please try after some time');
            }
            return res.status(200).json('logged out succesfully');
        });
    } catch (exception) {
        return res.status(500).json('Some thing went wrong, please try after some time');
    }
};

exports.logoutByAdmin = function(req, res) {

    var body = req.body;
    var sessionId = body.sessionId;
    try {
        if (body.isOnline) {
            userStatus.setUserStatus(sessionId, false, '', true);
            config.getClient().del(sessionId, function(err) {
                if (err) {
                    console.log('Error on redis get..');
                    return res.status(500).json('Some thing went wrong, please try after some time');
                }

                mongoose.models.users.update({ userId: body.userId }, { $set: { isOnline: false, sessionId: "" } }, { multi: true }, function(err, updated) {
                    return res.status(200).json('logged out succesfully');
                });
            });
        } else {
            mongoose.models.users.update({ userId: body.userId }, { $set: { isOnline: false, sessionId: "" } }, { multi: true }, function(err, updated) {
                return res.status(200).json('logged out succesfully');
            });
        }

    } catch (exception) {
        return res.status(500).json('Some thing went wrong, please try after some time');
    }
};


exports.newUser = function(req, res) {
    var body = req.body;
    var requiredFields = {
        email: '',
        firstName: '',
        lastName: '',
        password: '',
        role: ''
    };

    var missing = helper.checkMissingFields(requiredFields, body);
    if (missing) {
        return res.status(400).json({ success: false, error: 'missing ' + missing });
    }
    var maxItemId, userId;
    var settings = {
        collection: 'users',
        field: 'userId',
        query: {}
    };

    helper.getNextId(settings, function(err, nextId) {
        if (err)
            console.log('getNextId Error', err);
        maxItemId = nextId;

        mongoose.models.users.findOne({ email: body.email }, function(err, user) {
            if (err) {
                return res.status(500).json({ success: false, error: 'Error with mongoDB connection.' });
            }

            if (!user) {
                user = new mongoose.models.users();
                user.userId = maxItemId++;
                for (prop in req.body) {
                    if (req.body[prop] !== undefined && req.body[prop] !== null && req.body[prop] !== 'null' && req.body[prop] !== 'undefined' && req.body[prop] !== '')
                        user[prop] = req.body[prop];
                }
                if (user.role && user.role == 'admin' || user.role == 'reviewer') {
                    user.project = null;
                    user.client = 0;
                }

                var email = {
                    user: user.firstName,
                    to: body.email,
                    subject: 'Your password for Ideotics login',
                    body: 'Hi ' + body.firstname + ', <br /><br /> Please use the below credentials to login. <br /><br />username: <b>' +
                        user.email + '</b> <br />password: <b>' + user.password
                };

                user.save(function(err, user) {
                    if (!err) {
                        //helper.mailSend(email); // Comment this line to prevent from sending emails
                        return res.status(200).json({ success: true, msg: 'User Created' });
                    } else {
                        return res.status(500).json({ success: false, error: 'Something went wrong, Please try after some time' }, err);
                    }
                });
            } else {
                return res.status(400).json({ success: false, error: 'User already registered with this email id..! Please choose a different email. ' });
            }
        });



    });

};

exports.getUsers = function(req, res) {

    mongoose.models.users.find({}, { _id: 0, __v: 0 }).populate('camera', 'camerasId cameracode').populate('team', 'teamName').exec(function(err, users) {
        if (err) {
            return res.status(500).json({ error: 'Error with mongoDB connection.' });
        }
        var usersList = [];
        _.each(users, function(user) {
            usersList.push(user);
        });
        return res.status(200).json(usersList);
    });
};

exports.updateUser = function(req, res) {
    var body = req.body;
    var session = req.headers.session_id;
    if (req.params.userId !== 'undefined') {
        mongoose.models.users.findOne({ userId: req.params.userId }, function(err, user) {
            if (err) {
                console.log(err);
                return res.status(500).json({ success: false, error: 'Error with mongoDB connection.' });
            }

            if (user) {
                for (prop in req.body) {
                    if (prop !== '_id' && prop !== 'camera' && prop !== 'project' && prop !== 'team') {
                        user[prop] = req.body[prop];
                    }
                }
                user.dateModified = Date.now();
                user.docIsModified = true;

                if (user.role && user.role == 'admin' || user.role == 'reviewer') {
                    user.project = null;
                    user.client = 0;
                }

                config.getClient().get(session, function(err, reply) {

                    if (err) {
                        console.log('Error on redis get..');
                        return res.status(500).json('Some thing went wrong, please try after some time');
                    }
                    if (reply) {
                        var sessionObj = {};
                        try {
                            sessionObj = JSON.parse(reply);
                        } catch (e) {
                            console.log(e);
                        }
                        user.modifiedBy = sessionObj.userId;
                        user.save(function(err, user) {
                            if (!err) {
                                return res.status(200).json({ success: true, msg: 'User Updated succesfully' });
                            } else {
                                return res.status(500).json({
                                    success: false,
                                    error: 'Something went wrong, Please try after some time'
                                }, err);
                            }
                        });
                    }
                });
            } else {
                return res.status(200).json({ success: false, msg: 'User Does not exists.' });
            }
        });
    } else {
        var maxItemId, userId;
        var settings = {
            collection: 'users',
            field: 'userId',
            query: {}
        };

        helper.getNextId(settings, function(err, nextId) {
            if (err)
                console.log('getNextId Error', err);
            maxItemId = nextId;
            user = new mongoose.models.users();
            user.userId = maxItemId++;
            for (prop in req.body) {
                user[prop] = req.body[prop];
            }

            config.getClient().get(session, function(err, reply) {
                if (err) {
                    console.log('Error on redis get..');
                    return res.status(500).json('Some thing went wrong, please try after some time');
                }
                if (reply) {
                    var sessionObj = {};
                    try {
                        sessionObj = JSON.parse(reply);
                    } catch (e) {
                        console.log(e);
                    }
                    user.modifiedBy = sessionObj.userId;
                    user.save(function(err, user) {
                        if (!err) {
                            return res.status(200).json({ success: true, msg: 'User Created succesfully' });
                        } else {
                            return res.status(500).json({
                                success: false,
                                error: 'Something went wrong, Please try after some time'
                            }, err);
                        }
                    });
                }
            });

        });
    }
};

exports.updatePausedVideoId = function(req, res) {
    var body = req.body;
    var requiredFields = {
        videoId: '',
        userId: ''
    };

    var missing = helper.checkMissingFields(requiredFields, body);
    if (missing) {
        return res.status(400).json({ success: false, error: 'missing ' + missing });
    }
    var userId = parseInt(body.userId);
    var videoId = parseInt(body.videoId);
    var videoTime = parseInt(body.videoTime);
    mongoose.models.users.update({ userId: userId }, { $set: { pausedVideoId: videoId, pausedVideoTime: videoTime } }, function(err) {
        if (err) {

            console.log(err);

            return res.status(500).json({ success: false, error: 'Error with mongoDB connection.' });
        }
        return res.status(200).json({ success: true, msg: 'videoId updated' });
    });
};

exports.removeUsersByIdsList = function(req, res) {
    var body = req.body;
    console.log(body);

    var userArrayObj = body.usersList;

    if (body._id) {
        userArrayObj = [body._id];
    }

    //Inactivate the users
    if (body.inactiveOrDelete == 1) {
        mongoose.models.users.update({ userId: { $in: userArrayObj } }, { $set: { active: 2 } }, { multi: true }, function(errs, userDeleted) {
            if (errs) {
                console.log(err)
                return res.status(500).json({ success: false, error: 'Error with mongoDB connection.' });
            } else {
                console.dir(userDeleted);
                return res.status(200).json({ success: true, msg: 'Users Inactivated succesfully' });
            }
        });
    } else {
        //Delete the users
        mongoose.models.videos.update({ userId: { $in: userArrayObj }, status: 1 }, { $set: { status: 0 } }, { multi: true }, function(errs, userDeleted) {
            if (errs) {
                console.log(err)
                return res.status(500).json({ success: false, error: 'Error with mongoDB connection.' });
            }
            mongoose.models.users.remove({ userId: { $in: userArrayObj } }, function(errs, userDeleted) {
                if (errs) {

                } else {
                    console.dir(userDeleted);
                    return res.status(200).json({ success: true, msg: 'Users Deleted succesfully' });
                }
            });
        });
    }

}

exports.assignUsersToSelectedProject = function(req, res) {
    var body = req.body;
    var userArrayObj = body.userIds;
    var setOrUnsetProject = { $unset: { project: '', camera: '' } };
    if (body.projectAssignFlag) {
        setOrUnsetProject = { $set: { project: body.project, camera: body.camera } };
    }
    var replyMsg = { success: true, msg: 'User updated' };
    mongoose.models.videos.find({ status: 1 }, { 'userId': 1, '_id': 0 })
        .exec(function(err, videoUserIds) {
            if (err) {
                console.dir(err)
            }
            var userIds = videoUserIds.map(function(videoUser) { return videoUser.userId; });
            _.each(videoUserIds, function(videoUser) {
                if ((userArrayObj.indexOf(videoUser.userId) > -1)) {
                    userArrayObj.splice(userArrayObj.indexOf(videoUser.userId), 1);
                    replyMsg = { success: false, msg: 'Few Of The Selected Users has not assigned to selected team, Because they are processing the another video.' };
                }
            });
            mongoose.models.users.update({ userId: { $in: userArrayObj }, role: { $in: ['agent', 'reviewer'] } }, setOrUnsetProject, { multi: true }, function(err) {
                if (err) {
                    console.log(err)
                    return res.status(500).json({ success: false, error: 'Error with mongoDB connection.' });
                }
                return res.status(200).json(replyMsg);
            });
        });
}

exports.assignUsersToSelectedTeam = function(req, res) {
    var body = req.body;
    var userArrayObj = body.userIds;
    var setOrUnsetProject = { $unset: { project: '', camera: '', team: '' } };
    if (body.teamAssignFlag) {
        setOrUnsetProject = { $set: body.data };
    }
    var replyMsg = { success: true, msg: 'User updated' };
    mongoose.models.videos.find({ status: 1 }, { 'userId': 1, '_id': 0 })
        .exec(function(err, videoUserIds) {
            if (err) {
                console.dir(err)
            }
            var userIds = videoUserIds.map(function(videoUser) { return videoUser.userId; });
            _.each(videoUserIds, function(videoUser) {
                if ((userArrayObj.indexOf(videoUser.userId) > -1)) {
                    userArrayObj.splice(userArrayObj.indexOf(videoUser.userId), 1);
                    replyMsg = { success: false, msg: 'Few Of The Selected Users has not assigned to selected team, Because they are processing the another video.' };
                }
            });
            mongoose.models.users.update({ userId: { $in: userArrayObj }, role: { $in: ['agent', 'reviewer'] } }, setOrUnsetProject, { multi: true }, function(err) {
                if (err) {
                    console.log(err)
                    return res.status(500).json({ success: false, error: 'Error with mongoDB connection.' });
                }
                return res.status(200).json(replyMsg);
            });
        });
}

exports.getAssignedUsersListByProject = function(req, res) {
    var body = req.body;
    mongoose.models.users.find({ project: body.project })
        .sort({ orderId: 1 })
        .exec(function(err, userList) {
            if (err) {
                console.dir(err)
            }
            return res.status(200).json(userList)
        });
}

exports.getAssignedUsersListByFilter = function(req, res) {
    var body = req.body;
    if (body.type == 'Assigned') {
        mongoose.models.users.find({ team: body.team, active: 1 })
            .sort({ orderId: 1 })
            .exec(function(err, userList) {
                if (err) {
                    console.dir(err)
                }
                return res.status(200).json(userList)
            });
    } else {
        mongoose.models.users.find({ team: { $nin: [body.team] }, role: { $in: ['agent', 'reviewer'] }, active: 1 })
            .sort({ orderId: 1 })
            .exec(function(err, userList) {
                if (err) {
                    console.dir(err)
                }
                return res.status(200).json(userList)
            });
    }
}

exports.getUsersListByFilter = function(req, res) {
    var body = req.body;
    var userFilterObj = {};

    if (body.team !== '0' && body.team !== undefined) {
        userFilterObj.team = body.team;
    }

    if (body.role !== '0' && body.role !== undefined) {
        userFilterObj.role = { $in: body.role };
    }


    var recordsPerPage = body.pageSize;
    var pageRecordsCount = (body.currentPage - 1) * recordsPerPage;
    mongoose.models.users.count(userFilterObj, function(err, count) {
        var resutltObj = new Object();
        resutltObj.totalItemsCount = count;
        mongoose.models.users.find(userFilterObj)
            .populate('camera', 'camerasId cameracode')
            .populate('team', 'teamName')
            .sort({ orderId: 1 })
            .skip(pageRecordsCount)
            .limit(recordsPerPage)
            .exec(function(err, users) {
                if (err) {
                    return res.status(500).json({ error: 'Error with mongoDB connection.' });
                }
                resutltObj.resultSet = users;
                return res.status(200).json(resutltObj);
            });
    });
}


exports.getUnassignedUsersList = function(req, res) {
    var body = req.body;
    mongoose.models.videos.find({ status: 1 }, { 'userId': 1, '_id': 0 })
        .exec(function(err, videoUserIds) {
            if (err) {
                console.dir(err)
            }
            var userIds = videoUserIds.map(function(videoUser) { return videoUser.userId; });
            mongoose.models.users.find({ userId: { $nin: userIds }, role: { $in: ['admin', 'agent'] } })
                .sort({ orderId: 1 })
                .exec(function(err, userList) {
                    if (err) {
                        console.dir(err)
                    }
                    return res.status(200).json(userList)
                });
        });
}
exports.generateRandom = generateRandom;