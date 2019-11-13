'use strict';

var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

var awsSchema = new Schema({
    awsType: {type: String, default: 'Dev'},
    accessKeyId: {type: String, default: ''},
    secretAccessKey: {type: String, default: ''},
    bucketName: {type: String, default: ''},
    docIsModified: {type: Boolean, default: true},
    region: {type: String, default: ''}
});

mongoose.model('aws', awsSchema);
