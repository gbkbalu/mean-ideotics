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
var categoriesSchema = new Schema({
    categoryId: {type: Number,default:0},
    name: {type: String, required: true},
    category: {type: String, required: true},
    catcode: {type: String, default: ''},
    isbase: {type: Boolean, default: false},
    isrepeats:{type: Boolean, default: false},
    isMandatory:{type: Boolean, default: false},
    shoporemp: {type: String, default:'E'},
    isHidden:{type: Boolean, default: false},
    docIsModified: {type: Boolean, default: true},
    isPrimary: {type: Number,default:1},
    orderId: {type: Number, default: 1},
    project: ProjectSchema,
    camera: CameraSchema,
    dateCreated: {type: Date, default: Date.now()},
    previous:{}
});

categoriesSchema.index({categoryId: 1});
categoriesSchema.index({project: 1});
categoriesSchema.index({camera: 1});
mongoose.model('categories', categoriesSchema);
