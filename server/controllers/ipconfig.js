var mongoose = require('mongoose')
    , config = require('../config')
    , helper = require('../utils/helper')
    , _ = require('lodash')
    , moment = require('moment')
    , fs = require('fs')
    , ip = require('ip');

exports.getIpconfig = function (req, res) {
    mongoose.models.ipconfig.find({}, function (err, ipconfigs) {
        if (err) {
            return res.status(500).json({error: 'Error with mongoDB connection.'});
        }
        var configList = [];
        _.each(ipconfigs, function (ip) {
            configList.push(ip);
        });
        return res.status(200).json(configList);
    });
};

exports.updateIpconfig = function (req, res) {
    var body = req.body;
    var requiredFields = {
        _id: ''
    };

    var missing = helper.checkMissingFields(requiredFields, body);
    if (missing) {
        return res.status(400).json({success: false, error: 'missing ' + missing});
    }

    mongoose.models.ipconfig.findOne({_id: body._id}, function (err, ipconfig) {
        if (err) {
            return res.status(500).json({success: false, error: 'Error with mongoDB connection.'});
        }

        if (ipconfig) {
            for (prop in body.data)
            {
                if(prop !== '_id')
                {
                    ipconfig[prop] = body.data[prop];

                    if(prop == 'startIpAddress')
                    {
                        ipconfig.startIpLong = ip.toLong(body.data[prop])
                    }
                    else if(prop == 'endIpAddress')
                    {
                        ipconfig.endIpLong = ip.toLong(body.data[prop])
                    }
                }
            }

            ipconfig.docIsModified = true;
            ipconfig.save(function (err, ipconfig) {
                if (!err) {
                    return res.status(200).json(ipconfig);
                }
                else {
                    console.log(err)
                    return res.status(500).json({success: false, error: 'Something went wrong, Please try after some time'}, err);
                }
            });
        }
        else {
            return res.status(400).json({success: false, error: 'No Camera exists with optionId: ' + body.optionId});
        }
    });
};

exports.saveIpconfig = function (req, res) {
    var body = req.body;
    var requiredFields = {
        startIpAddress: '',
        endIpAddress:''
    };

    var missing = helper.checkMissingFields(requiredFields, body);
    if (missing) {
        return res.status(400).json({ success: false, error: 'missing ' + missing });
    }
    var ipconfig = new mongoose.models.ipconfig();

    for (prop in req.body) {
        if(prop !== '_id')
        {
            ipconfig[prop] = body[prop];

            if(prop == 'startIpAddress')
            {
                ipconfig.startIpLong = ip.toLong(body[prop])
            }
            else if(prop == 'endIpAddress')
            {
                ipconfig.endIpLong = ip.toLong(body[prop])
            }
        }
    }

    ipconfig.save(function (err, ipconfig) {
        if (!err) {
            return res.status(200).json(ipconfig);
        }
        else {
            return res.status(500).json({ success: false, error: 'Something went wrong, Please try after some time' }, err);
        }
    });
};

exports.removeIpconfigsByIdList = function (req, res) {
    var ipconfigArrayObj = req.body;
    var returnMsg= {success: true, msg: 'IpConfig Deleted succesfully'};
    mongoose.models.ipconfig.remove({_id: {$in:ipconfigArrayObj}}, function (errs, ipconfigsDeleted) {
        if (errs) {

        } else {
            return res.status(200).json(returnMsg);
        }
    });
}