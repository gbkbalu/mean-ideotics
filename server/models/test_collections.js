'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var testSchema = new Schema({

});

mongoose.model('test_collections', testSchema);