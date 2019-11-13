'use strict';

var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

var optionSchema = new Schema({
    optionId: {type: Number, required: true},
    name: {type: String, required: true},
    imageUrl: {type: String},
    category: {type: String, required: true},
    subCategory: {type: String, required: true},
    docIsModified: {type: Boolean, default: true},
    dateCreated: {type: Date, default: Date.now()}
});

optionSchema.index({optionId: 1});
mongoose.model('options', optionSchema);
