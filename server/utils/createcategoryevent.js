/**
 * Broadcast updates to client when the model changes
 */

'use strict';
var EventBus = require('./EventBus');
var mongoose = require('mongoose');

var helper = require('../utils/helper');
var config = require('../config');
var  _ = require('lodash');

/**
 * event handler after creating new account
 */

EventBus.onSeries('SaveNewCategory', function (categoryId,client,referCat,next) {
    var newCategory = new mongoose.models.categories();
    newCategory.name = referCat.name;
    newCategory.category = referCat.category;
    newCategory.catcode = referCat.catcode;
    newCategory.orderId = referCat.orderId;
    newCategory.project = client._id;
    newCategory.categoryId = categoryId;
    newCategory.isMandatory = referCat.isMandatory;
    newCategory.isrepeats = referCat.isrepeats;
    newCategory.isHidden = referCat.isHidden;

    newCategory.save(function (err, newSavedCategory) {
        if (err)
        {
            console.log(err);
            console.log('util/creategoryevent.js 30')
        }
        var settings = {
            collection: 'subcategories',
            field: 'subcategoryId',
            query: {}
        };
        helper.getNextId(settings, function (err, nextSubCatId) {
            if (err)
                console.log('getNextId Error', err);
            mongoose.models.subcategories.find({category: referCat._id})
                .sort({'orderId':1})
                .exec(function (err, subcats) {
                    if (err)
                    {
                        console.log(err);
                        console.log('util/creategoryevent.js 30')
                        return res.status(500).json({error: 'Error with mongoDB connection.'});
                    }
                    var subCatssList = [];
                    _.each(subcats, function (subcat) {
                        var newSubCat = new mongoose.models.subcategories();
                        newSubCat.category = newSavedCategory._id;
                        newSubCat.name = subcat.name;
                        newSubCat.subCategory = subcat.subCategory;
                        newSubCat.orderId = subcat.orderId;
                        newSubCat.type = subcat.type;
                        newSubCat.docIsModified = true;
                        newSubCat.autoCreated = true;
                        newSubCat.project = client._id;
                        newSubCat.subcategoryId = config.getSubCatId();
                        newSubCat.isMandatory = subcat.isMandatory;
                        newSubCat.subcatcode = subcat.subcatcode;
                        newSubCat.refcatcode = subcat.refcatcode;

                        subCatssList.push(newSubCat);
                    });

                    mongoose.models.subcategories.create(subCatssList, function ()
                    {
                    });
                });
        });
    });
})

EventBus.onSeries('SaveNewCategoryFromBaseCam', function (categoryId,destinationCam,referCat,next) {
    var copyCat = referCat;
    copyCat = copyCat.toObject();
    delete copyCat["_id"];
    delete copyCat["id"];
    var newCategory = new mongoose.models.categories(copyCat);

    newCategory.project = destinationCam.project;
    newCategory.camera = destinationCam.camera;
    newCategory.categoryId = categoryId;
    newCategory.docIsModified = true;

    newCategory.save(function (err, newSavedCategory) {
        if (err)
        {
            console.log(err);
            console.log('util/creategoryevent.js 30')
        }
        var settings = {
            collection: 'subcategories',
            field: 'subcategoryId',
            query: {}
        };
        helper.getNextId(settings, function (err, nextSubCatId) {
            if (err)
                console.log('getNextId Error', err);
            mongoose.models.subcategories.find({category: referCat._id})
                .sort({'orderId':1})
                .exec(function (err, subcats) {
                    if (err)
                    {
                        console.log(err);
                        return res.status(500).json({error: 'Error with mongoDB connection.'});
                    }
                    var subCatssList = [];
                    _.each(subcats, function (subcat) {

                        var copySubCat = subcat;
                        copySubCat = copySubCat.toObject();
                        delete copySubCat["_id"];
                        delete copySubCat["id"];

                        var newSubCat = new mongoose.models.subcategories(copySubCat);
                        newSubCat.category = newSavedCategory._id;
                        newSubCat.docIsModified = true;
                        newSubCat.autoCreated = true;
                        newSubCat.project = destinationCam.project;
                        newSubCat.camera = destinationCam.camera;
                        newSubCat.subcategoryId = config.getSubCatId();

                        subCatssList.push(newSubCat);
                    });

                    mongoose.models.subcategories.create(subCatssList, function ()
                    {
                    });
                });
        });
    });
})


function insetNulls(record, size)
{
    for(var len=0;len<size;len++)
    {
        record.push(null);
    }
    return record;
}

