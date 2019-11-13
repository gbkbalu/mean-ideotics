'use strict';

var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

var clientUploadedVideoSchema = new Schema({
    userId: {type: Number, default:0},
    //clientUploadedVideoId: {type: Number, required: true, unique: true},
    client: {type: Number},
    name: {type: String, required: true},
    url: {type: String, default:''},
    bucket :{type: String, default:''},
    destinationFolder:{type: String, default:''},
    docIsModified: {type: Boolean, default: true},
    dateCreated: {type: Date, default: Date.now()}
});
mongoose.model('clientuploadedvidoes', clientUploadedVideoSchema);
