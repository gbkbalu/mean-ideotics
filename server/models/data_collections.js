'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var dataSchema = new Schema({

});

mongoose.model('data_collections', dataSchema);