var mongoose = require('mongoose')
  , config = require('../config')
  , helper = require('../utils/helper')
  , _ = require('lodash');

var EventBus = require('../utils/EventBus');
var ObjectID = require('mongodb').ObjectID;

exports.getCameras = function (req, res) {
   mongoose.models.cameras.find({}, function (err, cameras) {
        if (err) {
            return res.status(500).json({error: 'Error with mongoDB connection.'});
        }
         var camerasList = [];
        _.each(cameras, function (camera) {
            camerasList.push(camera);
        });
        return res.status(200).json(camerasList);
    });
};

exports.getAllBaseConfigCameras = function (req, res) {
    mongoose.models.cameras.find({isbase:true}).populate('project','_id clientsId clientname clientcode').exec(function (err, cameras) {
        if (err) {
            return res.status(500).json({error: 'Error with mongoDB connection.'});
        }
        var camerasList = [];
        _.each(cameras, function (camera) {
            camerasList.push(camera);
        });
        return res.status(200).json(camerasList);
    });
};

exports.getAllBaseConfigCamerasByFiltler = function (req, res) {
    var body = req.body;
    mongoose.models.cameras.find(body).populate('project','_id clientsId clientname clientcode').exec(function (err, cameras) {
        if (err) {
            return res.status(500).json({error: 'Error with mongoDB connection.'});
        }
        var camerasList = [];
        _.each(cameras, function (camera) {
            camerasList.push(camera);
        });
        return res.status(200).json(camerasList);
    });
};

exports.getCamerasListByFilter = function (req, res) {
    var body = req.body;
    var filterObj = {};

    if(body.project !== '0' && body.project !== undefined  && body.project !== null)
    {
        filterObj.project = body.project;
    }

    var recordsPerPage = body.pageSize;
    var pageRecordsCount = (body.currentPage-1) * recordsPerPage;
    mongoose.models.cameras.count(filterObj, function(err, count) {
        var resutltObj = new Object();
        resutltObj.totalItemsCount = count;
        mongoose.models.cameras.find(filterObj)
            .sort({camerasId:1})
            .skip(pageRecordsCount)
            .limit(recordsPerPage)
            .exec(function (err, cameras)
            {
                if (err)
                {
                    return res.status(500).json({ error: 'Error with mongoDB connection.' });
                }
                resutltObj.resultSet = cameras;
                return res.status(200).json(resutltObj);
            });
    });
};

exports.getCamerasListByProject = function (req, res) {
    var body = req.body;

    mongoose.models.cameras.find(body).populate('project','_id clientsId clientname clientcode').exec(function (err, cameras) {
        if (err) {
            return res.status(500).json({error: 'Error with mongoDB connection.'});
        }
        var camerasList = [];
        _.each(cameras, function (camera) {
            camerasList.push(camera);
        });
        return res.status(200).json(camerasList);
    });
};

exports.updateCamera = function (req, res) {
    var body = req.body;
    var requiredFields = {
        _id: ''
    };

    var missing = helper.checkMissingFields(requiredFields, body);
    if (missing) {
        return res.status(400).json({success: false, error: 'missing ' + missing});
    }

    mongoose.models.cameras.findOne({name: body.name,_id: { $nin: [body._id] }}, function (err, camera) {
        if (err) {
            return res.status(500).json({success: false, error: 'Error with mongoDB connection.'});
        }

        if (!camera) {
            mongoose.models.cameras.findOne({_id: body._id}, function (err, camera) {
                if (err) {
                    return res.status(500).json({success: false, error: 'Error with mongoDB connection.'});
                }

                if (camera) {
                    for (prop in req.body) {
                        if(prop !== '_id' && prop !== 'iconUrl')
                        {
                            camera[prop] = req.body[prop];
                        }
                    }

                    camera.docIsModified = true;
                    camera.save(function (err, camera) {
                        if (!err) {
                            return res.status(200).json(camera);
                            //return res.status(200).json({success: true, msg: 'Option Updated succesfully'});
                        }
                        else {
                            return res.status(500).json({success: false, error: 'Something went wrong, Please try after some time'}, err);
                        }
                    });
                }
                else {
                    return res.status(400).json({success: false, error: 'No Camera exists with optionId: ' + body.optionId});
                }
            });
        }
        else {
            return res.status(200).json({success: false, error: 'Icon already exists..! Please choose a different Camera name. '});
        }
    });
};

