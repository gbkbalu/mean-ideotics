var mongoose = require('mongoose')
  , helper = require('../utils/helper')
  , _ = require('lodash')

exports.getHelpers = function (req, res) {
   mongoose.models.helpers.find({}).sort({orderId:1}).exec(function (err, helpers) {
        if (err) {
            return res.status(500).json({error: 'Error with mongoDB connection.'});
        }

        return res.status(200).json(helpers);
    });
};

exports.getHelperById = function (req, res,done) {
    var body = req.body;
    mongoose.models.helpers.findOne({_id: body.helperId}, function (err, helper) {
        if (err) {
            return res.status(500).json({success: false, error: 'Error with mongoDB connection.'});
        }

        return res.status(200).json(helper);
    });
};

exports.updateHelper = function (req, res,done) {
    var body = req.body;
    mongoose.models.helpers.findOne({_id:body._id}, function (err, helper) {
        if (err) {
            return res.status(500).json({success: false, error: 'Error with mongoDB connection.'});
        }
        if(helper)
        {
            helper.helpertext = body.helpertext;
            helper.save(function (err, helper) {
                if (!err)
                {
                    mongoose.models.helpers.find({}).sort({orderId:1}).exec(function (err, helpers) {
                        if (err) {
                            return res.status(500).json({error: 'Error with mongoDB connection.'});
                        }

                        return res.status(200).json(helpers);
                    });
                }
                else
                {
                    return res.status(500).json({success: false, error:'Something went wrong, Please try after some time'}, err);
                }
            });
        }else
        {
            return res.status(400).json({success: false, error: 'No Helper exists'});
        }

    });
};


exports.saveHelper = function (req, res) {
    var body = req.body;

    var requiredFields = {
        helpercode: ''
    };

    var missing = helper.checkMissingFields(requiredFields, body);
    if (missing) {
        return res.status(400).json({ success: false, error: 'missing ' + missing });
    }
    var maxItemId, videoId;
    var settings = {
        collection: 'helpers',
        field: 'orderId',
        query: {}
    };

    mongoose.models.helpers.find({helpercode: body.helpercode}, function (err, helpersList) {
        if (err) {
            return res.status(500).json({success: false, error: 'Error with mongoDB connection.'});
        }
        if (helpersList.length == 0) {
            helper.getNextId(settings, function (err, nextId) {
                if (err)
                    console.log('getNextId Error', err);
                maxItemId = nextId;
                var helper = new mongoose.models.helpers();

                for (prop in req.body) {
                    if (prop !== '_id') {
                        helper[prop] = req.body[prop];
                    }
                }

                helper.orderId = maxItemId++;

                helper.save(function (err, helper) {
                    if (!err) {
                        //return res.status(200).json({ success: true, msg: 'Video posted...' });
                        return res.status(200).json(helper);
                    }
                    else {
                        return res.status(500).json({
                            success: false,
                            error: 'Something went wrong, Please try after some time'
                        }, err);
                    }
                });
            });
        }else
        {
            return res.status(400).json({ success: false, error: 'Camera already exists..! Please choose a different Camera code.'});
        }
    });
};

exports.updateHelperById = function (req, res) {
    var body = req.body;
    var requiredFields = {
        _id: '',
        helpercode: ''
    };

    var missing = helper.checkMissingFields(requiredFields, body.data);
    if (missing) {
        return res.status(400).json({success: false, error: 'missing ' + missing});
    }

    mongoose.models.helpers.find({helpercode: body.helpercode,_id:{$nin:[body._id]}}, function (err, helpersList) {
        if (err) {
            return res.status(500).json({success: false, error: 'Error with mongoDB connection.'});
        }
        if (helpersList.length == 0) {
            mongoose.models.helpers.findOne({_id: body._id}, function (err, helper) {
                if (err) {
                    return res.status(500).json({success: false, error: 'Error with mongoDB connection.'});
                }

                if (helper) {
                    for (prop in req.body.data) {
                        if (prop !== '_id') {
                            helper[prop] = req.body.data[prop];
                        }
                    }

                    helper.save(function (err, helper) {
                        if (!err) {
                            return res.status(200).json({success: true, msg: 'Helper Updated succesfully'});
                        }
                        else {
                            return res.status(500).json({
                                success: false,
                                error: 'Something went wrong, Please try after some time'
                            }, err);
                        }
                    });
                }
                else {
                    return res.status(400).json({
                        success: false,
                        error: 'No Helper exists with helperId: ' + body.data.helpercode
                    });
                }
            });
        }else
        {
            return res.status(400).json({ success: false, error: 'Helper already exists..! Please choose a different Helper code.'});
        }
    });
};

