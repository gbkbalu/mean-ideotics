'use strict';

var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

var ProjectSchema  = {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'clients'
};

var camerasSchema = new Schema({
    camerasId: {type: Number},
    cameracode: {type: String, required: true, unique: true},
    cameraname: {type: String, default:''},
    description: {type: String, default:''},
    width: {type: Number,default:0},
    height: {type: Number,default:0},
    bucket: {type: String},
    camImageUrl: {type: String},
    shortCamUrl: {type: String},
    isbase: {type: Boolean, default: false},
    project: ProjectSchema,
    clientId: {type: Number, default: 0},
    docIsModified: {type: Boolean, default: true},
    location: {type: String, default:''},
    forwardDuration:{type: Number, default:0},
    fps:{type: Number, default:0},
    gfps:{type: Number, default:0},
    fks:{type: Number, default:0},
    fss:{type: Number, default:0},
    dateCreated: {type: Date, default: Date.now()}

});

camerasSchema.index({camerasId: 1});
mongoose.model('cameras', camerasSchema);
