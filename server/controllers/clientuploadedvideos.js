var mongoose = require('mongoose')
    , config = require('../config')
    , helper = require('../utils/helper')
    , _ = require('lodash');
// Connection URL

exports.newClientUploadVideo = function (req, res) {
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
        if(prop !== '_id' && prop !== 'videoId' )
        {
            clientUploadedVideo[prop] = req.body[prop];
        }
    }

    clientUploadedVideo.status = 0;

    clientUploadedVideo.dateCreated = Date.now();
    clientUploadedVideo.save(function (err, video) {
        if (!err) {
            return res.status(200).json(video);
        }
        else {
            return res.status(500).json({ success: false, error: 'Something went wrong, Please try after some time' }, err);
        }
    });
};

exports.getAllClientUploadedVideos = function (req, res) {
    mongoose.models.clientuploadedvidoes.find({}, function (err, uploadedVideos) {
        if (err) {
            return res.status(500).json({error: 'Error with mongoDB connection.'});
        }
        var clientUploadedVideosList = [];
        _.each(uploadedVideos, function (uploadVideo) {
            clientUploadedVideosList.push(uploadVideo);
        });
        return res.status(200).json(clientUploadedVideosList);
    });
};

exports.isVaulueValid = function(nameValue)
{
    if(nameValue === undefined || nameValue === null || nameValue === 'undefined' || nameValue === '' || nameValue === '0')
    {
        return false;
    }
    return true;
}

exports.getAllUploadedVideosByUserAndDate = function (req, res) {

    var body = req.body;

    var presentDate = new Date(body.selectedDate);
    presentDate = new Date(presentDate.setDate(presentDate.getDate() + 1));
    var nextDate = presentDate.getFullYear()+'-'+(presentDate.getMonth()+1)+'-'+presentDate.getDate();

    var inputFilterObj = {dateCreated:{ $gte: body.selectedDate,$lte: nextDate }}

    if(exports.isVaulueValid(body.userId))
    {
        inputFilterObj.userId  = body.userId;
    }

    if(exports.isVaulueValid(body.client))
    {
        inputFilterObj.client  = body.client;
    }

    mongoose.models.clientuploadedvidoes.find(inputFilterObj, {_id:0, __v:0})
        .sort({submittedDate:-1})
        .exec(function (err, videos)
        {
            if (err) {
                return res.status(500).json({ error: 'Error with mongoDB connection.' });
            }
            var videosList = [];
            _.each(videos, function (video) {
                videosList.push(video);
            });
            return res.status(200).json(videosList);
        });

};



