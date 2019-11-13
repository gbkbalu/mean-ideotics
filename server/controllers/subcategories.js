var mongoose = require('mongoose')
  , config = require('../config')
  , helper = require('../utils/helper')
  , _ = require('lodash')
	, moment = require('moment')
	, fs = require('fs'),
    SubCategory =require('../models/subcategories');



exports.newSubCategory = function (req, res) {
    var body = req.body;
    var requiredFields = {
        name: ''
    };
    console.log(body)

    var missing = helper.checkMissingFields(requiredFields, body);
    if (missing) {
        return res.status(400).json({success: false, error: 'missing ' + missing});
    }
    var maxItemId,optionId;
    var settings = {
        collection: 'subcategories',
        field: 'subcategoryId',
        query: {}
    };

    helper.getNextId(settings, function(err, nextId) {
        if (err)
            console.log('getNextId Error', err);
        maxItemId = nextId;
        mongoose.models.subcategories.find({name: body.name,category:body.category}, function (err, subCategoryList) {
            if (err) {
                return res.status(500).json({success: false, error: 'Error with mongoDB connection.'});
            }
            if (subCategoryList.length == 0) {
                var subCategory = new mongoose.models.subcategories(body);
                subCategory.subcategoryId = maxItemId++;
                subCategory.dateCreated = Date.now();
                subCategory.save(function (err, subCat) {
                    if (!err) {
                        return res.status(200).json(subCat);
                        //return res.status(200).json({success: true, msg: 'Option Saved...'});
                    }
                    else {
                        return res.status(500).json({success: false, error:'Something went wrong, Please try after some time'}, err);
                    }
                });
            }
            else {
                return res.status(200).json({success: false, error: 'Subcategory already exists..! Please choose a different Subcategory name. '});
            }
        });
    });
};

exports.getListOfSubCatsByCat = function (req, res) {
    mongoose.models.subcategories.find({category: req.params.categoryId,isPrimary:1})
        .populate('category')
        .populate('type.icon')
        .sort({'orderId':1})
        .exec(function (err, subcats) {
        if (err) {
            return res.status(500).json({error: 'Error with mongoDB connection.'});
        }
        var subCatssList = [];
        _.each(subcats, function (subcat) {
            subCatssList.push(subcat);
        });
        return res.status(200).json(subCatssList);
    });
};

exports.getSubCategoriesByFilter = function (req, res) {
    mongoose.models.subcategories.find({category: req.body.category,isPrimary:req.body.isPrimary})
        .populate('category')
        .populate('type.icon')
        .sort({'orderId':1})
        .exec(function (err, subcats) {
            if (err) {
                return res.status(500).json({error: 'Error with mongoDB connection.'});
            }
            var subCatssList = [];
            _.each(subcats, function (subcat) {
                subCatssList.push(subcat);
            });
            return res.status(200).json(subCatssList);
        });
};

exports.getAllSubCategoriesByCategory = function (req, res) {
    var body = req.body;
    mongoose.models.subcategories.find({category: body.category, isHidden:body.isHidden,isPrimary:1})
        .populate('category')
        .populate('type.icon')
        .sort({'orderId':1})
        .exec(function (err, subcats) {
            if (err) {
                return res.status(500).json({error: 'Error with mongoDB connection.'});
            }
            var subCatssList = [];
            _.each(subcats, function (subcat) {
                subCatssList.push(subcat);
            });
            return res.status(200).json(subCatssList);
        });
};

exports.updateSubCategory = function (req, res) {
    var body = req.body;
    var requiredFields = {
        _id: ''
    };

    var missing = helper.checkMissingFields(requiredFields, body);
    if (missing) {
        return res.status(400).json({success: false, error: 'missing ' + missing});
    }
    mongoose.models.subcategories.find({name: body.name,category:body.category,_id:{$nin:[body._id]},isPrimary:0}, function (err, subCategoryList) {
        if (err) {
            return res.status(500).json({success: false, error: 'Error with mongoDB connection.'});
        }
        if (subCategoryList.length == 0) {
            mongoose.models.subcategories.findOne({_id: body._id}, function (err, subCat) {
                if (err) {
                    return res.status(500).json({success: false, error: 'Error with mongoDB connection.'});
                }
                if (subCat) {
                    for (prop in req.body) {
                        if (prop !== '_id') {
                            subCat[prop] = req.body[prop];
                        }
                    }
                    subCat.docIsModified = true;
                    subCat.save(function (err, subCat) {
                        if (!err) {
                            return res.status(200).json({success: true, msg: 'Subcategory Updated succesfully'});
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
                        error: 'No Subcategory exists with optionId: ' + body.optionId
                    });
                }
            });
        }else {
            return res.status(200).json({success: false, error: 'Subcategory already exists..! Please choose a different Subcategory name. '});
        }
    });
};

exports.updateOrderOfSubCats = function (req, res) {
    var body = req.body;

    mongoose.models.subcategories.findOne({_id:body.idsList }, function (err, subCat) {
        if (err) {
            return res.status(500).json({success: false, error: 'Error with mongoDB connection.'});
        }

        if (subCat)
        {
            subCat.orderId = body.orderIds;
            subCat.save(function (err, subCat) {
                    if (!err) {
                        return res.status(200).json({success: true, msg: 'Subcategory Updated succesfully'});
                    }
                    else {
                        console.dir(err)
                    }
                });
        }
        else {
            return res.status(400).json({success: false, error: 'No Subcategory exists with optionId: ' + body.optionId});
        }
    });
};

exports.deleteSubCatById = function (req, res) {
    var body = req.body;
    mongoose.models.subcategories.remove({_id:body._id }, function(errs, subCatDeleted){
        if (errs)
        {

        }else
        {
            console.dir(subCatDeleted);
            return res.status(200).json({success: true, msg: 'Subcategory Deleted succesfully'});
        }
    });


};


