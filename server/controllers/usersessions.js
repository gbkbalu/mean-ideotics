var mongoose = require('mongoose')
  , config = require('../config')
  , helper = require('../utils/helper')
  , _ = require('lodash')
	, moment = require('moment')
	, fs = require('fs')

exports.getAllUserSessions = function (req, res) {

  mongoose.models.userssessions.find({}, {_id:0, __v:0}, function (err, userssessions) {
    if (err) {
      return res.status(500).json({error: 'Error with mongoDB connection.'});
    }
    var userSessionList = [];
    _.each(userssessions, function (session) {
        userSessionList.push(session);
    });
    return res.status(200).json(userSessionList);
  });
};


exports.getUserSessionsByUser = function (req, res) {
    var body = req.body;

    var presentDate = new Date(body.selectedDate);
    presentDate = new Date(presentDate.setDate(presentDate.getDate() + 1));
    var nextDate = presentDate.getFullYear()+'-'+(presentDate.getMonth()+1)+'-'+presentDate.getDate();

    var inputFilterObj = {loginTime:{ $gte: body.selectedDate,$lte: nextDate }};

    if(body.userId && body.userId !== undefined && body.userId !== null && body.userId !== ''  && body.userId !== '0')
    {
        inputFilterObj.userId = body.userId;
    }

    mongoose.models.userssessions.find(inputFilterObj, {_id:0, __v:0})
        .sort({loginTime:-1})
        .exec(function (err, userssessions) {
            if (err) {
                return res.status(500).json({error: 'Error with mongoDB connection.'});
            }
            var userSessionList = [];
            _.each(userssessions, function (session) {
                var sessionObj = session.toObject();
                if(sessionObj.loginTime != undefined && sessionObj.logOutTime != undefined) {
                    var duration = moment.utc(moment(sessionObj.logOutTime, "DD/MM/YYYY HH:mm:ss").diff(moment(sessionObj.loginTime, "DD/MM/YYYY HH:mm:ss"))).format("HH:mm:ss")
                    sessionObj['differnece'] = duration;
                }

                userSessionList.push(sessionObj);
            });
            return res.status(200).json(userSessionList);
        });
}

