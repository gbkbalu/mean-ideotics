'use strict';

var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

var ProjectSchema  = {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'clients'
};

var CameraSchema  = {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'cameras'
};

var UserSchema  = {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users'
};

var teamsSchema = new Schema({
    teamName: {type: String, required: true, unique: true},
    description: {type: String, default:''},
    user: [UserSchema],
    active: {type: Number, default: 1},
    project: ProjectSchema,
    camera:CameraSchema,
    docIsModified: {type: Boolean, default: true}
});

teamsSchema.index({teamName: 1});
mongoose.model('teams', teamsSchema);
