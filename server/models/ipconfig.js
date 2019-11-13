'use strict';

var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

var ipConfigSchema = new Schema({
    startIpAddress :{type: String, default:''},
    startIpLong :{type: Number},
    endIpAddress :{type: String, default:''},
    endIpLong :{type: Number},
    docIsModified: {type: Boolean, default: true}
});

mongoose.model('ipconfig', ipConfigSchema);
