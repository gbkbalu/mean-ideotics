var users = require('./users')
var videos = require('./videos')
var eventOptions = require('./options')
var events = require('./events')
var data = require('./data')
var categories = require('./categories')
var subcategories = require('./subcategories')
var icons = require('./icons')
var clients = require('./clients')
var cameras = require('./cameras')
var aws = require('./aws')
var usersession = require('./usersession')
var clientuploadedvideos = require('./clientuploadedvideos')
var ipconfig = require('./ipconfig')
var teams = require('./teams')
var common = require('./common')
var helpers = require('./helpers')

module.exports = exports = function(options) {
    'use strict';

    users({ app: options.app });
    videos({ app: options.app });
    eventOptions({ app: options.app });
    events({ app: options.app });
    data({ app: options.app });
    categories({ app: options.app });
    subcategories({ app: options.app });
    icons({ app: options.app });
    clients({ app: options.app });
    cameras({ app: options.app });
    aws({ app: options.app });
    usersession({ app: options.app });
    clientuploadedvideos({ app: options.app });
    ipconfig({ app: options.app });
    teams({ app: options.app });
    common({ app: options.app });
    helpers({ app: options.app });
};