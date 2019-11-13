'use strict';

var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

var helpersSchema = new Schema({
    orderId: {type: Number,unique:true},
    helpercode: {type: String, default:''},
    helpername: {type: String, default:''},
    description:{type: String, default:''},
    helpertext: {type: String, default:''}
});

helpersSchema.index({helpercode: 1});
mongoose.model('helpers', helpersSchema);
