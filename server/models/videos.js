'use strict';

var mongoose = require('mongoose')
    , Schema = mongoose.Schema;


var ProjectSchema  = {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'clients'
};

var CameraSchema  = {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'cameras'
};


var videoSchema = new Schema({
    userId: {type: Number, required: true,default:0},
    videoId: {type: Number, required: true, unique: true},
    name: {type: String, required: true, unique: false},
    format: {type: String, default:''},
    url: {type: String, required: true},
    bucket: {type: String, default: 'ideotics'},
    destinationFolder:{type: String, default: ''},
    status: {type: Number, default: 0},
    datasynced:{type: Number, default: 0},

    project: ProjectSchema,
    client: {type: Number, default: 0},

    camera: CameraSchema,
    //camera:{type: String, default: ''},
    cameraId: {type: Number, default: 0},

    hidden: {type: Boolean, default: false},
    hasMysqlEvents: {type: Boolean, default: false},

    dateOfTheVideo: {type: Date, default: Date.now()},
    startingTime: {type: String, default:'00:00:00'},

    endDateOfTheVideo: {type: Date, default: Date.now()},
    endingTime: {type: String, default:'00:00:00'},

    lengthOfVideo: {type: Number,default:0},
    videoFromAws:{type: Boolean, default: true},

    assignedDate: {type: Date, default: ''},
    submittedDate: {type: Date, default: ''},

    dateCreated: {type: Date, default: Date.now()},

    videoSubmittedTime:{type: Number, default: 0},
    docIsModified: {type: Boolean, default: true},
    forwardDuration:{type: Number, default:0},
    totalTimeSpent:{type: Number, default: 0},
    spentTime:{type: String, default: ''},
    reviewTimeSpent:{type: Number, default: 0},
    discardedTime:{type: String, default: ''},
    netTime:{type: String, default: ''},
    metaDataObj:{},
    copyObj:{}
});

videoSchema.index({videoId: 1});
mongoose.model('videos', videoSchema);
