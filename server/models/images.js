'use strict';

var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

var imageSchema = new Schema({
    imageId: {type: Number, required: true},
    name: {type: String, required: true},
    imageUrl: {type: String},
    docIsModified: {type: Boolean, default: true},
    dateCreated: {type: Date, default: Date.now()}
});

imageSchema.index({imageId: 1});
mongoose.model('images', imageSchema);
