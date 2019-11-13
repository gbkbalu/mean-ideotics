'use strict';

var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

var UsersSchema  = {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users'
};

var userSessionSchema = new Schema({
    currentlyUsing: {type: Number, default: 0},
    loginTime: {type: Date, default: Date.now()},
    logOutTime: {type: Date, default: ''},
    userId :{type: String, required: true},
    traceIpAddress :{type: String, default:''},
    sessionId:{type: String, default:''},
    docIsModified: {type: Boolean, default: true},
    videoId: {type: String, default: ''},
    user: UsersSchema
});

mongoose.model('userssessions', userSessionSchema);
