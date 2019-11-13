'use strict';
var _ = require('lodash')
  , mongoose = require('mongoose')
  , config = require('../config')
  , CronJob = require('cron').CronJob
  , userStatus = require('../user.status')
  , encryptor = require('simple-encryptor')({key: config.getSecretkey(),hmac: false,debug: false});
var EventBus = require('./EventBus');

new CronJob('00 00 00 * * *', function() {
    console.log("Cron job called:"+(new Date()))
    EventBus.emit('Videos.calculateAgentsTimeOnUnderProcessingVideos');
}, null, true, 'Asia/Kuala_Lumpur');

new CronJob('00 05 00 * * *', function() {
    console.log("Sending Report:"+(new Date()))
    EventBus.emit('Videos.prepareReportAndSendMail');
}, null, true, 'Asia/Kuala_Lumpur');

new CronJob('*/10 * * * * *', function() {
    config.getClient().keys("*", function (err, arrayOfKeys) {
        if(arrayOfKeys != null && arrayOfKeys != undefined && arrayOfKeys.length>0)
        {
            arrayOfKeys.forEach( function (key) {
                config.getClient().ttl(key, function(err, expiryTime) {
                    if(expiryTime<21)
                    {
                        changeLoginSessionStatus(key);
                    }
                });
            });
        }
    });
}, null, true, 'America/Los_Angeles');

var checkMissingFields = function (fields, body) {

  if (Array.isArray(body) === true) {
    var missingElement;
    _.each(body, function (item) {
      missingElement = checkMissingFields(fields, item);
      if (missingElement) {
        return false;
      }
    });
    return missingElement;
  }

  var missing;
  _.each(fields, function (value, field) {
    if (_.has(body, field) === false || body[field] === undefined || body[field] === null || body[field].length < 1) {
      missing = value ? value : field;
      return false;
    }
  });
  return missing;
};

var isNull = function (item) {
  return (typeof item === 'undefined' || item === null || item.length < 1);
};


var getNextId = function (settings, callback) {
  var sort = {};
  sort[settings.field] = -1;
  mongoose.models[settings.collection].find(settings.query).sort(sort).limit(1).exec(function (err, result) {
  	if (err)
      return callback(err, null);
    var id = result.length > 0 ? result[0][settings.field] : 0;
    return callback(null, ++id);
	});
};

var canAccessRoute = function requireRole(role) {
  return function(req, res, next) {
    var session = req.headers.session_id;
    if (session) {
      try {

        config.getClient().get(session, function (err, reply) {

          if (err) {
            console.log('Error on redis get..');
            return res.status(500).json('Some thing went wrong, please try after some time');
          }
         if (reply) {

           var sessionObj = {};
           try {
             sessionObj = JSON.parse(reply);
           }catch(e) {
             console.log(e);
           }
           if(sessionObj.role && sessionObj.role === 'superreviewer')
           {
               if(_.indexOf(role, 'reviewer') != -1)
               {
                   role.push('superreviewer');
               }
           }
           if(sessionObj.role && _.indexOf(role, sessionObj.role) != -1)
           {
               exports.setSessionExpire(session,sessionObj.role);
               //config.getClient().expire(session, 120, function() {});
               return next();
           }
           else
           {
             res.status(403).json({ session: "Access denied", message: 'Unauthorized Access...' });
           }
          }

          return res.status(401).json({ session: "Access denied or Session expired", message: 'Unauthorized Access or User Session Expired' });
        });
      } catch (exception) {
        return res.status(500).json('Some thing went wrong, please try after some time');
      }
    }
    else {
      return res.status(401).json({ session: "Access denied", message: 'Session Id has not provided with this request.' });
    }
  }
}

var changeLoginSessionStatus = function(sessionkey)
{
    config.getClient().get(sessionkey, function (err, reply) {

        if (err)
        {
            console.log('Error on redis get..');
        }

        if (reply) {

            var sessionObj = {};
            try
            {
                sessionObj = JSON.parse(reply);
            }catch(e) {
                console.log(e);
            }
            if(sessionObj.userId)
            {
                userStatus.setLoggedInStatus(sessionkey,sessionObj.userId,false,'',true);
            }
        }
    });
}

var setSessionExpire = function(session_id,role)
{
    if(role && role !== 'client')
    {
        config.getClient().expire(session_id, config.getIdleTimeoutByRole(role), function() {});
    }
}

var encryptKey = function(keyToEncrypt)
{
    return (encryptor.encrypt(keyToEncrypt));
}

var decryptKey = function(encryptedKey)
{
    return (encryptor.decrypt(encryptedKey));
}

exports.getNextId = getNextId;
exports.checkMissingFields = checkMissingFields;
exports.isNull = isNull;
exports.canAccessRoute = canAccessRoute;
exports.changeLoginSessionStatus = changeLoginSessionStatus;
exports.setSessionExpire = setSessionExpire;
exports.encryptKey = encryptKey;
exports.decryptKey = decryptKey;
