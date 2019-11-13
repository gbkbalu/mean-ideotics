'use strict';

var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

var shopperProfileSchema = new Schema({

}, { strict: false });

mongoose.model('shopperprofiles', shopperProfileSchema);
