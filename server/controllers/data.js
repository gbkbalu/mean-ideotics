var mongoose = require('mongoose'),
    config = require('../config'),
    helper = require('../utils/helper'),
    _ = require('lodash'),
    moment = require('moment'),
    fs = require('fs');
var EventBus = require('../utils/EventBus');

exports.newEvent = function(req, res) {
    console.log("received new event")
    var body = req.body;
    var requiredFields = {
        videoId: ''
    };

    var missing = helper.checkMissingFields(requiredFields, body);
    if (missing) {
        return res.status(400).json({ success: false, error: 'missing ' + missing });
    }
    var maxItemId;
    var settings = {
        collection: 'data_collection',
        field: '_id',
        query: { video_id: body.videoId }
    };
    helper.getNextId(settings, function(err, nextId) {
        if (err)
            console.log('getNextId Error', err);
        if (nextId == 1) {
            nextId = 101;
        }
        maxItemId = nextId;
        mongoose.models.videos.findOne({ videoId: body.videoId }, function(err1, video) {
            if (err1) {
                return res.status(500).json({ success: false, error: 'Error with mongoDB connection.' });
            }
            console.log(video)
            if (video) {
                var event = new mongoose.models.events();
                event.eventId = maxItemId++;
                event.name = body.name;
                event.videoId = body.videoId;
                event.startTime = body.startTime;
                event.endTime = body.endTime;
                event.dateCreated = Date.now();
                event.analysis = body.analysis;
                event.comments = body.comments;
                event.capscan = 'c';
                if (body.xaxis) {
                    event.xaxis = body.xaxis;
                }
                if (body.yaxis) {
                    event.yaxis = body.yaxis;
                }
                for (prop in req.body) {
                    event[prop] = req.body[prop];
                }

                event.shopperorstaff = "SHOPPER";

                if (event && event.analysis && event.analysis.START && event.analysis.START.Staff) {
                    event.shopperorstaff = "STAFF";
                }

                if (exports.isVaulueValid(event.existingShopper) && exports.isVaulueValid(event.existingShopper.eventId)) {
                    event.eventId = event.existingShopper.eventId;
                }
                event.name = 'Shopper-' + event.eventId;
                event.isAnalysed = 1;
                event.save(function(err2, event) {
                    if (!err2) {
                        return res.status(200).json(event);
                    } else {
                        return res.status(500).json({ success: false, error: 'Something went wrong, Please try after some time' }, err2);
                    }
                });
            } else {
                return res.status(400).json({ success: false, error: 'No video found with video Id: ' + body.videoId });
            }
        });
    });
};

exports.getEvents = function(req, res) {

    mongoose.models.data_collection.find({}, { __v: 0 }, function(err, events) {
        if (err) {
            return res.status(500).json({ error: 'Error with mongoDB connection.' });
        }
        var eventsList = [];
        _.each(events, function(event) {
            eventsList.push(event);
        });
        return res.status(200).json(eventsList);
    });
};

exports.isVaulueValid = function(nameValue) {
    if (nameValue === undefined || nameValue === null || nameValue === 'undefined' || nameValue === '' || nameValue === '0') {
        return false;
    }
    return true;
}

exports.getEventListByVideo = (req, res) => {

    let video_id = 2; //req.body.videoId;
    let current_time = req.body.current_time;
    let frame_rate = req.body.frame_rate;
    let from_idx = current_time * frame_rate;
    let to_idx = from_idx + frame_rate;

    mongoose.models.data_collections.find({
            video_id,
            frame_id: {
                $gte: from_idx,
                $lte: to_idx
            }
        }).sort({ frame_id: 1 })
        .exec((err, events) => {

            if (err) {
                return res.status(500).json({ error: 'Error with mongoDB connection.' });
            }
            let eventsList = [];
            _.each(events, (event) => {
                eventsList.push(event);
            });
            return res.status(200).json(eventsList);
        });
};


exports.getEventByFrameId = function(req, res) {

    mongoose.models.data_collection.findOne({ frame_id: req.params.frameId }, { _id: 0, __v: 0 }, function(err, event) {
        if (err) {
            return res.status(500).json({ error: 'Error with mongoDB connection.' });
        }
        return res.status(200).json(event);
    });
};