'use strict';

var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

var eventSchema = new Schema({
    eventId: {type: Number, required: true},
    name: {type: String, required: true},
    videoId: {type: Number, required: true},
    cameraId: {type: Number, default: 0},
    clientId: {type: Number, default: 0},
    startTime: {type: Number, required: true},
    endTime: {type: Number, required: true},
    totalTimeSpent :{type: Number, default:0},
    isDiscarded: {type: Number, default:0},
    totalReviewTimeSpent:{type: Number, default: 0},
    isConverted: {type: Number, default:0},
    isAnalysed: {type: Number, default:0},
    humanid: {type: Number},
    capscan: {type: String, default:'s'},
    shopperorstaff: {type: String, default:'SHOPPER'},
    analysis: {},
    bkpanalysis: {},
    existingShopper:{},
    comments:{type: String, default: ''},
    frameno:{type: Number,default: 0},
    xaxis:{type: Number, default: 0},
    yaxis:{type: Number, default: 0},
    xendaxis:{type: Number, default: 0},
    yendaxis:{type: Number, default: 0},
    height:{type: Number, default: 100},
    width:{type: Number, default: 50},
    isFrame: {type: Boolean, default: false},
    docIsModified: {type: Boolean, default: true},
    dateCreated: {type: Date, default: Date.now()},

    screenWidth: {type: Number, default:0},
    screenHeight: {type: Number, default:0},
    originalVideoWidth: {type: Number, default:0},
    originalVideoHeight: {type: Number, default:0},
    playingWidth: {type: Number, default:0},
    playingHeight: {type: Number, default:0},
    discardUserId: {type: Number, default:0}
});

eventSchema.index({videoId: 1});
eventSchema.index({eventId: 1});
eventSchema.index({videoId:1,eventId: 1});

mongoose.model('events', eventSchema);
