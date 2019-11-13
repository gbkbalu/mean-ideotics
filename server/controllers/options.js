var mongoose = require('mongoose')
  , config = require('../config')
  , helper = require('../utils/helper')
  , _ = require('lodash')
	, moment = require('moment')
	, fs = require('fs')

exports.newOption = function (req, res) {
  var body = req.body;
  var requiredFields = {
    name: ''
  };

  var missing = helper.checkMissingFields(requiredFields, body);
  if (missing) {
    return res.status(400).json({success: false, error: 'missing ' + missing});
  }
  var maxItemId,optionId;
var settings = {
		collection: 'options',
		field: 'optionId',
		query: {}
	};
	
	helper.getNextId(settings, function(err, nextId) {
		if (err)
			console.log('getNextId Error', err);
		maxItemId = nextId;
      mongoose.models.options.findOne({name: body.name}, function (err, option) {
        if (err) {
          return res.status(500).json({success: false, error: 'Error with mongoDB connection.'});
        }

        if (!option) {
          option = new mongoose.models.options();
          option.optionId = maxItemId++;
          option.name = body.name;
          option.imageUrl = body.imageUrl;
          option.category = body.category;
          option.subCategory = body.subCategory;
          option.dateCreated = Date.now();
          option.save(function (err, option) {
            if (!err) {
              return res.status(200).json({success: true, msg: 'Option Saved...'});
            }
            else {
              return res.status(500).json({success: false, error:'Something went wrong, Please try after some time'}, err);
            }
          });
        }
        else {
          return res.status(400).json({success: false, error: 'Option already exists..! Please choose a different Option name. '});
        }
      });
	});
};

exports.getOptions = function (req, res) {

  mongoose.models.options.find({}, {_id:0, __v:0}, function (err, options) {
    if (err) {
      return res.status(500).json({error: 'Error with mongoDB connection.'});
    }
    var optionsList = [];
    _.each(options, function (option) {
      optionsList.push(option);
    });
    return res.status(200).json(optionsList);
  });
};

exports.updateOption = function (req, res) {
  var body = req.body;
  var requiredFields = {
    optionId: ''
  };

  var missing = helper.checkMissingFields(requiredFields, body);
  if (missing) {
    return res.status(400).json({success: false, error: 'missing ' + missing});
  }

  mongoose.models.options.findOne({optionId: body.optionId}, function (err, option) {
    if (err) {
      return res.status(500).json({success: false, error: 'Error with mongoDB connection.'});
    }

    if (option) {
      for (prop in req.body) {
        option[prop] = req.body[prop];
      }

      option.docIsModified = true;
      option.save(function (err, option) {
        if (!err) {
          return res.status(200).json({success: true, msg: 'Option Updated succesfully'});
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
};

/*exports.updateCategory = function (req, res) {
    var body = req.body;
    var requiredFields = {
        _id: ''
    };

    var missing = helper.checkMissingFields(requiredFields, body);
    if (missing) {
        return res.status(400).json({success: false, error: 'missing ' + missing});
    }

    mongoose.models.options.findOne({_id: body._id}, function (err, option) {
        if (err) {
            return res.status(500).json({success: false, error: 'Error with mongoDB connection.'});
        }

        if (option) {
            for (prop in req.body) {
                if(prop !== '_id')
                {
                    subCat[prop] = req.body[prop];
                }
            }

            option.save(function (err, option) {
                if (!err) {
                    return res.status(200).json({success: true, msg: 'Option Updated succesfully'});
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
};*/

exports.getOptionsByCategoryName = function (req, res) {

  mongoose.models.options.find({category: req.params.category}, {_id:0, __v:0}, function (err, options) {
    if (err) {
      return res.status(500).json({error: 'Error with mongoDB connection.'});
    }
    var optionsList = [];
    _.each(options, function (option) {
      optionsList.push(option);
    });
    return res.status(200).json(optionsList);
  });
};

exports.getOptionsBySubCategoryName = function (req, res) {

  mongoose.models.options.find({subCategory: req.params.subcategory}, {_id:0, __v:0}, function (err, options) {
    if (err) {
      return res.status(500).json({error: 'Error with mongoDB connection.'});
    }
    var optionsList = [];
    _.each(options, function (option) {
      optionsList.push(option);
    });
    return res.status(200).json(optionsList);
  });
};

exports.getOptionsForCategory = function (req, res) {

 /*   mongoose.models.options.distinct("category", function (err, options) {
        if (err) {
            return res.status(500).json({error: 'Error with mongoDB connection.'});
        }
        console.dir(options);
    });*/

  mongoose.models.options.aggregate([{$match: {category: req.params.categoryName}},{$group: { _id: "$subCategory", type: {$push: {name: '$name', imageUrl:'$imageUrl',optionId:'$optionId'}}}},{$project: { subCategory: "$_id", type: "$type", _id:0}}], function (err, options) {
    if (err) {
      return res.status(500).json({error: 'Error with mongoDB connection.'});
    }
    var optionsList = [];
    _.each(options, function (option) {
      optionsList.push(option);
    });
    return res.status(200).json(optionsList);
  });
};

exports.getListOfImages = function (req, res) {
    var body = req.body;

    /*var option = new mongoose.models.subcategories();
    option.name = "bala";
    option.subCategory = "bala";
    option.category = "56cf2252c628f93d3a7d21c4";
    option.type = ["56ced8f4c628f93d3a7d2138","56ced8f4c628f93d3a7d2139"];
    option.dateCreated = Date.now();
    option.subcategoryId=1;
    option.save(function (err, option) {
        if (!err) {
            console.dir(option)
            //return res.status(200).json({success: true, msg: 'Option Saved...'});
        }
        else {
            console.dir(err)
            //return res.status(500).json({success: false, error:'Something went wrong, Please try after some time'}, err);
        }
    });*/

    /*mongoose.models.subcategories.find({})
        .populate('category')
        .populate('type')
        .exec(function (err, subcatsList) {
        if (err) {
            console.dir(err)
        }
        console.dir(subcatsList)
    });*/

    var catListNamesList = body.catListName;
    mongoose.models.images.find({name: { $nin: catListNamesList }}, function (err, images) {
        if (err) {
            return res.status(500).json({error: 'Error with mongoDB connection.'});
        }
        var imageList = [];
        _.each(images, function (image) {
            imageList.push(image);
        });
        return res.status(200).json(imageList);
    });
};

exports.getListOfSubCats = function (req, res) {
    mongoose.models.subcategories.find({})
        .populate('category')
        .populate('type')
        .exec(function (err, subcatsList) {
            if (err) {
                console.dir(err)
            }
            return res.status(200).json(subcatsList)
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

