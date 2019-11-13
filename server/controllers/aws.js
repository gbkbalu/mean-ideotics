var mongoose = require('mongoose')
    , config = require('../config')
    , helper = require('../utils/helper')
    , _ = require('lodash')
    , moment = require('moment')
    , fs = require('fs');
var AWS = require('aws-sdk');
var AWSEC2 = require('aws-sdk');
var iplocation = require('iplocation')
var bcryptjs = require('bcryptjs')

var typeOfAWS = config.getENV();

exports.getAllAwsRecords = function (req, res) {
    mongoose.models.aws.find({}, function (err, awsRecords) {
        if (err) {
            return res.status(500).json({error: 'Error with mongoDB connection.'});
        }
        var awsList = [];
        _.each(awsRecords, function (aws) {
            awsList.push(aws);
        });
        return res.status(200).json(awsList);
    });
};

exports.getAwsByAwsType = function (req, res) {
    mongoose.models.aws.find({awsType: typeOfAWS}, function (err, awsRecord) {
        if (err) {
            return res.status(500).json({error: 'Error with mongoDB connection.'});
        }

        return res.status(200).json(awsRecord);
    });
};

exports.saveMetaFileContent = function (req, res) {
    var body = req.body;
    AWS.config = new AWS.Config();
    if(body.bucketName == 'ideotics-ideoload-in')
    {
	    AWS.config.update({region:'ap-south-1',accessKeyId: '', secretAccessKey: '' });
    }else
	{
		AWS.config.update({region:'ap-southeast-1',accessKeyId: '', secretAccessKey: '' });
	}
    var bucket = new AWS.S3({ params: { Bucket: body.bucketName,ACL: 'authenticated-read'} });

    var clientUploadDir = {Bucket: body.bucketName ,Key: body.destinationFile,ContentType: '',Body: body.metaContent};
    var s3DelObj = new AWS.S3();
    var params = {  Bucket: body.bucketName, Key: body.destinationFile };
    
    bucket.upload(clientUploadDir, function (err, data) {
        return res.status(200).json("Uploaded successfully");
    }).on('httpUploadProgress',function(progress) {
    });
};

exports.getInstanceDetails = function(req,res)
{
    var resultObj = [];
    var outputObj = {Name:'',State:'',InstanceId:'',GroupId:'',GroupName:''};
    AWS.config = new AWS.Config();
    var ec2 = new AWSEC2.EC2({region:'ap-southeast-1',accessKeyId: '', secretAccessKey: '', apiVersion: '2016-11-15' });
    var params = {DryRun: false};
    ec2.describeInstances(params, function(err, data) {
        if (err) {
            console.log("Error", err.stack);
            console.log(err);
            return res.status(500).json(err.stack);
        } else {
            for(var len=0;len<data.Reservations.length;len++)
            {
                if(data.Reservations[len].Instances && data.Reservations[len].Instances.length>0)
                {
                    var instanceObj = data.Reservations[len].Instances[0];

                    if(instanceObj.Tags[0]['Value'] !== 'wiki' || instanceObj.InstanceId !== 'i-0d89af6f5fefb51fd')
                    {
                        outputObj = {Name:instanceObj.Tags[0]['Value'],State:instanceObj['State']['Name'],InstanceId:instanceObj.InstanceId};

                        if(instanceObj.SecurityGroups && instanceObj.SecurityGroups.length>0)
                        {
                            outputObj['GroupId'] = instanceObj.SecurityGroups[0].GroupId;
                            outputObj['GroupName'] = instanceObj.SecurityGroups[0].GroupName
                        }

                        resultObj.push(outputObj);
                    }
                }
            }

            return res.status(200).json(resultObj);
        }
    });
}

