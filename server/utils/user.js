/**
 * Broadcast updates to client when the model changes
 */

'use strict';
var EventBus = require('./EventBus');
var mongoose = require('mongoose');
var helper = require('../utils/helper')
var AWS = require('aws-sdk');
var config = require('../config');

/**
 * event handler after creating new account
 */

EventBus.onSeries('CreateNewClient', function (client,next) {

    AWS.config.update({ accessKeyId: '', secretAccessKey: '' });
    AWS.config.region = 'us-east-1';
    var bucket = new AWS.S3({ params: { Bucket: config.getBucketName(),ACL: 'authenticated-read'} });

    var clientUploadDir = {Key: client.clientDestFolder+"Read.txt",ContentType: '',Body: 'Upload Raw Videos From Client By '+client.clientcode};
    bucket.putObject(clientUploadDir, function (err, data) {
        console.log(data)
    }).on('httpUploadProgress',function(progress) {
    });

    var adminUploadDir = {Key: client.destFolder+"Read.txt",ContentType: '',Body: 'Upload Converted Videos By Admin To '+client.clientcode};

    bucket.putObject(adminUploadDir, function (err, data) {
        console.log(data)
    }).on('httpUploadProgress',function(progress) {
    });

    var maxItemId, userId;
    var settings = {
        collection: 'users',
        field: 'userId',
        query: {}
    };
    var mailId = client.clientcode+'@ideotics.com';
    helper.getNextId(settings, function(err, nextId) {
        if (err)
            console.log('getNextId Error', err);
        maxItemId = nextId;
        mongoose.models.users.findOne({email: mailId}, function (err, user) {
            if (err) {
                console.log('unable to create client user')
            }
            if (!user) {
                user = new mongoose.models.users();
                user.userId = maxItemId++;
                user.email = mailId;
                user.password = client.clientcode+'@123#';
                user.firstName = client.clientcode;
                user.lastName = client.clientcode;;
                user.role = 'client';
                user.client = client.clientsId;
                user.project = client._id;
                user.save(function (err, user) {
                    if (!err) {
                        console.log('User Created'+user.userId);
                    }
                    else {
                        console.log('Something went wrong, Please try after some time');
                        console.log(err)
                    }
                });
            }
        });
    });

})



