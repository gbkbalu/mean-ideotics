'use strict';

var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

var CategorySchema  = {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'categories'
};

var ProjectSchema  = {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'clients'
};
var CameraSchema  = {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'cameras'
};
/*var IconSchema  = {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'icons'
};*/

var IconSchema = new Schema({
    icon: {type: mongoose.Schema.Types.ObjectId, ref: 'icons'},
    refcatcode: {type: String, default: '0'},
    alreadyIn: {type: Boolean, default: false},
    isDefault: {type: Boolean, default: false},
    _id:false
});

var subcategoriesSchema = new Schema({
    subcategoryId: {type: Number, required: true},
    name: {type: String, required: true},
    subCategory: {type: String, required: true},
    subcatcode: {type: String, default: ''},
    refcatcode: {type: String, default: '0'},
    dateCreated: {type: Date, default: Date.now()},
    orderId: {type: Number, default: 1},
    isMandatory:{type: Boolean, default: false},
    isHidden:{type: Boolean, default: false},
    autoCreated: {type: Boolean, default: false},
    isPrimary: {type: Number,default:0},
    docIsModified: {type: Boolean, default: true},
    percentage:{type:Number,default:0},
    category: CategorySchema,
    project: ProjectSchema,
    camera: CameraSchema,
    type:[IconSchema]
});

subcategoriesSchema.index({subcategoryId: 1});
subcategoriesSchema.index({project: 1});
subcategoriesSchema.index({camera: 1});
mongoose.model('subcategories', subcategoriesSchema);