exports.stopOrStartInstance = function(req,res)
{
    AWS.config = new AWS.Config();
    var body = req.body;
    AWSEC2.config.update({ accessKeyId: '', secretAccessKey: '' });
    AWSEC2.config.region = 'ap-southeast-1';

    // Create EC2 service object
    var ec2 = new AWSEC2.EC2({});

    var params = {
        InstanceIds: [body.InstanceId],
        DryRun: true
    };
    var securedPwd = body.securedPwd;

    mongoose.models.aws.find({instance:body.InstanceId}, function (err, awsRecord) {
        if (err) {
            return res.status(500).json({error: 'Error with mongoDB connection.'});
        }
        if(awsRecord && awsRecord.length>0)
        {
            bcryptjs.compare(securedPwd, awsRecord[0].hashpassword, function(err, isMatch) {
                if (err) {
                    return res.status(200).json({message:"Invalid Type"});
                }
                if(isMatch)
                {
                    if (body.processType.toUpperCase() === "START1") {
                        // call EC2 to start the selected instances
                        ec2.startInstances(params, function(err, data) {
                            if (err && err.code === 'DryRunOperation') {
                                params.DryRun = false;
                                ec2.startInstances(params, function(err, data) {
                                    if (err) {
                                        console.log("Error", err);
                                    } else if (data) {
                                        return res.status(200).json(data);
                                    }
                                });
                            } else {
                                console.log("You don't have permission to start instances.");
                                return res.status(200).json({message:"You don't have permission to stop instances"});
                            }
                        });
                    } else if (body.processType.toUpperCase() === "STOP1") {
                        // call EC2 to stop the selected instances
                        ec2.stopInstances(params, function(err, data) {
                            if (err && err.code === 'DryRunOperation') {
                                params.DryRun = false;
                                ec2.stopInstances(params, function(err, data) {
                                    if (err) {
                                        console.log("Error", err);
                                    } else if (data) {
                                        return res.status(200).json(data);
                                    }
                                });
                            } else {
                                console.log("You don't have permission to stop instances");
                                return res.status(200).json({message:"You don't have permission to stop instances"});
                            }
                        });
                    }else
                    {
                        return res.status(200).json({message:"Invalid Type"});
                    }
                }else
                {
                    return res.status(200).json({password:"invalid",message:"Invalid Credentials"});
                }
            });
        }else
        {
            return res.status(200).json({password:"invalid",message:"Invalid Credentials"});
        }
    });
}

exports.addIpToAccessMongo = function(req,res)
{
    AWS.config = new AWS.Config();
    var userIpAddress = req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;

    var body = req.body;
    userIpAddress = req.body.ipAddress;
    AWSEC2.config.update({ accessKeyId: '', secretAccessKey: '' });
    AWSEC2.config.region = 'ap-southeast-1';
    var ec2 = new AWSEC2.EC2({});

    var paramsIngress = {
        GroupName: body.GroupName,
        IpPermissions:[
            {
                IpProtocol: "tcp",
                FromPort: 27017,
                ToPort: 27017,
                IpRanges: [{"CidrIp":userIpAddress+"/32"}]
            }
        ]
    };

    var securedPwd = body.securedPwd;
    mongoose.models.aws.find({instance:body.InstanceId}, function (err, awsRecord) {
        if (err) {
            return res.status(500).json({error: 'Error with mongoDB connection.'});
        }
        if(awsRecord && awsRecord.length>0)
        {
            bcryptjs.compare(securedPwd, awsRecord[0].hashpassword, function (err, isMatch) {
                if (err) {
                    return res.status(200).json({message: "Invalid Type"});
                }
                if (isMatch) {
                    ec2.authorizeSecurityGroupIngress(paramsIngress, function(err, data) {
                        if (err) {
                            return res.status(200).json({message:"Ip doesn't has been added"});
                        } else {
                            return res.status(200).json({message:"Your ip has been added successfully"});
                        }
                    });
                }else
                {
                    return res.status(200).json({password:"invalid",message:"Invalid Credentials"});
                }
            })
        }else
        {
            return res.status(200).json({password:"invalid",message:"Invalid Credentials"});
        }

    })

}

