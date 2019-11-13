var  vAws= require('../controllers/aws');
var  vCameras= require('../controllers/cameras');
var  vReport= require('../controllers/reports');
var helper = require('../utils/helper');

module.exports = exports = function (options) {
    'use strict';

    var app = options.app;

    app.get('/api/aws', helper.canAccessRoute(['admin','agent','client','reviewer','superreviewer']),vAws.getAllAwsRecords);
    app.post('/api/aws/getAwsByAwsType', helper.canAccessRoute(['admin','agent','client','reviewer','superreviewer']),vAws.getAwsByAwsType);
    app.post('/client/api/aws/getAwsByAwsType', vAws.getAwsByAwsType);
    app.post('/client/api/aws/saveMetaFileContent', vAws.saveMetaFileContent);
    app.post('/logs/downloadLogFiles', vReport.downloadLogFiles);
    app.get('/api/aws/getInstanceDetails', helper.canAccessRoute(['admin']),vAws.getInstanceDetails);
    //app.get('/api/aws/getInstanceDetails', helper.canAccessRoute(['admin']),vCameras.getInstanceDetails);
    app.get('/api/aws/findMyIp', helper.canAccessRoute(['admin']),vAws.findMyIp);
    app.post('/api/aws/stopOrStartInstance', helper.canAccessRoute(['admin']),vAws.stopOrStartInstance);
    app.post('/api/aws/findIpLocation', helper.canAccessRoute(['admin']),vAws.findIpLocation);
    app.post('/api/aws/addIpToAccessMongo', helper.canAccessRoute(['admin']),vAws.addIpToAccessMongo);
    app.post('/api/aws/getAwsSecuirtyGroupInformation', helper.canAccessRoute(['admin']),vAws.getAwsSecuirtyGroupInformation);
    app.post('/api/aws/authenticateUrl', helper.canAccessRoute(['admin','agent','client','reviewer','superreviewer']),vAws.authenticateUrl);
    app.post('/api/aws/getObjectsList', helper.canAccessRoute(['admin','agent','client','reviewer','superreviewer']),vAws.getObjectsList);
    app.post('/api/aws/getObjectsDetailContent', helper.canAccessRoute(['admin','agent','client','reviewer','superreviewer']),vAws.getObjectsDetailContent);
};