exports.saveCamera = function (req, res) {
    var body = req.body;
    var requiredFields = {
        cameracode: ''
    };

    var missing = helper.checkMissingFields(requiredFields, body);
    if (missing) {
        return res.status(400).json({ success: false, error: 'missing ' + missing });
    }
    var maxItemId, videoId;
    var settings = {
        collection: 'cameras',
        field: 'camerasId',
        query: {}
    };

    mongoose.models.cameras.find({project:body.project ,cameracode: body.cameracode}, function (err, camerasList) {
        if (err) {
            return res.status(500).json({success: false, error: 'Error with mongoDB connection.'});
        }
        if (camerasList.length == 0) {
            helper.getNextId(settings, function (err, nextId) {
                if (err)
                    console.log('getNextId Error', err);
                maxItemId = nextId;
                var camera = new mongoose.models.cameras();

                for (prop in req.body) {
                    if (prop !== '_id') {
                        camera[prop] = req.body[prop];
                    }
                }

                camera.camerasId = maxItemId++;

                camera.save(function (err, camera) {
                    if (!err) {
                        return res.status(200).json(camera);
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

exports.removeCameraById = function (req, res,done) {

    mongoose.models.cameras.remove({_id: req.params.cameraId}, function (err) {
        if (err) {
            return res.status(500).json({success: false, error: 'Error with mongoDB connection.'});
        }
        return res.status(200).json({success: true, msg: 'Camera Discarded'});
    });
};

exports.updateCameraById = function (req, res) {
    var body = req.body;
    var requiredFields = {
        _id: ''
    };

    var missing = helper.checkMissingFields(requiredFields, body);
    if (missing) {
        return res.status(400).json({success: false, error: 'missing ' + missing});
    }

    mongoose.models.cameras.find({project:body.project ,cameracode: body.cameracode,_id:{$nin:[body._id]}}, function (err, camerasList) {
        if (err) {
            return res.status(500).json({success: false, error: 'Error with mongoDB connection.'});
        }
        if (camerasList.length == 0) {
            mongoose.models.cameras.findOne({_id: body._id}, function (err, camera) {
                if (err) {
                    return res.status(500).json({success: false, error: 'Error with mongoDB connection.'});
                }

                if (camera) {
                    for (prop in req.body.data) {
                        if (prop !== '_id') {
                            camera[prop] = req.body.data[prop];
                        }
                    }

                    camera.save(function (err, camera) {
                        if (!err) {
                            return res.status(200).json({success: true, msg: 'Camera Updated succesfully'});
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
                        error: 'No Camera exists with cameraId: ' + body.data.clientsId
                    });
                }
            });
        }else
        {
            return res.status(400).json({ success: false, error: 'Camera already exists..! Please choose a different Camera code.'});
        }
    });
};

exports.removeCamerassByIdList = function (req, res) {
    var camerasArrayObj = req.body;
    var camIdsList = req.body.cameraIds;
    var obj_ids_list = req.body.ids_list;
    var returnMsg= {success: true, msg: 'Camera Deleted succesfully'};
    mongoose.models.videos.distinct('camera',{camera:{$in:obj_ids_list}}, function (errs, camObjIds) {
        if (errs) {

        } else {
            if(camObjIds.length>0)
            {
                return res.status(200).json({success: false, error: 'Camera Has Videos. Please Delete Videos First.'});
            }else
            {
                mongoose.models.cameras.remove({_id: {$in:obj_ids_list},isbase:false}, function (errs, camerasDeleted) {
                    if (errs) {

                    } else {
                        return res.status(200).json(returnMsg);
                    }
                });
            }
        }
    });
}


exports.copyParamsFromSelectedBaseCam = function (req, res) {
    var body = req.body;

    var baseCam = body.baseCam;
    var destinationCam = body.destinationCam;
    var subCatSettings = {
        collection: 'subcategories',
        field: 'subcategoryId',
        query: {}
    };
    mongoose.models.clients.findOne({_id:destinationCam.project}, function (err, client) {
        if (err) {
        }
        var settings = {
            collection: 'categories',
            field: 'categoryId',
            query: {}
        };
        helper.getNextId(settings, function (err, nextCatId) {
            if (err)
                console.log('getNextId Error', err);
            helper.getNextId(subCatSettings, function (err, nextSubCatId) {
                if (err)
                    console.log('getNextId Error', err);
                config.setSubCatId(nextSubCatId);

                mongoose.models.subcategories.remove({project:destinationCam.project,camera:destinationCam.camera}, function (err) {
                    if (err)
                    {
                        console.log(err);
                    }
                });

                mongoose.models.categories.remove({project:destinationCam.project,camera:destinationCam.camera}, function (err) {
                    if (err)
                    {
                        console.log(err);
                    }
                });

                mongoose.models.categories.find({camera:baseCam.camera})
                    .sort({ orderId: 1 })
                    .exec(function (err, catList) {
                        if (err)
                        {
                            console.log(err);
                        }
                        for(var len=0;len<catList.length;len++)
                        {
                            EventBus.emit('SaveNewCategoryFromBaseCam',nextCatId++,destinationCam,catList[len]);//utils/createcategoryevent.js
                        }
                        return res.status(200).json(client);
                    });
            });

        });
    });
};




