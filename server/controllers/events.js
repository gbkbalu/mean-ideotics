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
        collection: 'events',
        field: 'eventId',
        query: { videoId: body.videoId }
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

    mongoose.models.events.find({}, { __v: 0 }, function(err, events) {
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

exports.getAllShoppersByStartTime = function(req, res) {
    var body = req.body;
    req.body.videoId = 1; //for test
    mongoose.models.events.find(body, { __v: 0 }, function(err, events) {
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

exports.updateEvent = function(req, res) {
    var body = req.body;
    var requiredFields = {
        eventId: '',
        _id: ''
    };

    var missing = helper.checkMissingFields(requiredFields, body);
    if (missing) {
        console.log()
        return res.status(400).json({ success: false, error: 'missing ' + missing });
    }
    mongoose.models.events.findOne({ _id: body._id }, function(err, event) {
        if (err) {
            return res.status(500).json({ success: false, error: 'Error with mongoDB connection.' });
        }
        if (event) {
            for (prop in req.body) {
                event[prop] = req.body[prop];
            }
            if (exports.isVaulueValid(event.existingShopper) && exports.isVaulueValid(event.existingShopper.eventId)) {
                event.eventId = event.existingShopper.eventId;
            }

            event.name = 'Shopper-' + event.eventId;
            event.isAnalysed = 1;
            event.docIsModified = true;
            event.save(function(err, event) {
                if (!err) {
                    return res.status(200).json({ success: true, msg: 'Event data Updated succesfully' });
                } else {
                    return res.status(500).json({ success: false, error: 'Something went wrong, Please try after some time' }, err);
                }
            });
        } else {
            return res.status(400).json({ success: false, error: 'No Event exists with eventId: ' + body.eventId });
        }
    });
};

exports.isVaulueValid = function(nameValue) {
    if (nameValue === undefined || nameValue === null || nameValue === 'undefined' || nameValue === '' || nameValue === '0') {
        return false;
    }
    return true;
}

exports.getEventsByVideoId = function(req, res) {
    //,isDiscarded:0
    mongoose.models.events.find({ videoId: req.params.videoId })
        .sort({ 'eventId': 1 })
        .exec(function(err, events) {
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

exports.getEventsByVideoPagination = function(req, res) {

    var body = req.body;
    var eventsPerPage = 500;
    var skipEvents = 0;
    if (body.page) {
        skipEvents = (body.page) * eventsPerPage;
    }

    mongoose.models.events.find({ videoId: body.videoId, isDiscarded: 0 })
        .skip(skipEvents)
        .limit(eventsPerPage)
        .sort({ 'eventId': 1 })
        .exec(function(err, events) {
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

exports.getEventByEventId = function(req, res) {

    mongoose.models.events.findOne({ eventId: req.params.eventId }, { _id: 0, __v: 0 }, function(err, event) {
        if (err) {
            return res.status(500).json({ error: 'Error with mongoDB connection.' });
        }
        return res.status(200).json(event);
    });
};


exports.removeEventByEventId = function(req, res, done) {

    var body = req.body;
    if (body.isDiscarded == 0) {
        body.isDiscarded = 1;
    } else {
        body.isDiscarded = 0;
    }

    mongoose.models.events.update({ _id: body.eventId, videoId: body.videoId }, { $set: { isDiscarded: body.isDiscarded, discardUserId: body.discardUserId } }, function(err) {
        if (err) {

            console.log(err);

            return res.status(500).json({ success: false, error: 'Error with mongoDB connection.' });
        }
        return res.status(200).json({ success: true, msg: 'Event Discarded' });
    });
};

exports.getEventsByVideoForHeatMap = function(req, res, done) {
    var body = req.body;

    if (body.videoId) {
        mongoose.models.events.find({ videoId: { $in: body.videoId } }, { "_id": 0, "xaxis": 1, "yaxis": 1, "xendaxis": 1, "yendaxis": 1, "height": 1, "width": 1, "playingWidth": 1, "playingHeight": 1 }, function(err, events) {
            if (err) {
                return res.status(500).json({ error: 'Error with mongoDB connection.' });
            }
            var eventsList = [];
            _.each(events, function(event) {
                eventsList.push(event);
            });
            return res.status(200).json(eventsList);
        });
    } else if (body.cameraId) {
        mongoose.models.videos.find({ cameraId: body.cameraId, status: 2 }, { "_id": 0, "videoId": 1 }, function(err, videosList) {
            if (err) {
                return res.status(500).json({ error: 'Error with mongoDB connection.' });
            }
            var videoIdsList = [];
            _.each(videosList, function(video) {
                videoIdsList.push(video.videoId);
            });

            mongoose.models.events.find({ videoId: { $in: videoIdsList } }, { "_id": 0, "xaxis": 1, "yaxis": 1, "xendaxis": 1, "yendaxis": 1, "height": 1, "width": 1, "playingWidth": 1, "playingHeight": 1 }, function(err, events) {
                if (err) {
                    return res.status(500).json({ error: 'Error with mongoDB connection.' });
                }
                var eventsList = [];
                _.each(events, function(event) {
                    eventsList.push(event);
                });
                return res.status(200).json(eventsList);
            });
        });
    }

};


exports.convertCsvEventsToNestedEvent = function(req, res) {

    mongoose.models.events.remove({ eventId: req.params.eventId }, function(err, event) {
        if (err) {
            return res.status(500).json({ error: 'Error with mongoDB connection.' });
        }
        return res.status(200).json(event);
    });
};
exports.saveEventsFromCSVWithForm = function(req, res) {
    var body = req.body;
    console.log("received new saveEventsFromCSVWithForm")
    mongoose.models.events.remove({ videoId: body.videoId }, function(err, event) {
        //EventBus.emit('SaveEventsFromCSVWithForm', body);//syncmysqltomongovideoevents
        var frameWidth = 480;
        var frameHeight = 360;

        if (body.frameWidth && body.frameWidth != undefined && body.frameWidth != '0') {
            frameWidth = body.frameWidth;
        }
        if (body.frameHeight && body.frameHeight != undefined && body.frameHeight != '0') {
            frameHeight = body.frameHeight;
        }
        var csvData = body.csvData;
        var bodyObjEventRecords = [];
        var maxItemId = 1;

        for (var len = 0; len < csvData.length; len++) {
            var bodyRec = csvData[len];

            bodyRec['videoId'] = body.videoId;
            bodyRec['eventId'] = maxItemId;
            bodyRec['name'] = 'Shopper-' + bodyRec['humanid'];
            bodyRec['width'] = Number(bodyRec['xendaxis']) - bodyRec['xaxis'];
            bodyRec['height'] = Number(bodyRec['yendaxis']) - bodyRec['yaxis'];
            bodyRec['originalcoords'] = { xaxis: bodyRec['xaxis'], yaxis: bodyRec['yaxis'], xendaxis: bodyRec['xendaxis'], yendaxis: bodyRec['yendaxis'] };
            bodyRec['docIsModified'] = true;
            bodyRec['isFrame'] = true;
            bodyRec['comments'] = "";
            bodyRec['isAnalysed'] = 0;
            bodyRec['isConverted'] = 0;
            bodyRec['isDiscarded'] = 0;
            bodyRec['endTime'] = 0;
            bodyRec['capscan'] = 's';

            if (bodyRec['startTime'] != null && bodyRec['startTime'] != undefined && bodyRec['startTime'] >= 0) {
                bodyRec['startTime'] = Number(bodyRec['startTime']);
            }

            bodyRec['xaxis'] = Math.round((Number(bodyRec['xaxis']) * 777) / frameWidth); //(oldval*newwidth/oldwidth)
            bodyRec['yaxis'] = Math.round((Number(bodyRec['yaxis']) * 579) / frameHeight);
            bodyRec['xendaxis'] = Math.round((Number(bodyRec['xendaxis']) * 777) / frameWidth);
            bodyRec['yendaxis'] = Math.round((Number(bodyRec['yendaxis']) * 579) / frameHeight);
            bodyRec['playingWidth'] = 777;
            bodyRec['playingHeight'] = 579;
            bodyRec['width'] = Number(bodyRec['xendaxis']) - bodyRec['xaxis'];
            bodyRec['height'] = Number(bodyRec['yendaxis']) - bodyRec['yaxis'];
            bodyRec['humanid'] = Number(bodyRec['humanid']);
            bodyRec['frameno'] = Number(bodyRec['frameno']);

            if (bodyRec['frameno'] != null && bodyRec['frameno'] != undefined) {
                bodyRec['startTime'] = Number(bodyRec['frameno'] / 50);
                bodyRec['startTime'] = Number(bodyRec['startTime'].toFixed(2));
                bodyRec['endTime'] = bodyRec['startTime'];
            }

            bodyObjEventRecords.push(bodyRec);

            if (bodyObjEventRecords.length == 100) {
                mongoose.models.events.collection.insert(bodyObjEventRecords);
                bodyObjEventRecords = [];
            }
            maxItemId++;
        }
        mongoose.models.events.collection.insert(bodyObjEventRecords);
        return res.status(200).json({ success: true, msg: 'Events Saved succesfully' });
    });

};

exports.getEventListByVideo = function(req, res) {
    var body = req.body;
    body.videoId = 2; // for test test
    var eventObject = { discaredCount: 0, analysedCount: 0, notAnalysedCount: 0, totalCount: 0 };
    mongoose.models.events.aggregate({ $match: { videoId: body.videoId } }, { $group: { _id: "$isDiscarded", total: { $sum: 1 } } }, function(err, discardCountObj) {
        if (err) {
            console.log(err)
            return res.status(500).json({ error: 'Error with mongoDB connection.' });
        }

        if (discardCountObj && discardCountObj.length > 0) {
            for (iter in discardCountObj) {
                var indObj = discardCountObj[iter];
                if (indObj._id == 1) {
                    eventObject.discaredCount = indObj.total;
                }
            }
        }
        mongoose.models.events.aggregate({ $match: { videoId: body.videoId } }, { $group: { _id: "$isAnalysed", total: { $sum: 1 } } }, function(err, analysedCountObj) {
            if (err) {
                console.log(err)
                return res.status(500).json({ error: 'Error with mongoDB connection.' });
            }
            if (analysedCountObj && analysedCountObj.length > 0) {
                for (iter in analysedCountObj) {
                    var indObj = analysedCountObj[iter];
                    if (indObj._id == 0) {
                        eventObject.notAnalysedCount = indObj.total;
                    } else if (indObj._id == 1) {
                        eventObject.analysedCount = indObj.total;
                    }
                }
            }
            mongoose.models.events.count({ videoId: body.videoId }, function(error, eventVideoCount) {
                eventObject.totalCount = eventVideoCount;
                return res.status(200).json(eventObject);
            });
        });
    });

};

exports.getEventSubListByVideo = function(req, res) {
    var body = req.body;
    var eventObject = { discaredCount: 0, analysedCount: 0, notAnalysedCount: 0, totalCount: 0 };
    mongoose.models.events.aggregate({ $match: { videoId: body.videoId } }, { $group: { _id: "$isDiscarded", total: { $sum: 1 } } }, function(err, discardCountObj) {
        if (err) {
            console.log(err)
            return res.status(500).json({ error: 'Error with mongoDB connection.' });
        }

        if (discardCountObj && discardCountObj.length > 0) {
            for (iter in discardCountObj) {
                var indObj = discardCountObj[iter];
                if (indObj._id == 1) {
                    eventObject.discaredCount = indObj.total;
                }
            }
        }
        mongoose.models.events.aggregate({ $match: { videoId: body.videoId } }, { $group: { _id: "$isAnalysed", total: { $sum: 1 } } }, function(err, analysedCountObj) {
            if (err) {
                console.log(err)
                return res.status(500).json({ error: 'Error with mongoDB connection.' });
            }
            if (analysedCountObj && analysedCountObj.length > 0) {
                for (iter in analysedCountObj) {
                    var indObj = analysedCountObj[iter];
                    if (indObj._id == 0) {
                        eventObject.notAnalysedCount = indObj.total;
                    } else if (indObj._id == 1) {
                        eventObject.analysedCount = indObj.total;
                    }
                }
            }
            mongoose.models.events.count({ videoId: body.videoId }, function(error, eventVideoCount) {
                eventObject.totalCount = eventVideoCount;
                return res.status(200).json(eventObject);
            });
        });
    });

};