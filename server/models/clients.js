'use strict';

var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

var clientsSchema = new Schema({
    clientsId: {type: Number},
    clientcode: {type: String, default:''},
    clientname: {type: String, default:''},
    description: {type: String, default:''},
    location: {type: String, default:''},
    awsbuketurl: {type: String, default:''},
    bucket: {type: String, default:''},
    isbase: {type: Boolean, default: false},
    docIsModified: {type: Boolean, default: true},
    destFolder: {type: String, default:''},
    clientDestFolder: {type: String, default:''}
});

clientsSchema.index({clientsId: 1});
clientsSchema.index({clientcode: 1});
mongoose.model('clients', clientsSchema);