exports.findIpLocation = function(req,res)
{
    iplocation('183.82.99.166', function (error, result) {
        if (error) {
            return res.status(500).json(error);
        } else {
            return res.status(200).json(result);
        }
    })
}

exports.findMyIp = function(req,res)
{
    var userIpAddress = req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;
    return res.status(200).json({ipAddress:userIpAddress});
}

exports.getAwsSecuirtyGroupInformation = function(req,res)
{
    AWS.config = new AWS.Config();
    var body = req.body;
    AWSEC2.config.update({ accessKeyId: '', secretAccessKey: '' });
    AWSEC2.config.region = 'ap-southeast-1';
    // Create EC2 service object
    var ec2 = new AWSEC2.EC2({});

    var params = {
        GroupIds: [body.GroupId]
    };

    // Retrieve security group descriptions
    ec2.describeSecurityGroups(params, function(err, data) {
        if (err) {
            console.log("Error", err);
        } else {
            console.log("Success", JSON.stringify(data.SecurityGroups));
            return res.status(200).json(data);
        }
    });
}

exports.authenticateUrl = function(req,res)
{
    var paramsObj = req.body.paramsObj;
    AWS.config = new AWS.Config();
    AWS.config.update({endpoint:'s3.ap-southeast-1.amazonaws.com', accessKeyId: 'AKIAYCJFUJ32TTWQBWFG', secretAccessKey: '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' });
    if(paramsObj.Bucket == 'ideotics-ideocap-in')
    {
        AWS.config.update({endpoint:'s3.ap-south-1.amazonaws.com', signatureVersion:'v4',region:'ap-south-1',accessKeyId: 'AKIAYCJFUJ32TTWQBWFG', secretAccessKey: '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' });
    }

    var bucket = new AWS.S3({ params: { Bucket: paramsObj.Bucket,ACL: 'authenticated-read'} });
    bucket.getSignedUrl('getObject', paramsObj, function (err, signedUrl)
    {
        if(err)
        {
            return res.status(200).json({errorMsg:"Unable To Authorize"});
        }
        if (signedUrl)
        {
            return res.status(200).json({signedUrl:signedUrl});
        }
    });

}


exports.getObjectsList = function(req,res)
{
    var paramsObj = req.body.paramsObj;
    AWS.config = new AWS.Config();
    AWS.config.update({endpoint:'s3.ap-southeast-1.amazonaws.com',region:'ap-southeast-1', accessKeyId: '', secretAccessKey: '' });
    if(paramsObj.Bucket == 'ideotics-ideoload-in')
    {
        AWS.config.update({endpoint:'s3.ap-south-1.amazonaws.com', signatureVersion:'v4',region:'ap-south-1',accessKeyId: '', secretAccessKey: '' });
    }

    var bucket = new AWS.S3({ params: paramsObj });
    bucket.listObjects({Bucket: paramsObj.Bucket}, function (err, objList)
    {
        if(err)
        {
            return res.status(200).json({errorMsg:"Unable To Authorize"});
        }
        return res.status(200).json(objList);
    });
}

exports.getObjectsDetailContent = function(req,res)
{
    var paramsObj = req.body.paramsObj;
    AWS.config = new AWS.Config();
    AWS.config.update({endpoint:'s3.ap-southeast-1.amazonaws.com', accessKeyId: '', secretAccessKey: '' });
    if(paramsObj.Bucket == 'ideotics-ideoload-in')
    {
        AWS.config.update({endpoint:'s3.ap-south-1.amazonaws.com', signatureVersion:'v4',region:'ap-south-1',accessKeyId: '', secretAccessKey: '' });
    }

    var bucket = new AWS.S3({ params: {Bucket:paramsObj.Bucket}});
    bucket.getObject(paramsObj, function (err, objectContent)
    {
        if(err)
        {
            return res.status(200).json({errorMsg:"Unable To Authorize"});
        }
        var str = String.fromCharCode.apply(null, objectContent.Body);
        return res.status(200).json({content:str});
    });
}
