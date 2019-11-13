var mongoose = require('mongoose')
  , config = require('../config')
  , helper = require('../utils/helper')
  , _ = require('lodash')
	, fs = require('fs');

exports.getIcons = function (req, res) {
   mongoose.models.icons.find({}, function (err, icons) {
        if (err) {
            return res.status(500).json({error: 'Error with mongoDB connection.'});
        }
        var iconsList = [];
        _.each(icons, function (icon) {
            iconsList.push(icon);
        });
        return res.status(200).json(iconsList);
    });
};

exports.updateIcon = function (req, res) {
    var body = req.body;
    var requiredFields = {
        _id: ''
    };

    var missing = helper.checkMissingFields(requiredFields, body);
    if (missing) {
        return res.status(400).json({success: false, error: 'missing ' + missing});
    }

    var dir = __dirname + '/../../public/assets/img/';

    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }

    var dataImageFile = body.iconUrl;

    var imageName = "upload_";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    var imgExists = false;
    var imageUrlName = '';
    if(dataImageFile !== null && dataImageFile !== undefined  && dataImageFile !== 'undefined' && dataImageFile !== '')
    {
        for( var i=0; i < 32; i++ )
            imageName += possible.charAt(Math.floor(Math.random() * possible.length));

        dataImageFile = dataImageFile.replace(/^data:image\/\w+;base64,/, "");
        var buf = new Buffer(dataImageFile, 'base64');
        fs.writeFile(dir+imageName+'.gif', buf);

        imageUrlName = '/assets/img/'+imageName+'.gif';
        imgExists = true;
    }

    mongoose.models.icons.findOne({name: body.name,_id: { $nin: [body._id] }}, function (err, icon) {
        if (err) {
            return res.status(500).json({success: false, error: 'Error with mongoDB connection.'});
        }

        if (!icon) {
            mongoose.models.icons.findOne({_id: body._id}, function (err, icon) {
                if (err) {
                    return res.status(500).json({success: false, error: 'Error with mongoDB connection.'});
                }

                if (icon) {
                    for (prop in req.body) {
                        if(prop !== '_id' && prop !== 'iconUrl')
                        {
                            icon[prop] = req.body[prop];
                        }
                    }

                    if(imgExists)
                    {
                        icon.imageUrl = imageUrlName;
                    }

                    icon.docIsModified = true;
                    icon.save(function (err, icon) {
                        if (!err) {
                            return res.status(200).json(icon);
                            //return res.status(200).json({success: true, msg: 'Option Updated succesfully'});
                        }
                        else {
                            return res.status(500).json({success: false, error: 'Something went wrong, Please try after some time'}, err);
                        }
                    });
                }
                else {
                    return res.status(400).json({success: false, error: 'No Option exists with optionId: ' + body.optionId});
                }
            });
        }
        else {
            return res.status(200).json({success: false, error: 'Icon already exists..! Please choose a different Icon name. '});
        }
    });
};


exports.getListOfIcons = function (req, res) {
    var body = req.body;

    var catListNamesList = body.catListName;
    mongoose.models.icons.find({name: { $nin: catListNamesList }}, function (err, icons) {
        if (err) {
            return res.status(500).json({error: 'Error with mongoDB connection.'});
        }
        var iconsList = [];
        _.each(icons, function (icon) {
            iconsList.push(icon);
        });
        return res.status(200).json(iconsList);
    });
};

exports.saveIcon = function (req, res) {
    var body = req.body;
    var dir = __dirname + '/../../public/assets/img/';

    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }

    var dataImageFile = body.iconUrl;

    var imageName = "upload_";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 32; i++ )
        imageName += possible.charAt(Math.floor(Math.random() * possible.length));

    dataImageFile = dataImageFile.replace(/^data:image\/\w+;base64,/, "");
    var buf = new Buffer(dataImageFile, 'base64');
    var maxItemId;
    var settings = {
        collection: 'icons',
        field: 'iconsId',
        query: {}
    };

    mongoose.models.icons.findOne({name: body.name}, function (err, icon) {
        if (err) {
            return res.status(500).json({success: false, error: 'Error with mongoDB connection.'});
        }

        if (!icon) {

            helper.getNextId(settings, function (err, nextId) {
                if (err)
                    console.log('getNextId Error', err);
                maxItemId = nextId;

                mongoose.models.icons.find({}, function (err, icons) {
                    if (err) {
                        return res.status(500).json({error: 'Error with mongoDB connection.'});
                    }
                    var iconsList = [];
                    _.each(icons, function (icon)
                    {
                        if(icon.iconsId == null || icon.iconsId == undefined)
                        {
                            icon.iconsId = maxItemId++;
                            icon.save();
                        }
                    });
                });

                fs.writeFile(dir+imageName+'.gif', buf);

                var imageUrlName = '/assets/img/'+imageName+'.gif';

                icon = new mongoose.models.icons();

                icon.name = body.name;
                icon.imageUrl = imageUrlName;
                icon.iconsId = maxItemId;

                icon.save(function (err, icon) {
                    if (!err) {
                        return res.status(200).json(icon);
                    }
                    else {
                        return res.status(500).json({success: false, error:'Something went wrong, Please try after some time'}, err);
                    }
                });
            });
        }
        else {
            return res.status(200).json({success: false, error: 'Icon already exists..! Please choose a different Icon name. '});
        }
    });
};

exports.getSubCatCountByIcon = function (req, res,done) {
    mongoose.models.subcategories.count({"type.icon":req.params.iconId},function (err, sucatCount){
       if(err)
       {
           console.log(err);
       }
       return res.status(200).json({success: true, count:sucatCount});
    });
}
exports.removeIconByIconId = function (req, res,done) {

    mongoose.models.icons.findOne({_id: req.params.iconId}, function (err, icon) {
        if (err) {
            return res.status(500).json({error: 'Error with mongoDB connection.'});
        }

        mongoose.models.icons.remove({_id: req.params.iconId}, function (err) {
            if (err) {
                return res.status(500).json({success: false, error: 'Error with mongoDB connection.'});
            }
            mongoose.models.subcategories.update({"type.icon":req.params.iconId},{"$pull":{"type":{"icon":req.params.iconId}}}
                ,{ multi: true }
                ,function (err, updated){
                    if(err)
                    {
                        console.log(err);
                    }
                    return res.status(200).json({success: true, msg: 'Icon Discarded'});
            });
       });
    });
};



