'use strict';
var express = require('express'),
    http = require('http'),
    session = require('express-session'),
    RedisStore = require('connect-redis')(session),
    mongoose = require('mongoose'),
    os = require('os'),
    fs = require('fs'),
    _ = require('lodash'),
    util = require('util'),
    moment = require('moment'),
    logger = require('morgan'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    errorHandler = require('errorhandler'),
    multer = require('multer');

/* files */
var models = require('./models/'),
    api = require('./api'),
    config = require('./config'),
    userStatus = require('./user.status');

var app = express();

/****************************/
/*   Express Configuration  */
/****************************/
//console.log(process.env.PORT)
//app.set('port', process.env.PORT || 8069);

app.set('port', config.getPORT() || 8069);
app.set('view engine', 'jade');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/../public'));

// app.use(favicon(__dirname + '/public/img/favicon.ico'));
app.use(logger('dev'));
//app.use(cookieParser());
app.use(methodOverride());
//app.use(bodyParser.json({ extended: true }));

app.use(bodyParser.json({ limit: "100mb" }));
app.use(bodyParser.urlencoded({ limit: "100mb", extended: true, parameterLimit: 500000 }));

//require('./db')

app.use(function(req, res, next) {
    // Website you wish to allow to connect
    res.header('Access-Control-Allow-Origin', req.headers.origin);

    // Request methods you wish to allow
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,session_id,Authorization,Accept');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.header('Access-Control-Allow-Credentials', true);
    res.header("Content-Type", 'application/json;charset=utf-8');

    // Pass to next layer of middleware
    next();
});

app.use(multer({
    dest: 'files/uploads/',
    rename: function(fieldname, filename) {
        return filename + Date.now()
    },
    changeDest: function(dest, req) {
        var folder = req.path.split('/')[2];
        return dest + folder;
    }
}).single('singleInputFileName'));

app.all('/client/*', function(req, res, next) {
    next();
});
app.use('/healthcheck', require('express-healthcheck')());
app.use('/healthcheck', require('express-healthcheck')({
    healthy: function() {
        return { everything: 'is ok' };
    }
}));
app.use('/healthcheck', require('express-healthcheck')({
    test: function() {
        throw new Error('Application is not running');
    }
}));
app.use('/healthcheck', require('express-healthcheck')({
    test: function() {
        return { state: 'unhealthy' };
    }
}));
app.use('/healthcheck', require('express-healthcheck')({
    test: function(callback) {
        callback({ state: 'unhealthy' });
    }
}));

/**** V1 ****/
app.get('/version', function(req, res) {
    res.json(200, { version: '15.01.19.MO' });
});

app.all('/api/*', function(req, res, next) {

    var session = req.headers.session_id;

    if (session) {
        try {
            config.getClient().get(session, function(err, reply) {

                if (err) {
                    console.log('Error on redis get..');
                    return res.status(500).json('Some thing went wrong, please try after some time');
                }

                if (reply) {
                    return next();
                }

                return res.status(401).json({ session: false, message: 'Unauthorized Access' });
            });
        } catch (exception) {
            return res.status(500).json('Some thing went wrong, please try after some time');
        }
    } else {
        console.log('no session existssession')
        return res.status(401).json({ session: false, message: 'Unauthorized Access' });
    }

});

app.use(function(err, req, res, next) {
    if (err.name === 'ValidationError') {
        var messages = {
            'required': '%s is required.'
        };

        //A validationerror can contain more than one error.
        var errors = [];

        //Loop over the errors object of the Validation Error
        _.each(err.errors, function(error) {
            if (_.has(messages, error.type) === true) {
                errors.push(util.format(messages[error.type], error.path));
            } else {
                errors.push(error.message);
            }
        });

        // return errors
        return res.json(400, { errors: errors }); // return error message
    } else if (err.name === 'MongoError' && err.code === 11000) {
        return res.json(400, { 'error': 'Cannot write to ' + req.params.model + ' at ID ' + req.params.id });
    } else {
        return res.json(err.status, { error: err.message });
    }
});

if (_.isUndefined(process.env.NODE_ENV) === true) {
    app.set('env', 'dev');
}

// Production configure
if ('prod' === app.get('env')) {

    console.info('**** PRODUCTION ****');

    app.use(errorHandler());
}

// DEV configure
if ('dev' === app.get('env')) {

    console.info('**** DEVELOPMENT ****');

    app.use(errorHandler({ dumpExceptions: true, showStack: true }));
    //  mongoose.set('debug', true);
}

api({ app: app });




var server = http.createServer(app);

// Socket.io server listens to our app
/*var io = require('socket.io').listen(server);

var app = express();
var server = require('http').createServer(app);*/

var io = require('socket.io')(server, {
    serveClient: true,
    path: '/socket.io-client'
});


io.on('connection', function(socket) {
    socket.emit('welcome', { message: 'Welcome!', id: socket.id });

    socket.on('connected', function(obj) {
        var sessionId = '';
        if (obj.sessionId !== undefined && obj.sessionId !== null && obj.sessionId !== '') {
            Client.add(socket.id, obj.sessionId);
            sessionId = Client.get(socket.id);
        }

        if (sessionId !== undefined && sessionId !== null && sessionId !== '') {
            console.log('connected:' + (new Date()))
            userStatus.setUserStatus(sessionId, true, '', '');
        }
    });

    socket.on('disconnect', function() {
        var sessionId = Client.get(socket.id);
        if (sessionId !== undefined && sessionId !== null && sessionId !== '') {
            console.log('disconnected:' + (new Date()))
            userStatus.setUserStatus(sessionId, false, '', '');
        }
    });

    socket.on('sendMessageT0All', function(obj) {
        io.sockets.emit('receiveMessage', { message: obj.message, id: socket.id }); // receives to sender as well
    });
});

/****************************/
/*        SERVER START      */
/****************************/
var startServer = function() {

    server.listen(app.get('port'), function() {
        console.log('Express server listening on port ' + app.get('port') + ' on ' + os.hostname());
    });
};
//envAndPort[setEnvType].ENV,
config.createConnection(function() {
    startServer();
    models();
    userStatus.setAllLoggedInStatusToFalse();
    userStatus.setVideoId();
});

var Client = {
    clients: {},
    add: function(index, value) {
        this.clients[index] = value;
    },
    delete: function(index) {
        delete this.clients[index];
    },
    get: function(index) {
        return this.clients[index];
    },
    getClientByUserId: function(userId) {
        for (var i in this.clients) {
            if (this.clients[i]['_id'] == userId) {
                return this.clients[i];
            }
        }
        return false;
    },
    getClientIdByUserId: function(userId) {
        for (var i in this.clients) {
            if (this.clients[i]['_id'] == userId) {
                return i;
            }
        }
        return false;
    }
};