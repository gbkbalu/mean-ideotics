'use strict';

var _ = require('lodash');
var fs = require('fs');
var formidable = require('formidable');

var validationError = function(res, err) {
    return res.json(422, err);
};


//upload file
exports.uploadFile = function(req, res) {
    console.dir('file upload bala')
    var form = new formidable.IncomingForm();
    form.uploadDir = __dirname ;
    form.keepExtensions = true;
    console.dir(form.uploadDir)
    form.parse(req, function(err, fields, files) {
        /*var newFile = new File({
            title: files.file.name,
            path: '/upload/' + files.file.path.replace(/^.*[\\\/]/, ''),
            server: 'local',
            mimeType: files.file.type,
            size: files.file.size,
            user: (typeof req.user !== 'undefined') ? req.user._id : null
        });
        newFile.save(function(err) {
            if (err)
                return validationError(res, err);
            return res.json(newFile);
        });*/
    });
};

//remove file
exports.deleteFile = function(req, res) {
    fs.unlink(__dirname + '/../../../client' + req.body.filePath, function(err) {
        if (err) {

        } else {

        }
    });
};