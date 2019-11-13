var mongoose = require('mongoose')
  , config = require('../config')
  , helper = require('../utils/helper')
  , _ = require('lodash')
	, moment = require('moment')
	, fs = require('fs');
var EventBus = require('../utils/EventBus');

exports.getClients = function (req, res) {
   var body = req.body;
   mongoose.models.clients.find(body).sort({ clientsId: -1 }).exec(function (err, icons) {
        if (err) {
            return res.status(500).json({error: 'Error with mongoDB connection.'});
        }
        var clientsList = [];
        _.each(icons, function (client) {
            clientsList.push(client);
        });
        return res.status(200).json(clientsList);
    });
};

exports.updateClient = function (req, res) {
    var body = req.body;
    var requiredFields = {
        _id: ''
    };

    var missing = helper.checkMissingFields(requiredFields, body);
    if (missing) {
        return res.status(400).json({success: false, error: 'missing ' + missing});
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

exports.createCatsFromBaseProjectToProject = function (req, res) {
    var body = req.body;
    mongoose.models.clients.findOne({_id:body.project}, function (err, client) {
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
            mongoose.models.categories.find({isbase:true})
                .exec(function (err, catList) {
                    if (err) {
                        console.dir(err)
                    }
                    for(var len=0;len<catList.length;len++)
                    {
                        EventBus.emit('SaveNewCategory',nextCatId++,client,catList[len]);//createcategoryevent.js
                    }
                    return res.status(200).json(client);
                });
        });
    });
};

exports.createProjectCatsFromBaseProject = function (req, res) {
    var body = req.body;
    var subCatSettings = {
        collection: 'subcategories',
        field: 'subcategoryId',
        query: {}
    };
    mongoose.models.clients.findOne({_id:body.project}, function (err, client) {
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

                mongoose.models.subcategories.remove({project:body.project}, function (err) {
                    if (err)
                    {
                        console.log(err);
                        console.log('controller/clients.js 152')
                    }
                });

                mongoose.models.categories.remove({project:body.project}, function (err) {
                    if (err)
                    {
                        console.log(err);
                        console.log('controller/clients.js 160')
                    }
                });

                mongoose.models.categories.find({isbase:true})
                    .sort({ orderId: 1 })
                    .exec(function (err, catList) {
                        if (err)
                        {
                            console.log(err);
                            console.log('controller/clients.js 232')
                        }
                        for(var len=0;len<catList.length;len++)
                        {
                            EventBus.emit('SaveNewCategory',nextCatId++,client,catList[len]);//createcategoryevent.js
                        }
                        return res.status(200).json(client);
                    });
            });

        });
    });
};


exports.saveClient = function (req, res) {
    var body = req.body;
    var requiredFields = {
        clientcode: ''
    };

    var missing = helper.checkMissingFields(requiredFields, body);
    if (missing) {
        return res.status(400).json({ success: false, error: 'missing ' + missing });
    }

    var subCatSettings = {
        collection: 'subcategories',
        field: 'subcategoryId',
        query: {}
    };

    var maxItemId, videoId;
    var settings = {
        collection: 'clients',
        field: 'clientsId',
        query: {}
    };

    mongoose.models.clients.find({ clientcode: body.clientcode }, function (err, clientExists) {
        if (err) {
            return res.status(500).json({ success: false, error: 'Error with mongoDB connection.' });
        }
        if(clientExists.length == 0)
        {
            helper.getNextId(settings, function (err, nextId) {
                if (err)
                    console.log('getNextId Error', err);
                maxItemId = nextId;
                var client = new mongoose.models.clients();

                for (prop in req.body) {
                    if(prop !== '_id')
                    {
                        client[prop] = req.body[prop];
                    }
                }

                client.clientsId = maxItemId++;
                client.clientDestFolder = config.getClientDestFolder()+client.destFolder;
                client.destFolder = config.getAdminDestFolder()+client.destFolder;
                client.clientname = client.clientcode;
                client.save(function (err, client) {
                    if (!err) {
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
                                mongoose.models.categories.find({isbase:true})
                                    .sort({ orderId: 1 })
                                    .exec(function (err, catList) {
                                        if (err) {
                                            console.dir(err)
                                        }
                                        for(var len=0;len<catList.length;len++)
                                        {
                                            EventBus.emit('SaveNewCategory',nextCatId++,client,catList[len]);//utils/createcategoryevent.js
                                        }
                                        EventBus.emit('CreateNewClient',client);//utils/users.js
                                        return res.status(200).json(client);
                                    });
                            });

                        });
                    }
                    else {
                        return res.status(500).json({ success: false, error: 'Something went wrong, Please try after some time' }, err);
                    }
                });
            });
        }else
        {
            return res.status(400).json({ success: false, error: 'Client already exists..! Please choose a different client code. ' });
        }
    });
};

exports.removeIconByClientId = function (req, res,done) {

    mongoose.models.icons.remove({_id: req.params.iconId}, function (err) {
        if (err) {
            return res.status(500).json({success: false, error: 'Error with mongoDB connection.'});
        }
        return res.status(200).json({success: true, msg: 'Icon Discarded'});
    });
};

exports.updateClientById = function (req, res) {
    var body = req.body;

    var requiredFields = {
        _id: ''
    };

    var missing = helper.checkMissingFields(requiredFields, body);
    if (missing) {
        return res.status(400).json({success: false, error: 'missing ' + missing});
    }

    mongoose.models.clients.find({clientcode: body.clientcode,_id:{$nin:[body._id]}}, function (err, clientExists) {
        if (err) {
            return res.status(500).json({success: false, error: 'Error with mongoDB connection.'});
        }
        if (clientExists.length == 0) {
            mongoose.models.clients.findOne({_id: body._id}, function (err, client) {
                if (err) {
                    return res.status(500).json({success: false, error: 'Error with mongoDB connection.'});
                }

                if (client) {
                    for (prop in req.body.data) {
                        if (prop !== '_id') {
                            client[prop] = req.body.data[prop];
                        }
                    }

                    client.clientname = client.clientcode;
                    client.docIsModified = true;
                    client.save(function (err, client) {
                        if (!err) {
                            return res.status(200).json({success: true, msg: 'Client Updated succesfully'});
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
                        error: 'No Client exists with clientId: ' + body.data.clientsId
                    });
                }
            });
        }else
        {
            return res.status(400).json({ success: false, error: 'Client already exists..! Please choose a different client code.'});
        }
    });
};

exports.removeClientsByIdList = function (req, res) {
    var clientArrayObj = req.body;
    var returnMsg= {success: true, msg: 'Client Deleted succesfully'};
    mongoose.models.videos.distinct('client',{project:{$in:clientArrayObj}}, function (errs, clients) {
        if (errs) {

        } else {
            if(clients.length>0)
            {
                return res.status(200).json({success: false, error: 'Project Has Cameras. Please Delete Cameras First.'});
            }else {
                mongoose.models.clients.remove({_id: {$in: clientArrayObj}, isbase: false}, function (errs, clientDeleted) {
                    if (errs) {
                    } else {
                        return res.status(200).json(returnMsg);
                    }
                });
            }

        }
    });
}


