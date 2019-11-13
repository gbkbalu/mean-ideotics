var mongoose = require('mongoose')
  , config = require('../config')
  , helper = require('../utils/helper')
  , _ = require('lodash');


exports.updateCategory = function (req, res) {
    var body = req.body;
    var requiredFields = {
        _id: ''
    };

    var missing = helper.checkMissingFields(requiredFields, body);
    if (missing) {
        return res.status(400).json({success: false, error: 'missing ' + missing});
    }

    mongoose.models.categories.find({category: body.category,project:body.project,camera:body.camera,_id:{$nin:[body._id]}}, function (err, categoriesList) {
        if (err) {
            return res.status(500).json({success: false, error: 'Error with mongoDB connection.'});
        }
        if (categoriesList.length == 0) {
            mongoose.models.categories.findOne({_id: body._id}, function (err, category) {
                if (err) {
                    return res.status(500).json({success: false, error: 'Error with mongoDB connection.'});
                }

                var preValues = ["category", "name", "isMandatory", "isHidden"];

                if (category) {
                    category['previous'] ={};
                    for (prop in req.body) {
                        if (prop !== '_id' && preValues.indexOf(prop)<0) {
                            category[prop] = req.body[prop];
                        }

                        if(preValues.indexOf(prop)>-1)
                        {
                            category['previous'][prop] = req.body[prop];
                        }
                    }
                    mongoose.models.subcategories.update({category: req.body._id}, {
                        $set: {
                            docIsModified: true,
                            isMandatory: req.body.isMandatory
                        }
                    }, {multi: true}, function (err) {
                    });

                    category.docIsModified = true;
                    category.save(function (err, cat) {
                        if (!err) {
                            return res.status(200).json(cat);
                            //return res.status(200).json({success: true, msg: 'Category Updated succesfully'});
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
                        error: 'No Category exists with categoryId: ' + body.optionId
                    });
                }
            });
        }else {
            return res.status(200).json({success: false, error: 'Category already exists..! Please choose a different Category name. '});
        }
    });
};

exports.getCategoriesList = function (req, res) {
    mongoose.models.categories.find({})
        .exec(function (err, catList) {
            if (err) {
                console.dir(err)
            }
            return res.status(200).json(catList)
        });
};

exports.getCategoriesListByProject = function (req, res) {
    var body = req.body;
    mongoose.models.categories.find({project:body.project})
        .sort({ orderId: 1 })
        .exec(function (err, catList) {
            if (err) {
                console.dir(err)
            }
            return res.status(200).json(catList)
        });
};

exports.getCategoriesListByFilter = function (req, res) {
    var body = req.body;
    mongoose.models.categories.find(body)
        .sort({ orderId: 1 })
        .exec(function (err, catList) {
            if (err) {
                console.dir(err)
            }

            return res.status(200).json(catList)
        });
};

exports.copyCategoriesAndSubCatsByFilter = function (req, res) {
    var body = req.body;
    mongoose.models.categories.find({camera: body.camera,isPrimary:1})
        .exec(function (err, catList) {
            if (err) {
                console.dir(err)
            }
            var catObjIdsList = [];
            _.each(catList, function (catObj) {
                catObj['previous'] = {name:catObj.name,category:catObj.category,isMandatory:catObj.isMandatory,isHidden:catObj.isHidden};
                catObj.docIsModified = true;
                catObjIdsList.push(catObj._id);
                catObj.save(function (err, cat) {});
            });
            mongoose.models.subcategories.remove({$or:[{camera: body.camera},{category:{$in:catObjIdsList}}],isPrimary:0}, function (err) {
                mongoose.models.subcategories.find({$or:[{camera: body.camera},{category:{$in:catObjIdsList}}],isPrimary:1})
                    .exec(function (err,subCatsList) {
                        if (err) {
                            console.dir(err)
                        }
                        var subCategoriesList = [];
                        _.each(subCatsList, function (subCatObj) {
                            subCatObj = subCatObj.toObject();
                            delete subCatObj['_id'];
                            subCatObj.isPrimary = 0;
                            subCatObj.camera = body.camera;
                            subCategoriesList.push(subCatObj);
                        });
                        mongoose.models.subcategories.create(subCategoriesList, function (err) {
                            return res.status(200).json('Updated Succesfully');
                        });

                    });
            });
        });

};


exports.saveModifiedChanges = function (req, res) {
    var body = req.body;
    mongoose.models.categories.find({camera: body.camera,isPrimary:1})
        .exec(function (err, catList) {
            if (err) {
                console.dir(err)
            }
            var catObjIdsList = [];
            _.each(catList, function (catObj) {
                catObj['category'] = catObj['previous'].category;
                catObj['name'] = catObj['previous'].category;
                catObj['isMandatory'] = catObj['previous'].isMandatory;
                catObj['isHidden'] = catObj['previous'].isHidden;
                catObj.docIsModified = true;
                catObjIdsList.push(catObj._id);
                catObj.save(function (err, cat) {});
            });
            mongoose.models.subcategories.remove({$or:[{camera: body.camera},{category:{$in:catObjIdsList}}],isPrimary:2}, function (err) {
                mongoose.models.subcategories.update({$or:[{camera: body.camera},{category:{$in:catObjIdsList}}],isPrimary:1},{$set: {isPrimary:2,camera:body.camera}},{multi: true},function (err, updated){
                    mongoose.models.subcategories.update({$or:[{camera: body.camera},{category:{$in:catObjIdsList}}],isPrimary:0},{$set: {isPrimary:1,camera:body.camera}},{multi: true},function (err, updated){
                        if(updated>0)
                        {
                            return res.status(200).json('Updated Succesfully');
                        }else if(updated == 0)
                        {
                            mongoose.models.subcategories.update({camera: body.camera,isPrimary:2},{$set: {isPrimary:1}},{multi: true},function (err, updated){
                                return res.status(200).json('Updated Succesfully');
                            });
                        }

                    });
                });
            });
        });
};


exports.getCatsAndUpdateSucatsSeqsByProject = function (req, res) {
    var body = req.body;
    var subCatSettings = {
        collection: 'subcategories',
        field: 'subcategoryId',
        query: {}
    };
    mongoose.models.categories.find({categoryId:body.categoryId})
        .exec(function (err, catList) {
            if (err) {
                console.dir(err)
            }
            var catIdsList = [];
            if(catList.length>0)
            {
                for(var len=0;len<catList.length;len++)
                {
                    catIdsList.push(catList[len]._id);
                    mongoose.models.subcategories.find({category:{$in:catIdsList}})
                        .sort({ orderId: 1 })
                        .exec(function (err, subCatsList) {
                            if (err) {
                                console.dir(err)
                            }
                            for(var subCatLen=0;subCatLen<subCatsList.length;subCatLen++)
                            {
                                var subCat = subCatsList[subCatLen];
                                subCat.subcategoryId = config.getSubCatId();
                                subCat.save();
                            }
                            return res.status(200).json({ success: "success"})
                        });
                }
            }else
            {
                return res.status(200).json({ success: "success"})
            }

        });
};

