'use strict';

var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

var iconsSchema = new Schema({
    iconsId: {type: Number},
    name: {type: String, required: true},
    imageUrl: {type: String},
    docIsModified: {type: Boolean, default: true},
    refcatcode: {type: String, default: '0'},
    dateCreated: {type: Date, default: Date.now()}
});

iconsSchema.index({iconsId: 1});
mongoose.model('icons', iconsSchema);
