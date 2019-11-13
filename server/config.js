'use strict';
var _ = require('lodash'),
    fs = require('fs'),
    redis = require('redis'),
    mongoose = require('mongoose');

var mongoConnection = {};

var host;
var envType = "DEMO"; //LOCAL";
//envType = process.env.ENV;
var secretKey = "IDEOTICS-PROD-DEV"
var idleTimeOut = { admin: 1200, client: 3600, agent: 900, reviewer: 1200, superreviewer: 1200 };
var recordsPerPage = 50;
var bucketName = "ideoticstest";
var clientDestFolder = "Master/";
var adminDestFolder = "Ideocap/";
var environment = {
    DEMO: { PORT: 8071, ENV: "demo", DATABASE: "dev_ideotics", DBPASSWORD: "ideotics123#" },
    PROD: { PORT: 8069, ENV: "prod", DATABASE: "ideotics", DBPASSWORD: "ideotics123#" },
    LOCAL: { PORT: 8069, ENV: "local", DATABASE: "ideotics", DBPASSWORD: "root" }
};
var videoId = 0;
var subCatId = 0;
exports.getSubCatId = function() {
    return subCatId++;
}

exports.getVideoId = function() {
    return videoId++;
}

exports.setVideoId = function(videosId) {
    if (videoId == 0)
        videoId = videosId;
}

exports.getBucketName = function() {
    return bucketName;
}

exports.getClientDestFolder = function() {
    return clientDestFolder;
}

exports.getAdminDestFolder = function() {
    return adminDestFolder;
}

exports.setSubCatId = function(subCatsId) {
    subCatId = subCatsId;
    console.log('subcatid retrieved::' + subCatsId);
}

exports.getRecordsPerPage = function() {
    return recordsPerPage;
}

var dbOptions = {
    host: 'localhost',
    user: 'root',
    connectionLimit: 20,
    password: environment[envType].DBPASSWORD,
    port: 3306,
    database: environment[envType].DATABASE
};
var poolDbOptions = {
        connectionLimit: 20,
        host: 'localhost',
        user: 'root',
        password: environment[envType].DBPASSWORD,
        port: 3306,
        database: environment[envType].DATABASE
    }
    //debug: true,
    //multipleStatements : true
exports.getSecretkey = function() {
    return secretKey;
}

exports.getPoolDataBaseOptions = function() {
    return poolDbOptions;
}

exports.getDataBaseOptions = function() {
    return dbOptions;
}

exports.getPORT = function() {
    return environment[envType].PORT;
}

exports.getIdleTimeoutByRole = function(role) {
    return idleTimeOut[role];
}

exports.getENV = function() {
    return environment[envType].ENV;
}

exports.createConnection = function(callback) {
    fs.readFile(__dirname + '/files/mongohq.json', function(err, mongohq) {
        if (!err) {

            var mongoJson = JSON.parse(mongohq);
            host = mongoJson[environment[envType].ENV];

            console.log("host###############################################" + host);

            // mongoose.connect(host, { useNewUrlParser: true }, { auth: { authdb: "admin" } });

            mongoose.connect(host, {
                    useUnifiedTopology: true,
                    useNewUrlParser: true,
                    useFindAndModify: false,
                    useCreateIndex: true
                }, { auth: { authdb: "admin" } })
                .then(() => console.log('DB Connected!'))
                .catch(err => {
                    console.log("DB Connection Error-------------------------------------:" + err.message);
                });

            console.log('Connections established::' + host);
            return callback();
        } else {
            console.error(err);
        }
    });
};

var redisClient = redis.createClient();
redisClient.on('error', function(e) {
    console.log(e.toString());
    console.log('Error Connecting to Redis');
});

//clearing all the existing sessions
redisClient.flushdb(function(err, succeeded) {
    console.log("Flush Redis Db. Clearing all the existing sessions.");
    console.log(succeeded);
})

exports.getClient = function() {
    return redisClient;
};

exports.host = host;